---
title: Subtle dark-mode surfaces with `color-mix()`
link: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix
---

The blog post cards on this site need a card background that’s a touch lighter than the page in dark mode, but plain white in light mode. Instead of defining a third color variable, I mix the existing <span class="whitespace-nowrap">`--color-surface`</span> halfway into <span class="whitespace-nowrap">`--color-bg`</span> in the dark slot of `light-dark()`:

```css
.blog-post-card {
  background: light-dark(
    var(--color-bg),
    color-mix(in oklch, var(--color-surface) 50%, var(--color-bg))
  );
}
```

The `in oklch` interpolation keeps the perceived lightness even, so the card reads as “a step up from the page” without ever looking muddy. Change the theme’s surface or background tokens and every card adjusts for free.
