---
layout: page
title: 草稿纸
permalink: /draft/
---

{% assign pages_in_directory = site.pages | where_exp: "page", "page.path contains 'draft/' and page.url != '/draft/'" %}

<ul>
  {% for page in pages_in_directory %}
    <li><a href="{{ page.url | relative_url }}">{{ page.title }}</a></li>
  {% endfor %}
</ul>