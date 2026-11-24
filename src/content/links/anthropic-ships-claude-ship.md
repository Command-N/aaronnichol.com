---
title: "Anthropic Ships Claude Ship"
date: 2026-11-24
url: "https://claude.com/resources/articles/introducing-claude-ship"
---

Anthropic:

> It [Claude Ship] can review PRs, fix them, and decide what's ready to merge based on policies each team sets. Teams stay in control of where it runs and which changes need a person. The goal: ship code as fast as teams write it. [...] Claude Ship is made up of [Code Review,](https://claude.com/resources/articles/code-review-is-now-generally-available) which is already generally available, and two new agents in beta: PR Steward and Claude Approvals. Together, they take a pull request through review, fixes, and an approval decision so teams don't have to manage each step manually.

I was half-expecting a Claude-themed cruise liner based on the name, so I was a tad disappointed to learn it's just a bundle of agents, alas.

In a nutshell, Claude Code already writes the code; Claud Ship reviews it, fixes it, and approves it to ship. Humans set the direction and the rules.

I'm sure some will read this announcement and wince. They might say, "Our skills are going to atrophy" or "nobody's going to know what's been shipped" or "we're putting too much faith and trust in these models" or "we're making ourselves too dependent on AI." All of that may be true, but I prefer to see the glass as half full.

Where code is the medium, tools like these represent a kind of [desire path](https://en.wikipedia.org/wiki/Desire_path) for taking an idea or objective through to an outcome. Forget glass-half-full. This could be more like a glass-of-ice-water-in-hell for people in some companies, where the existing path to production is littered with all sorts of obstacles and inefficiencies.

We should pour one out for human code review, though. It had a great run, but it scaled terribly and was never going to survive AI unleashing our (human) potential to build fast.

To me, there's a bright future here as models continue to improve and the agents and harnesses we wrap around them get more and more refined and reliable. In this future, our role as humans would be to 1) set up the right tools, 2) set the rules and guardrails based on our appetite for risk, and 3) get out of the way, unless there's an exception.

One catch is the cost:

> Claude Ship usage is billed on tokens, so turning it on can add to an organization's costs. The amount depends on the number and size of pull requests covered, the review level, how often reviews run, and how much work PR Steward does.

I'd expect a lot of CIO/CFO types to be nervous about rolling this out across an organisation, because it could quickly become a big, uncontrolled cost driver.

Once people get used to the new desire path, they won't want to go back to the old one. Instead, they'll use the time this gives them back to tackle more ambitious goals and generate even more PRs for Claude Ship to work on. That's great for Anthropic, not necessarily for the customer's bottom line.

Via [9to5Mac](https://9to5mac.com/2026/11/23/anthropic-launches-new-claude-ship-feature-for-builders/)