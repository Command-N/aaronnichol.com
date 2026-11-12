---
title: "The Golden Age of Software Experimentation"
date: 2026-11-12
---

This morning I came across this [Hacker News post](https://news.ycombinator.com/item?id=50453637) about a product named Threads by a company I’d never heard of, Atuin. Their core product is a shell extension to save command history for reuse, which isn't super relevant to me as I use the terminal less and less these days. I do see the appeal for people who still live in the terminal though, and they claim 500,000 users.

Threads, which they actually [announced](https://blog.atuin.sh/threads-agent-sessions/) a couple of weeks back, is something different and more of-the-moment. It captures and stores your interactions with AI coding agents like Codex and Claude for later reuse.

It may not be obvious to everyone, but when you work with an AI agent like Claude or Codex, the history of your conversations and tool calls is stored locally on your computer, even when you're using the Claude or Codex desktop apps.

Threads reads these conversations and converts them into a common, searchable format it can pass along to the next agent to continue working from. With this installed, you could start a task in the Codex app and pick it up in the Claude desktop app later, with the conversation and context retained. I haven't tried it, so can't comment on how well it works, but there’s a real problem to solve here.

I know several people, myself included, who have subscriptions to both ChatGPT and Claude. I first did this to get around hitting 5-hour limits on the base plans and being stuck. With two plans, when I'd hit a limit, I could just switch from one to the other and keep working. Two $20 USD-per-month plans are a lot cheaper than stepping up to the $100 USD tier on either.

The downside is that you end up with conversations and context scattered in multiple places, and it falls on you to remember what you did and where. Threads is one attempt to tackle this problem, but it’s not the only one. Apps like [T3 Code](https://t3.codes) and [Herdr](https://herdr.dev) take the opposite approach and wrap around whatever agent harnesses you use, in the hope of being your primary interface spanning multiple agents.

Products like these are launching every day, a lot of them open source. I’m not sure any of them will ever make money, but the animal spirits are high right now. We are in the midst of an explosion of experimentation around how we work with agents, and the comments from the Threads announcement are telling. Mostly it’s people saying they have built something similar.

I don't know where this ultimately goes, but there's a battle underway. In one corner are the labs that want to provide the fully integrated end-to-end experience to keep users locked into their platform and paying for their subscriptions and/or tokens. In the other corner is a counter-movement to intermediate these tools and reduce them to a commodity of sorts.

It’s ironic—and yes, sure, wasteful—that so many builders are paying Anthropic and OpenAI for compute so they can wrap an app of their own around them. It’s also a lot of fun.

But let’s be real. The labs have a ton of leverage here and can tighten the screws in many ways, whenever they like, especially around their subscriptions and terms of service. The AI bubble is keeping the party alive for now, but once the music stops, we can expect the labs to become a lot less generous. If that happens, we may look back on this as a golden age of product discovery and experimentation.