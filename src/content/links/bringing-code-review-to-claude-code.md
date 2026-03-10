---
title: Bringing Code Review to Claude Code
url: https://claude.com/blog/code-review
date: 2026-03-11
---
Claude Blog:

>Today we're introducing Code Review, which dispatches a team of agents on every PR to catch the bugs that skims miss, built for depth, not speed. It's the system we run on nearly every PR at Anthropic. Now in research preview for Team and Enterprise.

From the [docs](https://code.claude.com/docs/en/code-review):

>Code Review is billed based on token usage. Reviews average $15-25, scaling with PR size, codebase complexity, and how many issues require verification.

$15-25 per review might seem expensive, especially for individuals (assuming this expands to all users soon) and small teams, but for an enterprise that stakes their reputation on software, this is a small price to pay.

Code review is a painful bottleneck for any software team. I've seen PR reviews sit for *days* because a senior engineer familiar with the code base is sick or too busy. A 20 minute AI review that can run anytime will help teams move faster *and* give senior engineers more time to focus on design and architecture.

> Costs appear on your Anthropic bill regardless of whether your organization uses AWS Bedrock or Google Vertex AI for other Claude Code features.

Anthropic is bypassing the cloud provider layer entirely with Code Review and establishing a set of products on top of their models to capture value the cloud providers can't repackage and sell. I couldn't find pricing details on [Claude Code Security](https://claude.com/solutions/claude-code-security) but I suspect it's the same story.

This protects Anthropic's margins, builds direct procurement relationships with enterprises who have been using Bedrock or Vertex until now, and creates switching costs that lock enterprises into Anthropic.
