@echo off

REM 添加所有更改到 Git 暂存区
git add .

REM 提交更改
git commit -m "post"

REM 推送到远程仓库
git push -u origin main

@echo on

pause