---
title: "Ruby’s `%` notation is more powerful than you think"
link: https://en.wikibooks.org/wiki/Ruby_Programming/Syntax/Literals#The_.25_Notation
---

I already knew the basics—`%w` for word arrays, `%i` for symbol arrays, `%q`/`%Q` for strings, `%r` for regexps—but there’s more to the `%` notation than I realized.

**`%()` defaults to interpolated strings**

`%Q` is the interpolated string literal, but you can drop the `Q` entirely. `%()` is equivalent to `%Q()`, which is equivalent to double-quoted strings:

```ruby
path = "/some/path"
%(filename="#{path}")
# => "filename=\"/some/path\""
```

This is great when your string contains quotes and you don’t want to escape them.

**Capital letters = interpolation**

The lowercase/uppercase pattern is consistent: lowercase is non-interpolated, uppercase is interpolated.

```ruby
language = "Ruby"

# Non-interpolated (lowercase)
%w[hello #{language}]   # => ["hello", "\#{language}"]
%i[hello #{language}]   # => [:hello, :"\#{language}"]

# Interpolated (uppercase)
%W[hello #{language}]   # => ["hello", "Ruby"]
%I[hello #{language}]   # => [:hello, :Ruby]
```

**`%x` for shell commands**

`%x` works like backticks but with the `%` delimiter flexibility:

```ruby
%x(echo "hello from the shell")
# => "hello from the shell\n"
```

**`%s` for non-interpolated symbols**

```ruby
%s(hello world)   # => :"hello world"
%s(#{nope})       # => :"\#{nope}"
```

**Any non-alphanumeric character works as a delimiter**

I’d only ever used `()`, `[]`, `{}`, `||`, and `<>`, but you can use _any_ single non-alphanumeric character—even whitespace:

```ruby
%w#foo bar#  # => ["foo", "bar"]  (array of words with hashes as delimiters)
%i!foo bar!  # => [:foo, :bar]    (array of symbols with exclamation marks as delimiters)
%r.foo bar.  # => /foo bar/       (regex with periods as delimiters)
% test       # => "test"          (string with spaces as delimiters)
% foo\ bar   # => "foo bar"       (string with spaces as delimiters, with an escaped space inside—please don't)
```

**Paired delimiters allow unescaped nesting**

If you use `()`, `[]`, `{}`, or `<>`, you can include those same characters _unescaped_ inside the literal—as long as they appear in balanced pairs:

```ruby
%(string (syntax) is pretty flexible)
# => "string (syntax) is pretty flexible"

%w[one [two three] four]
# => ["one", "[two", "three]", "four"]
```
