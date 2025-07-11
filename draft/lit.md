---
layout: page
title: 杂项问题的解决办法
date: 2024-11-1 12:00:00 +0800
---

## chemdraw2020链接Microsoft Office软件(Word，PowerPoint)
**描述**：使用*慈禧付款版*ChemOffice2020会出现复制出去的对象双击不能链接到chemdraw的问题

**原因**：多数*慈禧付款版*没有修改注册表，本地服务地址填的不对

**解决**：
- win+r regedit打开注册表，进入地址``计算机\HKEY_CLASSES_ROOT\CLSID\{41BA6D21-A02E-11CE-8FD9-0020AFD1F20C}\DefaultIcon``
- DefaultIcon项里有一条字符串值，值改为chemdraw实际所在路径，注意不要把原有的",1"漏掉了
- LocalServer、LocalServer32这两项里各有一条字符串值，也改成chemdraw实际所在路径。(最简单的办法是右键快捷方式-属性-把目标栏的地址粘贴进去)

## 资源管理器中的Linux入口消失

**描述**：win11更新24H2后，资源管理器中的Linux入口消失

**原因**：我也不知道闲着没事Windows在瞎更新啥

**解决**：
- 进入官方issue里提到的[链接](https://github.com/microsoft/WSL/releases/tag/2.4.8)下载并更新wsl
- 重启资源管理器

## docker镜像
**描述**：docker镜像拉不下来

**原因**：*烫烫烫烫烫锟斤拷*

**解决**：
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

## pip超时
**描述**：pip下载包时报错
```
  WARNING: Retrying (Retry(total=3, connect=None, read=None, redirect=None, status=None)) after connection broken by 
  ...
```

**原因**：访问外国网站日常抽风，类似于github

**解决**：pip install [package] -i [镜像源] --trusted-host [hostname]

```
http://mirrors.aliyun.com/pypi/simple/
https://pypi.tuna.tsinghua.edu.cn/simple/
http://pypi.mirrors.ustc.edu.cn/simple/
```

http镜像源拉取时需要加``--trusted-host``，比如：
```
pip install flask -i http://mirrors.aliyun.com/pypi/simple/ --trusted-host mirrors.aliyun.com
```

## OpenBabel
**描述**：使用pybel转换smiles式时提示``smi is not a recognised Open Babel format``

**原因**：使用pybel时必须激活对应conda环境，不能只用对应环境的python

**解决**：为此类脚本写个启动器

## filesystem编译失败
**描述**：使用了filesystem的C++脚本在集群编译时离奇报错。本地gcc 11.4.0编译通过，集群12.2.0和9.3.0统统失败，报错：
```
error: ‘__str_codecvt_in_all’ was not declared in this scope
```

**原因**：这是 GCC 实现中 std::filesystem 的一个已知问题（来自：Claude）

**解决**：我太菜了解决不了。写脚本时避免使用filesystem即可。

## gtest被make install安装
**描述**：本来只想装写好的工具，明明intsall没写gtest部分，结果make install还是搞了一堆垃圾到/usr/local
```
...

-- Installing: /usr/local/include/gmock
-- Installing: /usr/local/include/gmock/gmock-function-mocker.h
-- Installing: /usr/local/include/gmock/gmock.h
-- Installing: /usr/local/include/gmock/gmock-nice-strict.h
-- Installing: /usr/local/include/gmock/gmock-more-actions.h
-- Installing: /usr/local/include/gmock/gmock-cardinalities.h
-- Installing: /usr/local/include/gmock/gmock-matchers.h
-- Installing: /usr/local/include/gmock/gmock-spec-builders.h
-- Installing: /usr/local/include/gmock/gmock-actions.h

...
```

**原因**：GoogleTest的CMakeLists.txt默认会包含安装指令

**解决**：在启用测试之前设置GoogleTest变量，覆盖GoogleTest的行为
```
set(INSTALL_GTEST OFF CACHE BOOL "Disable installation of googletest" FORCE)
set(INSTALL_GMOCK OFF CACHE BOOL "Disable installation of googlemock" FORCE)
```

## wsl不能同步windows的代理
**描述**：``wsl: 检测到 localhost 代理配置，但未镜像到 WSL。NAT 模式下的 WSL 不支持 localhost 代理。``

**原因**：需要打开mirrored模式

**解决**：在Windows的根目录下创建.wslconfig，内容为：
```
[wsl2]
networkingMode=mirrored
```
完成后，使用``wsl --shutdown``关闭wsl，然后重新进入wsl即可

## cursor占据VScode的code命令
**描述**：code打开的是cursor

**原因**：path里cursor在VScode上面

**解决**：把VScode的路径移上去即可

## 远程主机上似乎禁用了 TCP 端口转发。
**描述**：VScode连接服务器时提示端口转发被禁用

**原因**：需要在sshd_config里打开TCP端口转发

**解决**：
```bash
sudo vi /etc/ssh/sshd_config
```
找到这一行
```
AllowTcpForwarding no

# 或者也可能是：
#AllowTcpForwarding yes
```
改成这样：
```
AllowTcpForwarding yes
```
然后重启ssh服务：
```bash
sudo systemctl restart sshd
```

## gjf无法拖进gview
描述：宿舍的电脑中，gjf拖上去显示的是禁止符号，没法打开，只能用软件内`file-open`打开

可能原因：
- 1. 安装在了受保护的文件夹内，添加了默认管理员权限
- 2. UAC策略被调整至最低级，所有程序被默认使用管理员打开
- 3. 注册表中禁用了管理员窗口的拖放策略

解决：
- 1. 右键文件夹-属性-安全-编辑，找到自己的用户，勾选完全控制并保存。
- 2. win+r打开gepedit.msc，计算机配置-windows设置-安全设置-本地策略-安全选项-用户账户控制：管理员批准模式xxxxx。确保这个通知级别不在最低档。
- 3. win+r打开regedit，找到计算机配置`HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\policies\system`，将EnableLUA 设置成0

## 无法设置默认打开应用
描述：有些格式的文件根本没有设置默认打开方式的选项，双击直接就以记事本格式打开了。`HKEY_LOCAL_ROOT`注册表里也没有注册对应后缀，即使手动添加，也不管用。

原因：
- 在`计算机\HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts`目录下还有一个注册表，优先级比`HKEY_LOCAL_ROOT`高。

解决：
- `win+R`进入`regedit`，找到目录`计算机\HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts`，删掉对应后缀名的注册项。如果是此原因导致的，应当可以为对应后缀名选择默认应用了。

## 浏览器阻止http网页使用剪贴板等API功能
描述：在http网页中，一些API会被浏览器直接阻止，这本来也没啥，是很常见的安全措施。但访问站点权限的设置项你直接给我屏蔽了不让我手动设置，那我看你是**管闲事管的有点宽了**🤗

原因：自不知道啥时候起chrome开始强制限制http网页的权限，这也影响了以chrome为内核的Edge的默认行为，需要在开发者选项中关掉。

解决：
- Edge：访问`edge://flags/#unsafely-treat-insecure-origin-as-secure`，把`Insecure origins treated as secure`设置为启用，框里填上你信任的网址即可。
- Chrome：同上，访问网站为`chrome://flags/#unsafely-treat-insecure-origin-as-secure`
