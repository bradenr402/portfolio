---
title: Ruby allows passing a Hash to `gsub`
link: https://docs.ruby-lang.org/en/3.4/String.html#class-String-label-Substitution+Methods
---

Instead of running multiple sequential `gsub` calls, you can hand `gsub` a hash and it will replace each match with the corresponding value:

Instead of chaining multiple `gsub` calls, you can pass a hash as the replacement. Each match is replaced by its corresponding value (or removed if no key exists):

```ruby
string = "abracadabra"

# Before:
string.gsub("a", "A").gsub("b", "B").gsub("c", "C")
# => "ABrACAdABrA"

# After:
hash = { "a" => "A", "b" => "B", "c" => "C" }
string.gsub(/[a-c]/, hash)
# => "ABrACAdABrA"

# Missing keys are removed:
string.gsub(/[a-d]/, hash)
# => "ABrACAABrA"
```

You can also define the hash inline. In typical Ruby fashion, the outer `{}` can be omitted:

```ruby
string.gsub(/[a-c]/, { "a" => "A", "b" => "B", "c" => "C" })
# => "ABrACAdABrA"
string.gsub(/[a-c]/, "a" => "A", "b" => "B", "c" => "C")
# => "ABrACAdABrA"
```

Cleaner, more readable, and more performant than chaining multiple `gsub` calls.
