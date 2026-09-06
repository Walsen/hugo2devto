---
title: "Unknown Shortcode Fixture"
description: "Exercises the unconverted-shortcode warning and adsense stripping"
draft: true
tags: test
---

## Intro

{{< adsense >}}

This post uses a theme shortcode the converter does not know about:

{{< button href="https://example.com" >}}Click me{{< /button >}}

And a centered block:

{{< centered >}}
Some centered text.
{{< /centered >}}
