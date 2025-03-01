---
layout: page
title: 杂项问题的解决办法
date: 2024-11-1 12:00:00 +0800
---

## chemdraw2020链接Microsoft Office软件(Word，PowerPoint)
描述：使用*慈禧付款版*ChemOffice2020会出现复制出去的对象双击不能链接到chemdraw的问题

原因：多数*慈禧付款版*没有修改注册表，本地服务地址填的不对

解决办法：
- win+r regedit打开注册表，进入地址``计算机\HKEY_CLASSES_ROOT\CLSID\{41BA6D21-A02E-11CE-8FD9-0020AFD1F20C}\DefaultIcon``
- DefaultIcon项里有一条字符串值，值改为chemdraw实际所在路径，注意不要把原有的",1"漏掉了
- LocalServer、LocalServer32这两项里各有一条字符串值，也改成chemdraw实际所在路径。(最简单的办法是右键快捷方式-属性-把目标栏的地址粘贴进去)

## 资源管理器中的Linux入口消失

描述：win11更新24H2后，资源管理器中的Linux入口消失

原因：我也不知道闲着没事Windows在瞎更新啥

解决办法：
- 进入官方issue里提到的[链接](https://github.com/microsoft/WSL/releases/tag/2.4.8)下载并更新wsl
- 重启资源管理器

## docker镜像
描述：docker镜像拉不下来

原因：*烫烫烫烫烫锟斤拷*

解决办法：
- [Docker 镜像加速列表](https://www.coderjia.cn/archives/dba3f94c-a021-468a-8ac6-e840f85867ea)
- 用法：
  ```
  sudo mkdir -p /etc/docker
  sudo tee /etc/docker/daemon.json <<-'EOF'
  {
    "registry-mirrors": [
      "https://docker.hpcloud.cloud",
      "https://docker.m.daocloud.io",
      "https://docker.unsee.tech",
      "https://docker.1panel.live",
      "http://mirrors.ustc.edu.cn",
      "https://docker.chenby.cn",
      "http://mirror.azure.cn",
      "https://dockerpull.org",
      "https://dockerhub.icu",
      "https://hub.rat.dev"
    ]
  }
  EOF
  sudo systemctl daemon-reload
  sudo systemctl restart docker
  ```

# OpenBabel
描述：使用pybel转换smiles式时提示``smi is not a recognised Open Babel format``

原因：使用pybel时必须激活对应conda环境，不能只用对应环境的python

解决办法：为此类脚本写个启动器


