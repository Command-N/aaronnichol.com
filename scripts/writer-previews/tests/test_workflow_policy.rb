require 'yaml'
require 'minitest/autorun'

class WorkflowPolicyTest < Minitest::Test
  ROOT = [File.expand_path('../.github/workflows', __dir__),
          File.expand_path('../../../.github/workflows', __dir__)].find do |path|
    File.file?(File.join(path, 'writer-preview-build.yml'))
  end || raise('Writer preview workflows not found in package or publishing repository')

  PROBE = 'writer-preview-isolation-probe.yml'

  def workflows
    Dir[File.join(ROOT, 'writer-preview-*.yml')].to_h { |path| [File.basename(path), YAML.load_file(path)] }
  end

  def test_actions_are_official_and_pinned_to_full_commits
    workflows.each_value do |workflow|
      workflow.fetch('jobs').each_value do |job|
        job.fetch('steps').each do |step|
          next unless step['uses']
          assert_match %r{\Aactions/(checkout|setup-node|upload-artifact)@[0-9a-f]{40}\z}, step['uses']
          if step['uses'].start_with?('actions/checkout@')
            assert_equal false, step.fetch('with').fetch('persist-credentials')
          end
        end
      end
    end
  end

  def test_untrusted_build_has_no_environment_or_deployment_credentials
    build = workflows.fetch('writer-preview-build.yml').fetch('jobs').fetch('build')
    refute build.key?('environment')
    refute_match /CLOUDFLARE|secrets\.|cache:/, build.to_s
    assert_equal '${{ needs.resolve.outputs.sha }}', build.fetch('steps').first.fetch('with').fetch('ref')
  end

  def test_credential_jobs_only_execute_trusted_code_and_share_mutation_lock
    workflows.each do |name, workflow|
      next if name == PROBE # This deliberately requests the forbidden Environment; its policy is tested below.
      workflow.fetch('jobs').each_value do |job|
        next unless job.to_s.include?('CLOUDFLARE_PREVIEW_EDIT_TOKEN')
        assert_equal 'writer-previews', job.fetch('environment')
        assert_equal 'writer-preview-project', job.fetch('concurrency').fetch('group')
        assert_equal 'max', job.fetch('concurrency').fetch('queue')
        assert_equal false, job.fetch('concurrency').fetch('cancel-in-progress')
        assert_equal '${{ github.sha }}', job.fetch('steps').first.fetch('with').fetch('ref')
        job.fetch('steps').each do |step|
          next unless step.to_s.include?('secrets.CLOUDFLARE_PREVIEW_EDIT_TOKEN')
          assert_match /\Anode scripts\/writer-previews\/scripts\/preview\.mjs (upload|plan-cleanup|apply-cleanup)\z/, step.fetch('run')
        end
      end
    end
  end

  def test_automatic_jobs_are_opt_in_and_initial_deletion_is_dry_run
    workflows.each do |name, workflow|
      next if name == PROBE
      entry = workflow.fetch('jobs').values.first
      assert_includes entry.fetch('if'), "vars.WRITER_PREVIEW_AUTOMATION_ENABLED == 'true'"
    end
    cleanup = workflows.fetch('writer-preview-cleanup.yml')
    triggers = cleanup['on'] || cleanup[true] # System Ruby's YAML 1.1 parser treats 'on' as true.
    assert_equal false, triggers.fetch('workflow_dispatch').fetch('inputs').fetch('delete_previews').fetch('default')
    steps = cleanup.fetch('jobs').fetch('cleanup').fetch('steps')
    persisted = steps.index { |s| s['name'] == 'Persist recovery evidence before deleting anything' }
    applied = steps.index { |s| s['run']&.end_with?('apply-cleanup') }
    assert_operator persisted, :<, applied
    assert_includes steps[applied].fetch('env').fetch('DELETE_PREVIEWS'), "vars.WRITER_PREVIEW_DELETION_ENABLED == 'true'"
  end

  def test_isolation_probe_only_dispatches_from_disposable_preview_refs_and_never_prints_secret
    assert_equal %w[writer-preview-build.yml writer-preview-cleanup.yml writer-preview-isolation-probe.yml writer-preview-upload.yml], workflows.keys.sort
    probe = workflows.fetch(PROBE)
    triggers = probe['on'] || probe[true]
    assert_equal ['workflow_dispatch'], triggers.keys
    assert_equal({}, probe.fetch('permissions'))
    job = probe.fetch('jobs').fetch('must-be-rejected')
    assert_equal 'writer-previews', job.fetch('environment')
    assert_equal "github.repository == 'Command-N/aaronnichol.com' && github.event_name == 'workflow_dispatch' && startsWith(github.ref, 'refs/heads/preview/reliability-')", job.fetch('if')
    assert_equal 1, job.fetch('steps').length
    step = job.fetch('steps').first
    assert_equal 'test -z "$PROBE_SECRET"', step.fetch('run')
    assert_equal({ 'PROBE_SECRET' => '${{ secrets.CLOUDFLARE_PREVIEW_EDIT_TOKEN }}' }, step.fetch('env'))
    refute step.key?('uses')
  end

  def test_user_input_is_passed_as_data_and_workflow_permissions_are_read_only
    workflows.each_value do |workflow|
      assert workflow.fetch('permissions').values.all? { |v| v == 'read' }
      workflow.fetch('jobs').each_value do |job|
        assert job.fetch('permissions', {}).values.all? { |v| v == 'read' }
        job.fetch('steps').each do |step|
          refute_match /\$\{\{.*(inputs\.|event\.ref|head_branch)/, step.fetch('run', '')
        end
      end
    end
  end

  def test_job_environment_does_not_reference_runner_only_contexts
    # GitHub resolves jobs.<job_id>.env before assigning a runner.
    # https://docs.github.com/en/actions/reference/workflows-and-actions/contexts
    workflows.each_value do |workflow|
      workflow.fetch('jobs').each_value do |job|
        refute_match /\$\{\{[^}]*\b(runner|steps|job|env)\./, job.fetch('env', {}).to_s
      end
    end
  end
end
