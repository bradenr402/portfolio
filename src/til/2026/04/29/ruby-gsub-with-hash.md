---
title: Ruby allows passing a Hash to `gsub`
link: https://docs.ruby-lang.org/en/3.4/String.html#class-String-label-Substitution+Methods
---

Instead of chaining multiple `gsub` calls, you can pass a hash as the replacement. Each match is replaced by its corresponding value (or removed if no key exists).

Say you’re normalizing “smart” punctuation into plain ASCII. (This is a job `tr` can’t do: an em dash becomes _two_ characters.)

```ruby
text = "He said — “that’s ‘fine’…”"

# Before:
text.gsub("“", '"').gsub("”", '"').gsub("‘", "'").gsub("’", "'").gsub("—", "--")
# => "He said -- \"that's 'fine'…\""

# After:
replacements = { "“" => '"', "”" => '"', "‘" => "'", "’" => "'", "—" => "--" }
text.gsub(/[“”‘’—]/, replacements)
# => "He said -- \"that's 'fine'…\""

# Matches with no corresponding key are removed (here, the ellipsis):
text.gsub(/[“”‘’—…]/, replacements)
# => "He said -- \"that's 'fine'\""
```

You can also define the hash inline. In typical Ruby fashion, the outer `{}` can be omitted:

```ruby
text.gsub(/[“”]/, { "“" => '"', "”" => '"' })
text.gsub(/[“”]/, "“" => '"', "”" => '"')
```

Cleaner, more readable, and more performant than chaining multiple `gsub` calls.

<div class="not-hover:text-(--color-muted) transition-colors duration-100">
  _(The above rules all apply to `sub`, `sub!`, and `gsub!` as well.)_
</div>
