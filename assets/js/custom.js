// assets/js/custom.js

document.addEventListener('DOMContentLoaded', function() {
    // 为所有折叠按钮添加事件监听
    document.querySelectorAll('.collapsible-btn').forEach(button => {
        button.addEventListener('click', function() {
            // 切换按钮状态
            this.classList.toggle('active');
            
            // 获取内容元素
            const content = this.nextElementSibling;
            
            // 切换内容显示状态
            if (content.classList.contains('active')) {
                content.classList.remove('active');
            } else {
                content.classList.add('active');
            }
        });
    });
});