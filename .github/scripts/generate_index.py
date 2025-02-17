#!/usr/bin/env python3
import os
import re
from datetime import datetime

def extract_yaml_title(content):
    """从文章内容中提取 YAML front matter 中的 title"""
    match = re.search(r'^---\s*$.*?^title:\s*(.+?)\s*$.*?^---\s*$', content, re.MULTILINE | re.DOTALL)
    return match.group(1).strip('"\'') if match else None

def parse_filename(filename):
    """解析文件名，返回日期"""
    pattern = r'(\d{4})-(\d{1,2})-(\d{1,2})-(.+?)\.md$'
    match = re.match(pattern, filename)
    if match:
        year, month, day, slug = match.groups()
        try:
            date_str = f"{year}-{int(month):02d}-{int(day):02d}"
            return datetime.strptime(date_str, '%Y-%m-%d'), slug
        except ValueError:
            return None, None
    return None, None

def get_post_link(filename):
    """生成文章链接"""
    # 移除 .md 后缀
    name_without_ext = os.path.splitext(filename)[0]
    return f"https://bane-dysta.github.io/posts/{name_without_ext}/"

def generate_index():
    posts_dir = '_posts'
    posts = []
    
    if not os.path.exists(posts_dir):
        return
    
    for filename in sorted(os.listdir(posts_dir), reverse=True):
        if filename == '1970-01-01-PostIndex.md' or not filename.endswith('.md'):
            continue
            
        date, slug = parse_filename(filename)
        if not date:
            continue
            
        try:
            with open(os.path.join(posts_dir, filename), 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception:
            continue
            
        title = extract_yaml_title(content)
        if title:
            posts.append({
                'date': date,
                'slug': slug,
                'filename': filename,
                'title': title,
                'link': get_post_link(filename)
            })
    
    posts.sort(key=lambda x: x['date'], reverse=True)
    
    output_file = os.path.join(posts_dir, '1970-01-01-PostIndex.md')
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('---\n')
        f.write('title: 博客文章索引\n')
        f.write('author: github-actions[bot]\n')
        f.write('date: 1970-01-01 00:00:00 +0800\n')
        f.write('categories: [Blog]\n')
        f.write('tags: [index]\n')
        f.write('pin: true\n')
        f.write('---\n\n')
        
        f.write('>index由脚本生成\n\n')
        f.write('> 最后更新时间: {}\n\n'.format(datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
        f.write('| 发布日期 | 文章标题 | 文件名 | 链接 |\n')
        f.write('|----------|----------|--------|------|\n')
        
        for post in posts:
            f.write('| {} | {} | {} | [链接]({}) |\n'.format(
                post['date'].strftime('%Y-%m-%d'),
                post['title'],
                post['filename'],
                post['link']
            ))

if __name__ == '__main__':
    generate_index()