---
title: "Ask Your LLM to Work Itself Out of a Job"
date: 2026-05-10
---

When I was a fresh-faced consultant working at IBM in the 2010s, one of my first gigs was wrangling Microsoft Project and Excel in the PMO of a large greenfield IT program. There was a wave of investment into Australian resources at the time, which created a boom in IT work as these companies stood up their systems from scratch. 

The PMO was the last place I wanted to be, and much to the chagrin of the Account Partner, I accepted it kicking and screaming. From day 1, I was determined to cut my 18-month assignment in half, by any means necessary. 

The path of least resistance, or rather the only path available to me at the time, was to create an elaborate Excel spreadsheet that did all of the time and finance tracking and reporting with just a few clicks. What was taking me the better part of a week at the start, was down to a couple of hours by month 9. I showed my manager how it worked so he could survive without me, and I lobbied the client to let me go. It worked (!) and soon I was doing more interesting work. 

I feel this way about LLMs today.

The best tokens are expensive and there is no sign they are going to get cheaper any time soon. At the frontier, things are heading in the other direction. So I think it's imperative that we use those tokens to their fullest extent by asking our LLMs to make themselves obsolete for certain tasks.

Not only is this more efficient, it's also more consistent. You're taking a non-deterministic language model and asking it to create something deterministic. There are different levels to this depending on whether something is a one-off, an occasional activity, or a daily workflow. 

1. **One-off complex modelling: Create an HTML artifact.** 
Say you want help deciding whether to keep your current car or buy a new one on a novated lease. Ask for a calculator with all the variables and other knobs you want to tweak and you can run as many scenarios as you like without burning another token. Yesterday, I linked to Thariq Shihipar's [article](https://x.com/trq212/status/2052809885763747935?s=46&t=eLyaRLUh829PgS6rd6qnnQ) on the various ways you can use HTML with Claude Code. There are plenty of fresh ideas in there. 
2. **Routine data task: Create a script.** 
This is ideal when you want to do something complex more than a few times, with consistency. I like this one when you want to process data without sending it to a cloud service. For example, you want to categorise your monthly expenses from a CSV. Create a script you can run locally, and for bonus points ask for an HTML file you can use to open the output and visualise it for you. You could do this in Excel but it's a lot of clicking. An LLM can create this all with a well-crafted prompt or two. Once you have the basic script in place you can even automate what it does with the script. I [wrote about](https://aaronnichol.com/2026/03/workstation-exposure-tool/) a script I created to locally check my vulnerability to a supply chain attack, without exposing any secrets to an LLM. 
3. **Something you do, or want to do, every day: Build an app.**
This is where things go from a couple of prompts to a serious project. It's also where you will find the greatest leverage and have the most fun. In my case, I've spent north of $500 in API LLM credits building a Swift iOS and Mac app for my reading and writing workflow, and I have a backlog of more than 60 feature ideas and improvements that will probably cost me hundreds or thousands more to complete. This is a meaningful sum and it's an involved process but once it's built I get leverage from this for as long as I use and maintain it. 

I could have used an LLM to chat and reason about different scenarios for making a car buying decision. I could have (naively) used a coding LLM to mine my machine for secrets and tell me how exposed I am. I could have asked a coding LLM to publish my writing to GitHub every time. Instead I used the LLM to work itself out of these jobs. 

I encourage you to do the same.