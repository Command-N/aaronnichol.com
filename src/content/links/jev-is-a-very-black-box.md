---
title: "Jev Is a Very Black Box"
date: 2026-09-22
url: "https://simonwillison.net/2026/Sep/21/jev/"
---

Simon Willison cautions on the inscrutability of Jev:

> LLMs are black boxes already—you can ask them to justify their decisions, but you can’t guarantee that what they say is useful or accurate. 
> 
> Jev doesn’t even give you that: put in all the text you want, the only thing you’re going to get back is a floating-point number. If Jev marks something as spam, which content signals tipped it off?
> 
> This also means that concerns about bias should be front and centre. I really hope nobody uses Jev to rank job applicants—that floating-point number could conceal all manner of unseen bias baked into the models, and experimentally picking that bias apart is going to be a tricky business.

Bias is already an issue with classic LLMs, but at least you get a human-readable output to interrogate. Not so with Jev. 

Given how quickly this model has captured the zeitgeist and spawned demo after demo, it’s certain these decision models will become part of the standard toolkit for intelligent applications. We will need to proceed carefully when the stakes are high. 