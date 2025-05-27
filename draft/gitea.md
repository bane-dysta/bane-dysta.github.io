---
layout: page
title: gitea
date: 2024-11-1 12:00:00 +0800
---
## docker部署
创建yml文件：
```yml
services:
  gitea:
    image: gitea/gitea:latest
    container_name: gitea
    environment:
      - USER_UID=1000
      - USER_GID=1000
    restart: always
    ports:
      - "3000:3000"
      - "2222:22"
    volumes:
      - ./gitea:/data
```
使用docker compose构建：
```bash
mkdir gitea
docker compose up -d
# 或docker-compose
docker-compose up -d
```
构建完毕后，访问`IP:3000`进行配置。

