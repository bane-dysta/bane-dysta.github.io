// assets/js/custom.js

document.addEventListener('DOMContentLoaded', function () {
  // 普通折叠面板按钮
  document.querySelectorAll('.collapsible-btn').forEach((button) => {
    button.addEventListener('click', function () {
      this.classList.toggle('active');
      const content = this.nextElementSibling;
      if (!content) return;
      content.classList.toggle('active');
    });
  });

  // fenced code blocks 折叠/展开
  const maxLines = 19;
  const defaultOpenLines = 30;
  const scrollOffset = 80;

  function countLinesFromCode(content, codeElement) {
    const lineNoElements = content.querySelectorAll('.lineno');
    if (lineNoElements.length > 0) {
      const text = Array.from(lineNoElements)
        .map((item) => item.textContent || '')
        .join('\n')
        .trim();
      if (text) return text.split('\n').length;
    }

    if (!codeElement) return 0;
    const text = codeElement.textContent || '';
    const normalized = text.endsWith('\n') ? text.slice(0, -1) : text;
    return normalized ? normalized.split('\n').length : 0;
  }

  function scrollToContainerTop(container) {
    const top = container.getBoundingClientRect().top + window.scrollY - scrollOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  document.querySelectorAll('.content .highlighter-rouge').forEach((container) => {
    const content = container.querySelector('.highlight');
    if (!content) return;

    container.classList.add('code-collapsible-container');
    content.classList.add('code-collapsible-content');

    const code = content.querySelector('code');
    const codeLines = countLinesFromCode(content, code);
    const lineHeight = parseFloat(window.getComputedStyle(code || content).lineHeight) || 24;
    const collapsedHeight = Math.ceil(lineHeight * maxLines);
    const defaultOpenHeight = Math.ceil(lineHeight * defaultOpenLines);

    let trigger = container.querySelector('.code-collapsible-trigger');
    if (!trigger) {
      trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'code-collapsible-trigger';
      trigger.textContent = '展开';
      container.appendChild(trigger);
    }

    // 双重判定：行数 + 实际高度，避免 19~30 行等短代码误出现按钮
    const shouldCollapse = codeLines > defaultOpenLines && content.scrollHeight > defaultOpenHeight + 2;

    if (!shouldCollapse) {
      trigger.style.display = 'none';
      content.style.maxHeight = 'none';
      content.classList.remove('is-collapsed');
      return;
    }

    trigger.style.display = '';
    content.style.setProperty('--code-collapsed-max-height', `${collapsedHeight}px`);

    const setCollapsed = (collapsed) => {
      content.classList.toggle('is-collapsed', collapsed);
      content.style.maxHeight = collapsed ? 'var(--code-collapsed-max-height)' : `${content.scrollHeight}px`;
      trigger.textContent = collapsed ? '展开' : '收起';
      trigger.classList.toggle('active', !collapsed);
    };

    setCollapsed(true);

    trigger.addEventListener('click', function () {
      const collapsed = content.classList.contains('is-collapsed');
      setCollapsed(!collapsed);

      if (content.classList.contains('is-collapsed')) {
        scrollToContainerTop(container);
      }
    });
  });
});
