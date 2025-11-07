---
layout: content.njk
title: Validation API
category: api
description: Validate markdown content against JSON schemas in real-time. Learn how to use the Validation API for frontmatter enforcement.
tags: [api, validation, schema, frontmatter]
audience: [developers]
dateAdded: 2025-11-06
lastReviewed: 2025-11-06
reviewDue: 2026-05-06
status: published
order: 1
---

# Validation API

The Validation API validates markdown content against a JSON schema and returns parsing results.

## Endpoint

```
POST /api/validate
```

## Request

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "markdown": "string (required)",
  "schemaUrl": "string (optional)"
}
```

**Parameters:**

- `markdown` - Full markdown content including YAML frontmatter
- `schemaUrl` - URL to JSON Schema definition (optional, uses default if omitted)

## Response

### Success (200 OK)

```json
{
  "status": "valid",
  "frontmatter": {
    "title": "Example Title",
    "category": "guides",
    "layout": "content.njk"
  },
  "content": "# Markdown content without frontmatter",
  "preview": "<h1>Rendered HTML preview</h1>",
  "metadata": {
    "wordCount": 150,
    "readingTime": 1,
    "contentLength": 1234,
    "hasImages": false,
    "hasCode": true
  }
}
```

### Validation Error (422 Unprocessable Entity)

```json
{
  "status": "invalid",
  "errors": [
    {
      "path": "/title",
      "message": "must have required property 'title'",
      "keyword": "required",
      "params": {}
    }
  ]
}
```

### Client Error (400 Bad Request)

```json
{
  "error": "Missing markdown content"
}
```

### Server Error (500 Internal Server Error)

```json
{
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

## Examples

### Valid Content

```bash
curl -X POST https://api.twelvety.dev/validate \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "---\ntitle: Test Page\ncategory: example\nlayout: content.njk\n---\n# Hello World",
    "schemaUrl": "https://api.twelvety.dev/schema.json"
  }'
```

### Invalid Content

```bash
curl -X POST https://api.twelvety.dev/validate \
  -H "Content-Type: application/json" \
  -d '{
    "markdown": "---\ncategory: example\n---\n# Missing title",
    "schemaUrl": "https://api.twelvety.dev/schema.json"
  }'
```

## Schema Definition

The default schema validates the following frontmatter fields:

### Required Fields

- `title` (string, 1-200 characters)
- `category` (enum: workspace, docs, examples, api)
- `layout` (must be "content.njk")

### Optional Fields

- `tags` (array of strings, max 10 items)
- `audience` (array, values: developers, designers, managers, students)
- `dateAdded` (date in YYYY-MM-DD format)
- `lastReviewed` (date in YYYY-MM-DD format)
- `webglEmbed` (URI for WebGL content)
- `webglHeight` (integer, 300-1200 pixels)

## Rate Limits

- **Free tier**: 100 requests/hour
- **Pro tier**: 1000 requests/hour
- **Enterprise**: Unlimited

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Validation successful |
| 400 | Invalid request (missing parameters) |
| 422 | Validation failed (schema errors) |
| 429 | Rate limit exceeded |
| 500 | Server error |

## See Also

- [Build API](/api/build-api/)
- [Status API](/api/status-api/)
- [Schema Reference](/docs/schema-reference/)
