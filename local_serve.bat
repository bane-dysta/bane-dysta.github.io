@echo off
REM 切换到 D 盘
D:

REM 进入项目目录
cd D:\bane-dysta.github.io

REM 启动服务器
 bundle exec jekyll serve

@echo on

pause