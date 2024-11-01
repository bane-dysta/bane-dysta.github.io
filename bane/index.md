---
layout: page
title: "Hidden Pages Directory"
permalink: /bane/
hidden: true
---

# Welcome to the Hidden Pages Directory
This is the main page for the hidden pages. You can only access this directory and its pages via direct links.

{% assign pages_in_directory = site.pages | where_exp: "page", "page.path contains 'bane/' and page.url != '/bane/'" %}

<ul>
  {% for page in pages_in_directory %}
    <li><a href="{{ page.url | relative_url }}">{{ page.title }}</a></li>
  {% endfor %}
</ul>