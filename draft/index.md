---
layout: page
title: A hiden moth in the site
permalink: /draft/
hidden: true
---

There is a moth hiding in this site. Would you help her reaching THE CANDLE? 

{% assign pages_in_directory = site.pages | where_exp: "page", "page.path contains 'draft/' and page.url != '/draft/'" %}

<ul>
  {% for page in pages_in_directory %}
    <li><a href="{{ page.url | relative_url }}">{{ page.title }}</a></li>
  {% endfor %}
</ul>