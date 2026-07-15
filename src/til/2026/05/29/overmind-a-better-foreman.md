---
title: "Overmind: A better foreman"
link: https://github.com/DarthSim/overmind
---

I’ve used Foreman for years to run Rails applications from a `Procfile`, but recently switched to Overmind.

Overmind is largely compatible with Foreman, so most existing `Procfile`-based setups work without modification:

```bash
brew install tmux overmind
overmind start
```

The main advantage I’ve found is debugging. Since Overmind runs each process in its own `tmux` pane, you can connect directly to a process when needed:

```bash
overmind connect web
```

This is particularly useful when a Rails process hits a `debugger` breakpoint.

A few other commands I’ve found useful:

```bash
overmind restart
overmind quit
```

Overmind also provides single-letter aliases for many commands:

```bash
overmind s      # start
overmind r      # restart
overmind c web  # connect
overmind q      # quit
```

I also added an `om` shell alias for `overmind` to make the commands even quicker:

```bash
om s
om r
om c web
om q
```

For Rails applications that already use `foreman start`, replacing Foreman with Overmind has been mostly seamless.
