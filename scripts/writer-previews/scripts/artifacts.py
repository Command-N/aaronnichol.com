"""Download GitHub artifacts without forwarding credentials; extract only bounded data."""
import argparse
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import urllib.error
import urllib.request
import zipfile


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def extract(archive, destination, *, evidence_only=False):
    root = Path(destination)
    root.mkdir(parents=True, exist_ok=False)
    with zipfile.ZipFile(archive) as zipped:
        entries = zipped.infolist()
        if len(entries) > 20000 or sum(e.file_size for e in entries) > 200 * 1024 * 1024:
            raise ValueError('Artifact exceeds extraction limits')
        seen = set()
        for entry in entries:
            name = entry.filename
            path = PurePosixPath(name)
            mode = entry.external_attr >> 16
            if ('\\' in name or ':' in name or '\x00' in name or path.is_absolute() or
                    '..' in path.parts or not path.parts or str(path) in seen or
                    (stat.S_IFMT(mode) not in (0, stat.S_IFREG, stat.S_IFDIR)) or
                    entry.file_size > 25 * 1024 * 1024 or entry.flag_bits & 1):
                raise ValueError('Unsafe artifact entry')
            if evidence_only and (len(path.parts) != 1 or path.suffix != '.json'):
                raise ValueError('Expected cleanup evidence JSON only')
            seen.add(str(path))
        # Validation happens before any archive entry is written.
        for entry in entries:
            target = root.joinpath(*PurePosixPath(entry.filename).parts)
            if entry.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with zipped.open(entry) as source, target.open('xb') as output:
                    shutil.copyfileobj(source, output)
                target.chmod(0o600)


def api(path, *, download=None):
    request = urllib.request.Request('https://api.github.com' + path, headers={
        'Authorization': 'Bearer ' + os.environ['GH_TOKEN'],
        'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
    })
    opener = urllib.request.build_opener(NoRedirect)
    try:
        response = opener.open(request, timeout=30)
    except urllib.error.HTTPError as error:
        if download is None or error.code != 302:
            raise RuntimeError(f'GitHub request failed: HTTP {error.code}') from None
        url = error.headers['Location']
        if not url.startswith('https://'):
            raise ValueError('Insecure artifact redirect')
        # No Authorization header goes to GitHub's artifact storage.
        response = urllib.request.urlopen(url, timeout=30)
    with response:
        if download is None:
            return json.load(response)
        count = 0
        with Path(download).open('xb') as output:
            while chunk := response.read(1024 * 1024):
                count += len(chunk)
                if count > 200 * 1024 * 1024:
                    raise ValueError('Compressed artifact exceeds limit')
                output.write(chunk)


def pages(path, key):
    for page in range(1, 101):
        data = api(f'{path}?per_page=100&page={page}')[key]
        yield from data
        if len(data) < 100:
            return
    raise ValueError('Artifact pagination bound exceeded')


def download(config, run_id, sha, destination):
    if not re.fullmatch(r'[0-9a-f]{40}', sha) or not re.fullmatch(r'[0-9]+', run_id):
        raise ValueError('Invalid artifact source')
    base = '/repos/' + config['repository']
    artifacts = list(pages(f'{base}/actions/runs/{run_id}/artifacts', 'artifacts'))
    found = [a for a in artifacts if a['name'] == 'writer-static-' + sha and not a['expired']]
    if len(found) != 1:
        raise ValueError('Expected one immutable artifact for the exact build revision')
    archive = str(destination) + '.zip'
    api(f"{base}/actions/artifacts/{found[0]['id']}/zip", download=archive)
    extract(archive, destination)


def history(config, destination):
    root = Path(destination)
    root.mkdir(parents=True, exist_ok=False)
    base = '/repos/' + config['repository']
    candidates = sorted(pages(f'{base}/actions/artifacts', 'artifacts'),
                        key=lambda a: (a['created_at'], a['id']), reverse=True)
    for artifact in candidates:
        if not artifact['name'].startswith('writer-cleanup-evidence-') or artifact['expired']:
            continue
        run_id = artifact['workflow_run']['id']
        run = api(f'{base}/actions/runs/{run_id}')
        if (run['path'] != '.github/workflows/writer-preview-cleanup.yml' or
                run['head_branch'] != config['defaultBranch'] or
                run['event'] not in ('delete', 'schedule', 'workflow_dispatch') or
                run['head_repository']['full_name'] != config['repository']):
            continue
        archive = root / f"{artifact['id']}.zip"
        api(f"{base}/actions/artifacts/{artifact['id']}/zip", download=archive)
        extract(archive, root / str(artifact['id']), evidence_only=True)
        # Every trusted run records a cumulative snapshot under the shared lock.
        # Only the newest snapshot is needed, rather than downloading 90 days of runs.
        return


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=['download', 'history'])
    parser.add_argument('--config', required=True)
    parser.add_argument('--destination', required=True)
    parser.add_argument('--run-id')
    parser.add_argument('--sha')
    args = parser.parse_args()
    config = json.loads(Path(args.config).read_text())
    if args.mode == 'download':
        download(config, args.run_id, args.sha, Path(args.destination))
    else:
        history(config, args.destination)
