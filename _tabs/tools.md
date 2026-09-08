---
layout: page
icon: fas fa-cog
order: 6
---

{% comment %}新增/修改工具只需要编辑 _tools/；这里会自动生成工具卡片。{% endcomment %}

<div class="tools-grid">
  {% assign tools = site.tools | sort: 'order' %}
  {% for tool in tools %}
    <a
      class="tool-card"
      href="{{ tool.url | relative_url }}"
      {% if tool.new_tab %}target="_blank" rel="noopener noreferrer"{% endif %}
    >
      <span class="tool-card__icon" aria-hidden="true">
        <i class="{{ tool.icon }}"></i>
      </span>
      <span class="tool-card__body">
        <span class="tool-card__title">{{ tool.title }}</span>
        <span class="tool-card__description">{{ tool.description }}</span>
      </span>
      <span class="tool-card__arrow" aria-hidden="true">
        <i class="fas fa-chevron-right"></i>
      </span>
    </a>
  {% endfor %}
</div>
