---
title: 'Imaginary and complex numbers in Ruby'
link: https://ruby-doc.org/core-2.7.2/Complex.html
---

Ruby has built-in support for complex numbers via the `Complex` class in the standard library. It’s a small feature, but it makes working with imaginary numbers feel surprisingly natural.

You can create complex numbers explicitly using the `Complex` constructor. This is the most direct and readable approach when both real and imaginary parts are variables or come from calculations.

```ruby
Complex(2, 3)  # => (2+3i)
```

Ruby also supports a literal syntax using the `i` suffix, which makes imaginary numbers feel first-class in the language. This is often the most convenient form when writing quick expressions or math-like code.

```ruby
2 + 3i  # => (2+3i)
```

Once created, complex numbers behave like numeric types and support standard arithmetic operations out of the box. Addition, subtraction, multiplication, and division all follow mathematical rules without needing any special handling.

```ruby
# math with Complex numbers is easy
(2 + 3i) + (1 - 2i)  # => (3+1i)
(2 + 3i) - (1 - 2i)  # => (1+5i)
(2 + 3i) * (1 - 2i)  # => (8-1i)
(2 + 3i) / (1 - 2i)  # => ((-4/5)+(7/5)*i)

# works with Integers and Floats too
(2 + 3i) + 5         # => (7+3i)
(2 + 3i) - 1.5       # => (0.5+3i)
(2 + 3i) * 0.5       # => (1.0+1.5i)
(2 + 3i) / 2         # => (1+(3/2)*i)
```

Ruby also includes some useful methods for switching between rectangular and polar representations of a complex number.

Calling `polar` on a complex number returns an array containing the magnitude (distance from the origin) and angle in radians, effectively decomposing the complex number into its polar coordinates:

```ruby
z = 2i  # shorter form of z = 0 + 2i
z.polar
# => [2, 1.5707963267948966]
```

If you want to go the other direction, `Complex.polar` constructs a complex number _from_ a magnitude and angle:

```ruby
z = Complex.polar(2, Math::PI / 2)
# => (0.0+2i)
```

These two methods are essentially mirrors of each other:
- `z.polar` **decomposes** a complex number into `[magnitude, angle]`
- `Complex.polar` **builds** a complex number from `[magnitude, angle]`

```ruby
z = 2i
magnitude, angle = z.polar
Complex.polar(magnitude, angle)  # => (0.0+2i)
```

You can also get the rectangular coordinates of a complex number using `rectangular` (or its shorter alias, `rect`), which returns the real and imaginary parts as an array:

```ruby
z = Complex.polar(2, Math::PI / 2)
z.rect
# => [0.0, 2]
```

For the record, Ruby also exposes `Complex.rectangular` (along with its alias, `Complex.rect`) for constructing complex numbers from rectangular coordinates, but these are really just explicit versions of the default `Complex(real, imaginary)` constructor:

```ruby
Complex(2, 3)              # => (2+3i)
Complex.rectangular(2, 3)  # => (2+3i)
Complex.rect(2, 3)         # => (2+3i)
```

The `Complex` class is part of Ruby’s core library, so no external dependencies are required.
