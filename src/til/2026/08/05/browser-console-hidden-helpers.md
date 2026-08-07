---
title: "The browser console’s hidden helpers"
link: https://developer.chrome.com/docs/devtools/console/utilities
---

The DevTools console comes with a handful of built-in helpers. The one I’ve found most useful is `$0`, which references the currently inspected element. In {% sidenote-ref label="browser-support" %}Chromium-based browsers{% /sidenote-ref %}, the four previously inspected elements are also available as `$1`–`$4`, making it easy to jump among them without repeatedly calling `document.querySelector()`.

{% sidenote label="browser-support" %}
Firefox supports `$0`, `$_`, `$(selector)`, `$$(selector)`, and `$x(path)`, but not Chromium’s `$1`–`$4` inspected-element history. Safari supports the same helpers, but its `$1`–`$99` refer to previous **console evaluation results**, not previously inspected elements.
{% /sidenote %}

A few other shortcuts are surprisingly handy, too:

- `$_` — the result of the previous expression
- `$(selector)` — shortcut for `document.querySelector(selector)`
- `$$(selector)` — shortcut for `document.querySelectorAll(selector)`
- `$x(path)` — evaluates an XPath expression and returns matching elements

The selector helpers accept an optional second argument—a `startNode` to search within instead of the entire document. Since they return DOM nodes, they compose nicely: `$$("li", $("ul"))` returns all list items within the first unordered list, and `$("button", $0)` finds a button within the currently inspected element.
