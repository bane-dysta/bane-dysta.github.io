@echo off
REM 切换到 D 盘
D:

REM 进入项目目录
cd D:\bane-dysta.github.io

REM 添加所有更改到 Git 暂存区
git add .

REM 提交更改
git commit -m "post"

REM 推送到远程仓库
git push -u origin main

@echo on

pause