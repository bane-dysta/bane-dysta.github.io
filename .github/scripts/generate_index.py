#!/usr/bin/env python3
import os
import re
from datetime import datetime

def extract_yaml_title(content):
    """从文章内容中提取 YAML front matter 中的 title"""
    match = re.search(r'^---\s*$.*?^title:\s*(.+?)\s*$.*?^---\s*$', content, re.MULTILINE | re.DOTALL)
    if match:
        title = match.group(1).strip('"\'')
        print(f"Found title: {title}")
        return title
    print("No title found in content")
    return None

def parse_filename(filename):
    """解析文件名，返回日期和序号"""
    pattern = r'(\d{4}-\d{2}-\d{2})-(\d+)'
    match = re.match(pattern, filename)
    if match:
        date_str, number = match.groups()
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d')
            print(f"Parsed filename {filename}: date={date}, number={number}")
            return date, int(number)
        except ValueError as e:
            print(f"Error parsing date from filename {filename}: {e}")
    print(f"Filename {filename} doesn't match expected pattern")
    return None, None

def generate_index():
    posts_dir = '_posts'
    posts = []
    
    print(f"Current working directory: {os.getcwd()}")
    print(f"Looking for posts in: {os.path.abspath(posts_dir)}")
    
    # 确保目录存在
    if not os.path.exists(posts_dir):
        print(f"Error: Directory {posts_dir} does not exist!")
        return
    
    # 遍历所有文章
    for filename in os.listdir(posts_dir):
        print(f"\nProcessing file: {filename}")
        # 跳过索引文件本身
        if filename == '1970-01-01-PostIndex.md':
            print("Skipping index file itself")
            continue
            
        if not filename.endswith('.md'):
            print(f"Skipping non-markdown file: {filename}")
            continue
            
        date, number = parse_filename(filename)
        if not date:
            continue
            
        # 读取文件内容
        file_path = os.path.join(posts_dir, filename)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                print(f"Successfully read file: {filename}")
        except Exception as e:
            print(f"Error reading file {filename}: {e}")
            continue
            
        title = extract_yaml_title(content)
        if title:
            posts.append({
                'date': date,
                'number': number,
                'filename': filename,
                'title': title
            })
            print(f"Added post: {date} - {number} - {title}")
    
    print(f"\nTotal posts found: {len(posts)}")
    
    # 按日期和序号排序
    posts.sort(key=lambda x: (x['date'], x['number']), reverse=True)
    
    # 生成索引文件
    output_file = os.path.join(posts_dir, '1970-01-01-PostIndex.md')
    print(f"\nGenerating index file: {output_file}")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        # 添加 YAML front matter
        f.write('---\n')
        f.write('title: 博客文章索引\n')
        f.write('author: github-actions[bot]\n')
        f.write('date: 1970-01-01 00:00:00 +0800\n')
        f.write('categories: [Blog]\n')
        f.write('tags: [index]\n')
        f.write('pin: true\n')  # 固定到顶部
        f.write('---\n\n')
        
        f.write('# 博客文章索引\n\n')
        f.write('> 最后更新时间: {}\n\n'.format(datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
        f.write('| 日期 | 序号 | 标题 | 文件名 |\n')
        f.write('|------|------|------|--------|\n')
        
        for post in posts:
            line = '| {} | {:04d} | {} | {} |\n'.format(
                post['date'].strftime('%Y-%m-%d'),
                post['number'],
                post['title'],
                post['filename']
            )
            f.write(line)
            print(f"Added line to index: {line.strip()}")

if __name__ == '__main__':
    generate_index()