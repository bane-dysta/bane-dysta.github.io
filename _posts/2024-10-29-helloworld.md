---
title: helloworld
date: 2024-10-29 19:00:00 +0800
categories: [TEST]
tags: [tools]    
---
# helloworld
{% include smiles.html smiles="[O-]C(C1=C2)=C3C(C=C4C(C=CC5=C4C=C6C(C=C7C(C=C8C(C=CC9=C8C=C%10C%11=C9)=C7)=C6)=C5)=C3)=CC1=CC%12=C2C=CC(C%12=CC%13=CC%14=C%15)=CC%13=CC%14=CC(C=CC%16=CC%17=CC%18=C%19)=C%15C%16=CC%17=CC%18=CC%20=C%19C=CC%21=CC%22=[N+]([H])C%23=CC(C=CC(C%24=CC%25=C%10)=CC%25=C%11)=C%24C=C%23C=C%22C=C%21%20" %}

{% include smiles.html smiles="CCO|c1ccccc1|CCC(=O)O" %}



## 新增一个软件入口（模板）

在仓库里新增一个文件，例如：`_softwares/my-tool.md`

```markdown
---
title: My Tool
summary: 一句话说明这个软件页是干什么的。
---

这里是 My Tool 的 index 页面。

## 教程入口
- [安装](/posts/xxx/)
- [使用](/posts/yyy/)
- [常见问题](/posts/zzz/)
```

生成后的访问地址会是：`/software/my-tool/`。
