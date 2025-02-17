#!/usr/bin/env python3
import os
import re
from datetime import datetime

def extract_yaml_title(content):
    """从文章内容中提取 YAML front matter 中的 title"""
    match = re.search(r'^---\s*$.*?^title:\s*(.+?)\s*$.*?^---\s*$', content, re.MULTILINE | re.DOTALL)
    return match.group(1).strip('"\'') if match else None

def parse_filename(filename):
    """解析文件名，返回日期和序号"""
    pattern = r'(\d{4}-\d{2}-\d{2})-(\d+)'
    match = re.match(pattern, filename)
    if match:
        date_str, number = match.groups()
        return datetime.strptime(date_str, '%Y-%m-%d'), int(number)
    return None, None

def generate_index():
    posts_dir = '_posts'
    posts = []
    
    # 遍历所有文章
    for filename in os.listdir(posts_dir):
        if not filename.endswith('.md'):
            continue
            
        date, number = parse_filename(filename)
        if not date:
            continue
            
        # 读取文件内容
        with open(os.path.join(posts_dir, filename), 'r', encoding='utf-8') as f:
            content = f.read()
            
        title = extract_yaml_title(content)
        if title:
            posts.append({
                'date': date,
                'number': number,
                'filename': filename,
                'title': title
            })
    
    # 按日期和序号排序
    posts.sort(key=lambda x: (x['date'], x['number']), reverse=True)
    
    # 生成索引文件
    with open('1970-1-1-PostIndex.md', 'w', encoding='utf-8') as f:
        f.write('# 博客文章索引\n\n')
        f.write('> 最后更新时间: {}\n\n'.format(datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
        f.write('| 日期 | 序号 | 标题 | 文件名 |\n')
        f.write('|------|------|------|--------|\n')
        
        for post in posts:
            f.write('| {} | {:04d} | {} | {} |\n'.format(
                post['date'].strftime('%Y-%m-%d'),
                post['number'],
                post['title'],
                post['filename']
            ))

if __name__ == '__main__':
    generate_index()