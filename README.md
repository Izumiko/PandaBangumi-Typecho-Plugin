# PandaBangumi-Typecho-Plugin

为你的 Typecho 博客增加追番列表显示功能。

介绍：**[熊猫追番 (PandaBangumi) for Typecho 发布！ - 熊猫小A的博客](https://blog.imalan.cn/archives/128/)**

## 使用

插件版添加了**分页功能**，这样追番很多时能节约流量，加快速度。追番列表与追番日历功能都可以自己选择要不要开启，在插件里设置就好。

使用方法：去 GitHub 上下载插件：[Izumiko/PandaBangumi-Typecho-Plugin](https://github.com/Izumiko/PandaBangumi-Typecho-Plugin)

解压后把文件夹改名为 `PandaBangumi` ，上传到服务器 `usr/plugins` 目录下，在 Typecho 后台启用本插件，填写 ID（即用户主页链接后的那串数字），设置一下每页展示的数量。

在任何页面，不论是独立页还是一般的文章页面，在文章里插入代码：

在看

```html
<div data-type="watching" class="bgm-collection"></div>
```

动漫已看

```html
<div data-type="watched" data-cate="anime" class="bgm-collection"></div>
```

三次元已看

```html
<div data-type="watched" data-cate="real" class="bgm-collection"></div>
```

追番日历（去掉`data-filter="watching"`则显示所有番剧）
```html
<div data-filter="watching" class="bgm-calendar"></div>
```

保存发布，这个位置就会展开成追番展示面板。加载和分页都使用 AJAX 请求～

插件带了缓存功能，可以极大地提升速度，**但是记得要保证 `插件目录/json/` 这个目录可写**。

## 注意事项

服务器需要启用 PHP curl openssl 扩展。

不一定所有主题都完美。

模板会向 `插件目录/json/` 写入缓存数据，请保证这个目录可写。

**如果你发现 PJAX 切换页面时番剧都不加载了，你需要去主题的 PJAX 回调函数中添加一句 initCollection();**
