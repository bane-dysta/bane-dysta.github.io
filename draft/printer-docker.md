---
layout: page
title: PRINTER
date: 2024-11-1 12:00:00 +0800
---
下载docker镜像
```
docker pull ydkn/cups
```

通过windows下载，传到服务器上
```
docker save ydkn/cups > cups.tar
```
这一步不要用powershell，用cmd

在服务器上安装cups
```
docker load < cups.tar
```

启动docker
```
docker run -d \
  --name cups \
  -p 631:631 \
  --restart unless-stopped \
  --privileged \
  ydkn/cups:latest

```

访问``http://<服务器IP>:631``添加打印机，如果遇到要求你登录https，则进入容器，编辑 CUPS 配置文件 ``/etc/cups/cupsd.conf``
```
docker exec -it cups bash
vi /etc/cups/cupsd.conf
```
如果没有vi，安装
```
apt install -y vim
```
把这个加在末尾
```
DefaultEncryption Never
<Location />
  Order allow,deny
  Allow all
</Location>
```
再次访问``http://<服务器IP>:631``添加打印机，按照提示操作即可

IPP地址：
```
ipp://192.168.1.103:631/printers/<printer name>
```


