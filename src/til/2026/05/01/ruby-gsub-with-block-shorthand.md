---
title: Ruby’s `gsub` accepts a block via `&:` shorthand syntax
link: https://docs.ruby-lang.org/en/3.4/String.html#class-String-label-Substitution+Methods
---

You may already know you can pass a block to `gsub` like this:

```ruby
"the html spec and some css tricks".gsub(/\b(html|css)\b/) { it.upcase }
# => "the HTML spec and some CSS tricks"
```

But you can make this even simpler by using the `&:` shorthand syntax:

```ruby
"the html spec and some css tricks".gsub(/\b(html|css)\b/, &:upcase)
# => "the HTML spec and some CSS tricks"
```

Isn’t Ruby just beautiful?

<div class="not-hover:text-(--color-muted) transition-colors duration-100">
  _(The above rules all apply to `sub`, `sub!`, and `gsub!` as well.)_
</div>
