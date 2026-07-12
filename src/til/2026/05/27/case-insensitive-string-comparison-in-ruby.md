---
title: "Case-insensitive string comparison in Ruby"
link: https://www.rubydoc.info/stdlib/core/String:casecmp%3F
---

When confronted with a situation that needs to compare strings without regard to case, most Ruby developers (myself included) tend to reach for `String#downcase` to normalize both strings before comparison. For example:

```ruby
string.downcase == another_string.downcase  # => true
```

It works, but Ruby already has built-in methods that are made for exactly this purpose: `String#casecmp` and `String#casecmp?`.

If you just need a boolean, `casecmp?` is the cleanest option:

```ruby
"image".casecmp?("IMAGE")  # => true
"image".casecmp?("video")  # => false
```

`casecmp` behaves similarly, but returns comparison values like the spaceship operator (`<=>`):

```ruby
"image".casecmp("IMAGE")   # => 0
"apple".casecmp("banana")  # => -1
"zebra".casecmp("apple")   # => 1
```

They’re more expressive than manually normalizing case and avoid allocating a lowercase copy of the string. A small Ruby feature, but a nice one to know.
