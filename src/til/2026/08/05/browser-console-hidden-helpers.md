---
title: "The browser console’s hidden helpers"
link: https://developer.chrome.com/docs/devtools/console/utilities
---

I’d seen the `== $0` hint in my browser console countless times. Somehow, I never stopped to wonder what it _meant_. When you hover over the `== $0`, a tooltip appears that says, “_Use $0 in the console to refer to this element._”

<figure>
  ![Chrome DevTools console showing the `== $0` prompt with a tooltip that says, “Use $0 in the console to refer to this element.”](browser-console-use-0.webp)
  <figcaption>The `$0` shortcut was right under my nose all this time!</figcaption>
</figure>

It turns out `$0` is one of the most useful DevTools shortcuts: it references the currently inspected element. In {% sidenote-ref label="firefox" %}Chromium-based{% /sidenote-ref %} {% sidenote-ref label="safari" %}browsers{% /sidenote-ref %}, the four previously inspected elements are also available as `$1`–`$4`, making it easy to jump among them without repeatedly calling `document.querySelector()`.

{% sidenote label="firefox" %}
**Firefox** supports `$0`, `$_`, `$(selector)`, `$$(selector)`, and `$x(path)`, but not Chromium’s `$1`–`$4` inspected-element history.  
{% /sidenote %}

{% sidenote label="safari" %}
**Safari** supports the same helpers, but its `$1`–`$99` refer to previous _console evaluation results_, not previously inspected elements.
{% /sidenote %}

The DevTools console has a few other shortcuts that are surprisingly handy, too:

- `$_` — the result of the previous expression
- `$(selector)` — shortcut for `document.querySelector(selector)`
- `$$(selector)` — shortcut for `document.querySelectorAll(selector)`
- `$x(path)` — evaluates an XPath expression and returns matching elements

The selector helpers accept an optional second argument—a `startNode` to search within instead of the entire document. Since they return DOM nodes, they compose nicely: `$$("li", $("ul"))` returns all list items within the first unordered list, and `$("button", $0)` finds a button within the currently inspected element.
