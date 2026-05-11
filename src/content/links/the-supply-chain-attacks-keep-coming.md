---
title: "The Supply Chain Attacks Keep Coming"
date: 2026-05-12
url: "https://www.stepsecurity.io/blog/mini-shai-hulud-is-back-a-self-spreading-supply-chain-attack-hits-the-npm-ecosystem"
---

> On May 11, 2026, the Mini Shai-Hulud worm, a self-propagating malware that spreads by stealing CI/CD secrets, compromised several @tanstack npm packages, collectively downloaded millions of times per week. The attack injected a 2.3 MB obfuscated credential-stealing payload into one of the most widely used React routing libraries and published the malicious versions through the project's own GitHub Actions release pipeline using hijacked OIDC tokens, making it the first documented case of a self-spreading npm worm that carries valid SLSA provenance attestations. The worm has since spread beyond TanStack to other packages in the npm ecosystem.

Another day, another npm supply chain attack. The list of compromised packages is long, and still growing. 