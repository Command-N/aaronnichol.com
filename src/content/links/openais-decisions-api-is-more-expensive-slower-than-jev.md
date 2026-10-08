---
title: "OpenAI’s Decisions API is More Expensive, Slower Than Jev"
date: 2026-10-07
url: "https://developers.openai.com/api/docs/guides/decisions"
---

OpenAI released their Decisions API today:

> With gpt-6-luna, input costs $0.10 per 1M tokens. You pay only for input tokens: there are no cache-read, cache-write, or output-token charges.

Over twice the price of Jev for inputs but still remarkably cheap. Native image support is nice and supports up to 128 images per request. 

I ran a quick showdown between Jev and the Decisions API. I fed them 2,000 documents and two classification labels:

| | Decisions API | Jev |
|--|--:|--:|
| Input / MTok | $0.10 | $0.042 |
| p50 | 124 ms | 76 ms |
| p95 | 443 ms | 128 ms |
| Est. cost | $0.161 | $0.088 |
| Label 1 agree | 93.6% | |
| Label 2 agree | 93.2% | |
| Both agree | 87.4% | |

I’m not comparing against a golden dataset, so I can’t say whether they were right or not, but they do reach the same conclusion in most cases. Jev has fatter inputs but the cost still lands around half of the Decisions API, and it’s much faster.
