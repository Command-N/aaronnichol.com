---
title: "An update on recent Claude Code quality reports"
date: 2026-04-23
url: "https://www.anthropic.com/engineering/april-23-postmortem"
writer-id: 8DA78E52-52F9-4AC0-A049-947D2158FF8D
---

Anthropic came out today with a detailed breakdown of a few recent Claude Code issues that degraded its intelligence and made it feel lazy to many: 

> Over the past month, we’ve been looking into reports that Claude’s responses have worsened for some users. We’ve traced these reports to three separate changes that affected Claude Code, the Claude Agent SDK, and Claude Cowork. The API was not impacted.

There were three causes: (1) switching the default thinking from high to medium, which most users did not change back; (2) a side-effect bug that cleared history perpetually after a session went stale for over an hour; (3) a system prompt directive to keep messages short between tool calls and in the final message, which backfired.​​​​​​​​​​​​​​​​

The transparency is welcome and they’ve reset subscriber usage limits along with the update, but this is all pretty messy.  

Clearly these agent harnesses are finicky, and it doesn’t help that Anthropic is constantly twiddling the knobs. Perhaps the real news here is that, according to the post, none of these issues affected API users. I didn’t experience any obvious issues over the past month; now I know why, as I’m mostly using the API for Claude Code (for reasons I’ll explain another time).​​​​​​​​​​​​​​​​

If you’re on a subscription plan, your experience of Claude Code is subject to frequent change, as Anthropic try to manage supply and demand. If you’re paying ~20x as much for the same work, you get a more reliable experience. 
