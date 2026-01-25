---
title: "Test Hugo Post: GitHub Actions for Dev.to"
description: "Testing the GitHub Action with real Hugo frontmatter format"
publishdate: 2025-01-25T18:00:00-04:00
draft: true
eyecatch: "https://walsen-blog-post-images.s3.us-east-1.amazonaws.com/test/cover.jpg"
toc: true
math: false
canonicalURL: ""
---

## Introduction

This is a test post using the exact Hugo frontmatter format from the Walsen/weblog repository.

The action should:
- ✅ Parse quoted title and description
- ✅ Handle boolean values (draft, toc, math)
- ✅ Handle empty canonicalURL
- ✅ Parse publishdate with timezone
- ✅ Ignore extra fields (toc, math)
- ✅ Use eyecatch as main_image

## Features

This post demonstrates that the GitHub Action can handle:

1. **Hugo-style frontmatter** with quotes
2. **Additional fields** that Hugo uses but Dev.to doesn't
3. **Empty canonical URLs** that should be auto-generated
4. **Absolute image URLs** from S3

## Conclusion

If this publishes successfully to Dev.to as a draft, the action is working correctly with Hugo blogs!
