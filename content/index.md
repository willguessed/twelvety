---
layout: base.njk
title: Home
permalink: /
---

<div class="hero">
  <h1>✨ Twelvety</h1>
  <p class="hero-description">Transform markdown into beautiful websites in seconds</p>
  <div class="hero-actions">
    <a href="/workspace/" class="btn btn-primary btn-lg">
      <span>🚀</span> Start Building
    </a>
    <a href="/docs/" class="btn btn-secondary btn-lg">
      <span>📖</span> Learn More
    </a>
  </div>
</div>

<div class="home-features">
  <div class="feature">
    <div class="feature-icon">⚡</div>
    <h3>Instant Validation</h3>
    <p>Real-time frontmatter validation ensures your content is always correct</p>
  </div>
  
  <div class="feature">
    <div class="feature-icon">🎨</div>
    <h3>Live Preview</h3>
    <p>See your markdown rendered as you type with split-screen editing</p>
  </div>
  
  <div class="feature">
    <div class="feature-icon">🏗️</div>
    <h3>Fast Builds</h3>
    <p>Sub-5-second builds with incremental support for rapid iteration</p>
  </div>
  
  <div class="feature">
    <div class="feature-icon">📦</div>
    <h3>Multi-Channel Output</h3>
    <p>Deploy to GitHub Pages, download static files, or archive to S3</p>
  </div>
</div>

<div class="home-sections">

## Explore

<div class="section-grid">
  {% for section in site.sections %}
  <a href="{{ ('/' ~ section.id ~ '/') | url }}" class="section-card {% if section.primary %}section-card-primary{% endif %}">
    <span class="section-card-icon">{{ section.icon }}</span>
    <h3>{{ section.title }}</h3>
    <p>{{ section.description }}</p>
  </a>
  {% endfor %}
</div>

</div>
