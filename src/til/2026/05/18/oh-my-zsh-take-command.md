---
title: "Oh My Zsh’s `take` command"
---

The Oh My Zsh `take` command is basically a shortcut for “set something up and immediately `cd` into it.” At its simplest, it wraps `mkdir -p` + `cd`, but it extends the same idea to git repositories and remote archives.

For local work, it behaves like a smarter `mkdir` that keeps you in context. So instead of creating a folder and then moving into it manually, you just do:

```bash
take my/new/project
```

This creates the full path if needed and drops you into the final directory.

It also supports git repositories. If you pass a git URL, it will clone the repo and immediately enter it:

```bash
take git@github.com:rails/rails.git
```

You end up inside the cloned repository right away, which removes the usual “`git clone` → `cd`” sequence. It’s especially useful when quickly inspecting or experimenting with a repo.

There’s similar handling for remote archives. If the argument looks like a `.tar.gz`, `.tar.xz`, or similar tarball, it will download it, extract it, and then move into the extracted directory:

```bash
take https://example.com/project.tar.gz
```

This is basically a “download source distribution and enter workspace” shortcut, assuming the archive has a sensible top-level directory structure.

ZIP files are handled similarly. A ZIP URL gets downloaded and unzipped into the current directory, and `take` then tries to infer the extracted root folder and `cd` into it:

```bash
take https://example.com/project.zip
```

This one is a bit more heuristic than the tar handling, since ZIP archives are less consistent in how they structure top-level directories.

---

Under the hood, `take` is just a dispatcher that decides which of these behaviors to trigger based on the input pattern: local paths go to `mkcd` / `takedir`, git URLs go to `takegit`, tar archives go to `takeurl`, and zip archives go to `takezip`. The consistent idea across all of them is eliminating the repeated setup steps, so every operation ends with you already inside the working directory.

