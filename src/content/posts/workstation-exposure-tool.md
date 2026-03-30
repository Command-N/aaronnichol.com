---
title: Workstation Exposure Tool
date: 2026-03-30
---
Last week's [LiteLLM supply chain attack](https://futuresearch.ai/blog/litellm-pypi-supply-chain-attack/) got me wondering how exposed I would have been if I'd installed the compromised package.

I had Claude build me a MacOS-specific shell tool to check. I've called it the Workstation Exposure Tool and [published](https://github.com/Command-N/workstation-exposure-audit) it for anyone to download and use.

I wanted something that I could run locally without installing any packages, making network calls, reading credentials to memory, or sending sensitive data externally (for example, asking an LLM to look for exposed credentials across my machine).

My scan come up clean, so I created a some mock credentials to test it worked, and the tool found them all, which was encouraging. A disclaimer though. I have definitely not pushed the boundaries of the script. I'm also not making any claims about how comprehensive, reliable or accurate the scan is. If you want to try this out please read the code yourself to see how it works, and expect to hit bugs. Ctrl+C if it gets stuck while running.
