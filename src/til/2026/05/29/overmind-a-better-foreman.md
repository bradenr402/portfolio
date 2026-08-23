---
title: "Overmind: A better foreman"
link: https://github.com/DarthSim/overmind
---

I’ve used Foreman for years to run Rails applications from a `Procfile`, but recently switched to Overmind. It’s largely compatible, so most existing {% sidenote-ref label="procfile-dev" %}`Procfile` setups{% /sidenote-ref %} work without modification:

```bash
brew install tmux overmind
overmind start
```

{% sidenote label="procfile-dev" %}
To use a `Procfile.dev` by default, create a `.overmind.env` file with:

```dotenv
OVERMIND_PROCFILE=Procfile.dev
```

Overmind reads it automatically, so `overmind start` alone starts your development processes.
{% /sidenote %}

Rather than piping every process’s output into a single combined stream, Overmind runs on top of `tmux`: it starts a single `tmux` session and gives each `Procfile` process its own window. You can attach to the session in any terminal with:

```bash
overmind connect
```

Given this `Procfile`:

```
web: bin/rails server -b 0.0.0.0 -p 3001
css: bin/rails tailwindcss:watch
```

You get `web` and `css` windows, switchable with the usual `tmux` bindings. {% sidenote-ref label="tmux-prefix" %}To detach{% /sidenote-ref %} without killing anything, hit your tmux prefix and then <kbd>D</kbd> (<kbd>Ctrl</kbd>+<kbd>B</kbd>, <kbd>D</kbd>).

{% sidenote label="tmux-prefix" %}
If you’re already inside `tmux`, the outer session intercepts your prefix, so use <kbd>Ctrl</kbd>+<kbd>B</kbd>, <kbd>Ctrl</kbd>+<kbd>B</kbd>, <kbd>D</kbd> to detach only from the Overmind session.
{% /sidenote %}

You can also attach to a single process whenever you need to:

```bash
overmind connect web
```

This is particularly useful when a Rails process hits a `debugger` breakpoint—you get a real interactive prompt instead of a garbled shared log.


Overmind also has single-letter aliases, and I added an `om` shell alias to make the commands even quicker:

```bash
om s       # start
om r       # restart
om c       # connect to the session
om c web   # connect to one process
om q       # quit
```
