---
title: "Cleaner conditional CSS classes with Rails’ `class_names`"
link: https://api.rubyonrails.org/classes/ActionView/Helpers/TagHelper.html#method-i-token_list
---

`class_names` (Rails 6.1+, from `ActionView::Helpers::TagHelper`) builds CSS class lists from strings, arrays, and hashes: hash keys are class names, and their values decide whether each is included. It’s an alias of `token_list`, so use whichever reads better to you.

Instead of cramming conditionals into a string, you pass a hash:

```ruby
# Before: the pattern you see in a lot of Rails apps
"nav-link #{active ? "nav-link-active" : ""}"
# => "nav-link nav-link-active"  (when active is true)
# => "nav-link "                 (when active is false) — note the trailing space

# After:
class_names("nav-link", "nav-link-active": active)
# => "nav-link nav-link-active"  (when active is true)
# => "nav-link"                  (when active is false) — no trailing space
```

And the best part? Rails’ tag builder applies the same logic to any `class:` option, so tag-producing helpers—`tag`, `content_tag`, `link_to`, `button_to`, and friends—accept conditional hashes for free. Here’s a real example from JobJournal’s `_filter_dropdown` partial:

```ruby
link_to "...", class: [ "dropdown-option", "md:hidden": link[:mobile_only] ]
```
