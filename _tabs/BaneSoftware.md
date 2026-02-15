---
layout: page
title: BaneSoftware
icon: fas fa-cubes
order: 2
---

本页面收集了笔者的软件。

## 软件列表

{% assign software_pages = site.softwares | sort: 'title' %}
{% if software_pages.size > 0 %}
{% for sw in software_pages %}
- [{{ sw.title }}]({{ sw.url | relative_url }}){% if sw.summary %}：{{ sw.summary }}{% endif %}
{% endfor %}
{% else %}
还没有软件页面，先创建 `_softwares/xxx.md` 即可。
{% endif %}

---


