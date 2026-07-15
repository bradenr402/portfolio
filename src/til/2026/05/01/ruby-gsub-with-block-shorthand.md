---
title: Ruby’s `gsub` accepts a block via `&:` shorthand syntax
link: https://docs.ruby-lang.org/en/3.4/String.html#class-String-label-Substitution+Methods
---

You may already know you can pass a block to `gsub` like this:

```ruby
"abracadabra".gsub(/[a-d]/) { |substring| substring.upcase }
# => "ABrACADABrA"
```

You can make this more concise by using the implicit block parameter `_1` (or `it` in Ruby 3.4+):

```ruby
"abracadabra".gsub(/[a-d]/) { it.upcase }
```

But there’s an _even more compact_ form using the `&:` shorthand syntax:

```ruby
"abracadabra".gsub(/[a-d]/, &:upcase)
```

Isn’t Ruby just beautiful?

<div class="not-hover:text-(--color-muted) transition-colors duration-100">
  _(The above rules all apply to `sub`, `sub!`, and `gsub!` as well.)_
</div>
