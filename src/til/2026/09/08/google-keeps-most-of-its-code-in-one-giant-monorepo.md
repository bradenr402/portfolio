---
title: Google keeps most of its code in one giant monorepo
link: https://cacm.acm.org/research/why-google-stores-billions-of-lines-of-code-in-a-single-repository/
---

Google keeps the vast majority of its source code in a single monorepo, internally known as **google3**. It serves as a common source of truth for tens of thousands of developers and contains code spanning products like Search, Gmail, Google Cloud, and the infrastructure behind them.

The repository contains **billions of lines of code** across millions of source files, with thousands of developers making changes to it every day. Google built its own version-control system, **Piper**, to handle this scale. As [Ajit Singh explains](https://singhajit.com/how-google-manages-its-monorepo/), Google’s development environment also includes tools for dependency management, distributed builds, code search, and working with only the relevant portions of the repository.

Keeping everything together gives Google some unusual advantages. Developers can reuse code without publishing it as a separate package, dependencies can be changed across projects in a single change, and large-scale refactors can happen atomically. Engineers also have a consistent view of the codebase rather than each team maintaining isolated repositories.
