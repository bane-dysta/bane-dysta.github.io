---
layout: page
title: 草稿纸
permalink: /draft/
---

{% assign pages_in_directory = site.pages | where_exp: "page", "page.path contains 'draft/' and page.url != '/draft/'" %}

本页是草稿纸，暂存一些没整理好但想随时翻的内容

<ul>
  {% for page in pages_in_directory %}
    <li><a href="{{ page.url | relative_url }}">{{ page.title }}</a></li>
  {% endfor %}
</ul>

