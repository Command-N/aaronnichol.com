---
title: "Github Copilot closes the chapter on cheap AI"
date: 2026-04-29
url: "https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/"
---

GitHub company news blog earlier this week:

> Today, we are announcing that all GitHub Copilot plans will transition to usage-based billing on June 1, 2026

This shouldn't come as a surprise to anyone paying attention, but it's still going to be very uncomfortable for businesses and enterprises that have based their budgets on heavily subsidised per-seat plans which will soon be a lot less useful.

> Instead of counting premium requests, every Copilot plan will include a monthly allotment of GitHub AI Credits, with the option for paid plans to purchase additional usage. Usage will be calculated based on token consumption, including input, output, and cached tokens, using the listed API rates for each model.

I'm not a fan of these credit models. They're akin to buying chips at a casino. Of course, this works for casinos, and it might work here, but AI compute isn't (or at least shouldn't be) gambling.

I've been using Claude Code via the API recently, and while it is gobsmackingly expensive, I actually *like* seeing my spend in dollars rather than hidden behind credits or an opaque subscription (although it irks me that everything is USD-denominated in Anthropic's Console). I went as far as building a Mac menu bar app that tracks my spend in real time and does the currency conversion for me.

Because I can see what I'm spending, I've changed my behaviour to manage token burn: using /clear when I'm done with a task; editing .md docs to provide feedback on plans rather than sending multiple short messages; using lower cost subagents for smaller tasks; enabling 1hr prompt caching when I know I'm going to get interrupted during a session. These all add up to real cost savings.

Let me illustrate this with an example that might help those who have never seen the true cost of their AI use before. Imagine you are in the middle of a coding session with Opus 4.7 1m, default 5 minute cache TTL. You've been working for an hour and have 400k tokens in the context window when you decide to go make a coffee. When you return 10 minutes later, you write to Claude "back, what's next" and Claude rewrites the entire context window to cache at a cost of USD $2.50 ($5 x 1.25 x 400,000). That is an expensive coffee!

> Base plan pricing is not changing. Copilot Pro remains $10/month, Pro+ remains $39/month, Business remains $19/user/month, and Enterprise remains $39/user/month.

I can say from experience that people will be shocked by how little they can get done with $10 or even $39 when these changes take effect.
