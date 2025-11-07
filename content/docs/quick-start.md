---
layout: content.njk
title: Quick Start Guide
category: docs
description: Get up and running with Twelvety in minutes. Learn how to upload markdown, validate content, and build your first site.
tags: [introduction, setup, quickstart, getting-started]
audience: [developers]
dateAdded: 2025-11-06
lastReviewed: 2025-11-06
reviewDue: 2026-05-06
status: published
order: 1
---

# Quick Start Guide

Welcome to **Twelvety** - the API-driven website generation service powered by Eleventy!

## What is Twelvety?

Twelvety transforms markdown content into beautiful, fast, static websites through a simple API. Upload your markdown, validate it against a schema, and get a production-ready website in seconds.

## Key Features

- ✅ **Instant Validation**: Real-time markdown and frontmatter validation
- ⚡ **Fast Builds**: Sub-5-second builds with incremental support
- 🔍 **Built-in Search**: Client-side full-text search with Lunr.js
- 📦 **Multi-channel Delivery**: GitHub Pages, S3 archives, direct downloads
- 🎨 **WebGL Ready**: Safe embedding of interactive 3D content
- 🔐 **Full Provenance**: Complete audit trail for all builds

## Getting Started

### 1. Create Content

Write your content in markdown with YAML frontmatter:

```md
---
layout: content.njk
title: My First Page
category: guides
tags: [example, tutorial]
audience: [developers]
dateAdded: 2024-11-06
---

# My First Page

Your content goes here!
```

### 2. Validate

Use the validation API to check your content:

```bash
curl -X POST https://api.twelvety.dev/validate \\
  -H "Content-Type: application/json" \\
  -d '{
    "markdown": "---\\ntitle: Test\\n---\\n# Content",
    "schemaUrl": "https://api.twelvety.dev/schema.json"
  }'
```

### 3. Build

Trigger a build with the validated content:

```bash
curl -X POST https://api.twelvety.dev/build \\
  -H "Content-Type: application/json" \\
  -d '{
    "markdown": "...",
    "projectId": "my-project",
    "metadata": {
      "author": "you@example.com",
      "title": "My Project"
    }
  }'
```

### 4. Deploy

Your site is automatically deployed to GitHub Pages and archived to S3.

## Next Steps

- Read the [API Reference](/api-reference/) for detailed endpoint documentation
- Check out [Guides](/guides/) for advanced usage patterns
- Review the [FAQ](/faq/) for common questions

## Support

Need help? Check our documentation or reach out to the community!
