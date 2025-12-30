import os
import re
from datetime import datetime

def extract_title_from_md(content):
    """从markdown文件内容中提取title字段"""
    title_match = re.search(r'title:\s*["\']?([^"\'\n]+)["\']?', content)
    if title_match:
        return title_match.group(1).strip()
    return "无标题"

def create_post_index():
    # 确保draft目录存在
    if not os.path.exists('_draft'):
        os.makedirs('_draft')
    
    # 初始化输出内容
    output = """---
layout: page
title: Post Index
date: 1970-1-1 12:00:00 +0800
---

| 序号 | 文章标题 | 发布日期 | 源文件 |
|:------:|----------|----------|--------|
"""
    
    # 获取所有博客文章
    posts = []
    posts_dir = '_posts'
    
    # 修改后的正则表达式，更灵活地匹配日期格式
    date_pattern = r'(\d{4})-(\d{1,2})-(\d{1,2})-(.*?)\.md'
    
    for filename in os.listdir(posts_dir):
        if filename.endswith('.md'):
            # 解析文件名中的日期和文件名部分
            match = re.match(date_pattern, filename)
            if match:
                year, month, day, post_name = match.groups()
                
                # 构建标准化的日期字符串 (确保月份和日期都是两位数)
                date_str = f"{year}-{month:0>2}-{day:0>2}"
                
                # 读取文件内容
                with open(os.path.join(posts_dir, filename), 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 提取标题
                title = extract_title_from_md(content)
                
                # 构建链接
                link = f"https://bane-dysta.github.io/posts/{post_name}"
                
                # 将日期字符串转换为datetime对象用于排序
                date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                
                posts.append({
                    'date': date_str,
                    'title': title,
                    'filename': filename,
                    'link': link,
                    'date_obj': date_obj
                })
    
    # 按日期倒序排序
    posts.sort(key=lambda x: x['date_obj'], reverse=True)
    
    # 获取总文章数
    total_posts = len(posts)
    
    # 生成markdown表格内容，序号从总数开始倒数
    for index, post in enumerate(posts):
        markdown_link = f"[{post['filename']}]({post['link']})"
        # 序号从总数开始倒数
        reverse_index = total_posts - index
        output += f"| {reverse_index} | {post['title']} | {post['date']} | {markdown_link} |\n"
    
    # 写入文件
    with open('_draft/PostIndex.md', 'w', encoding='utf-8') as f:
        f.write(output)
    
    print("索引文件已生成到 _draft/PostIndex.md")

if __name__ == "__main__":
    create_post_index()