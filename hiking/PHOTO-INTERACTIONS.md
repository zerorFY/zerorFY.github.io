# Hiking 游记照片交互规范

版本：1.0.0 · 生效日期：2026-10-10 · 状态：当前生效

本规范适用于 Hiking 下新增和维护的游记。不依赖某个 AI、编辑器、账号、对话记忆或开发框架；人工维护者和任何 AI 工具均可按本页接入、测试和更新。

[Hiking 首页](/hiking/) · [网页版本](/hiking/photo-interactions/) · [机器可读索引](/hiking/photo-viewer-contract.json) · [版本记录](/hiking/PHOTO-INTERACTIONS-CHANGELOG.md)

## 新增游记时先做什么

1. 先读取本规范和 JSON 索引，确定当前版本与共用资源地址。
2. 复用共用查看器，不在每篇游记里另写一份手势代码。参考可直接运行的接入示例。
3. 每个章节或相册用 data-photo-gallery 分组，照片按原来的阅读顺序排列。
4. 用小图预览、大图查看；正文、人物、照片顺序和构图不因接入交互而改变。
5. 完成下方测试，再按该网站的正常发布流程上线并检查实际页面。

[完整接入示例](/hiking/examples/journal.html) · [共用 JavaScript](/hiking/shared/photo-viewer.js?v=1.0.0) · [共用 CSS](/hiking/shared/photo-viewer.css?v=1.0.0)

## 必须保留的照片体验

- 正文按比例显示小图，手机优先 640 像素、桌面可用 960 像素预览。用 srcset/sizes 选择尺寸，保留 width/height，避免加载时版面跳动或拉伸。
- 点击或键盘 Enter/空格打开大图；当前狼塔大图为 1888 像素宽。其他来源的照片可用合适的清晰尺寸，不为凑尺寸过度放大；只有查看照片时才加载相应大图及滑动时的相邻图。
- 打开查看器后锁定背景网页，滚轮和触摸均不能带动正文。关闭后恢复打开前的页面位置、焦点和原有样式。
- 单击照片区域关闭；双击在适应屏幕与 2.5 倍之间切换。单击要等待双击判定，不能在第二次点击前关闭。
- 双指缩放与双击同时存在，范围 1～5 倍，以两指移动中点为中心；放大后单指拖动平移，边界受限。
- 双指操作、第三根手指加入、松开一根手指、手势取消，不得触发切图或意外关闭。
- 原尺寸时，明确向下滑动退出。放大时拖动用于平移；恢复原尺寸后才启用下滑退出。上滑、短滑、方向不明确的斜滑不应关闭。
- 原尺寸时左右滑动切换当前章节/相册内的上一张、下一张。照片跟随手指，松手后有滑入动画；短滑及首尾边界回弹，不循环、不串到别的章节。切图后回到适应屏幕状态。
- 默认滑入/回弹动画 180 毫秒。尊重 prefers-reduced-motion，减少动态效果时立即完成切换。不要预加载整篇游记的所有大图。
- 保留关闭、上一张、下一张按钮、当前位置计数、加载/失败提示、Escape/方向键、焦点限制和返回原照片的焦点。背景内容在查看器打开时不可误操作。

## 通用接入接口

共用资源位于 hiking/shared。照片容器必须带 data-photo-gallery；可点击的 img 带 data-hiking-photo；data-full 指向大图。一个页面可以有多个相册，但只放一个查看器 DOM。没有 data-full 时回退到 img.src。

```html
<link rel="stylesheet" href="/hiking/shared/photo-viewer.css?v=1.0.0">
<section data-photo-gallery aria-label="第一天的照片">
  <figure>
    <img data-hiking-photo
      src="/hiking/your-journal/images/photo-640.webp"
      srcset="/hiking/your-journal/images/photo-640.webp 640w, /hiking/your-journal/images/photo-960.webp 960w"
      sizes="(max-width:700px) calc(100vw - 40px), 786px"
      data-full="/hiking/your-journal/images/photo-1888.webp"
      width="1888" height="1415" alt="描述这张照片" loading="lazy" decoding="async">
  </figure>
</section>
```

同页正文之后放置以下结构，再加载共用脚本。尺寸和图片路径应按实际照片替换；不需要照搬狼塔的章节布局或样式。

```html
<div id="lightbox" role="dialog" aria-modal="true" aria-label="照片查看器" aria-describedby="lightbox-help" aria-hidden="true">
  <div id="lightbox-stage"><img id="lightbox-img" alt="" draggable="false"></div>
  <button id="lightbox-close" type="button" aria-label="关闭照片">×</button>
  <button id="lightbox-prev" type="button" aria-label="上一张照片">‹</button>
  <button id="lightbox-next" type="button" aria-label="下一张照片">›</button>
  <span id="lightbox-count" aria-live="polite"></span>
  <div id="lightbox-status" role="status"></div>
  <div id="lightbox-help">左右滑动切图 · 双指/双击缩放 · 原尺寸下滑退出 · 单击关闭</div>
</div>
<script src="/hiking/shared/photo-viewer.js?v=1.0.0"></script>
```

脚本在正文之后加载，或在 head 中加 defer。不要 async 加载后让脚本先于相册/查看器结构运行。每页只加载一次 JS/CSS；不同章节共用同一个查看器。原有狼塔 section.day / .prose figure.ph img 结构继续兼容。

此接口面向页面加载时已有的照片。若改成异步追加照片，应先扩展并测试共用初始化接口，不能假设新增 DOM 会自动绑定事件。

## 如何更新、更改和回退

交互规则以本 Markdown 文档为维护源，共用 JS/CSS 是实际实现，JSON 是当前版本索引，网页由 Markdown 生成。不要只改聊天记忆、示例或某篇游记的私有副本。

1. 先写清楚要改的行为，更新本规范；接口兼容的新功能升次版本，修复升补丁版本，不兼容的结构或行为变更升主版本并写迁移步骤。
2. 在 hiking/shared/photo-viewer.js 与 photo-viewer.css 中实现一次。同步更新 JSON 的 version/日期/资源查询版本、本文代码示例、示例页和所有引用共用资源的游记。
3. 在 PHOTO-INTERACTIONS-CHANGELOG.md 记录具体变化、兼容性和回退依据；修改对应回归测试。保留当前页面的照片、文字和排序。
4. 用下面的命令重新生成规范网页并运行测试，然后在手机和桌面检查全部消费页面。本规范与实现、索引、示例、测试必须在同一个版本提交发布。
5. 发布后核对规范链接、实际脚本版本、图片及手势；缓存参数必须使用新版本，不能让页面长期混用新 CSS 与旧 JS。
6. 如需回退，回退整次版本提交，包括规范、索引、JS/CSS、示例、测试和消费页面的版本引用；重新发布并验证。不要单独回退一个文件。

```sh
python hiking/tools/build-photo-contract.py
node hiking/tests/photo-viewer.test.cjs .
```

命令从网站仓库根目录运行，仅用 Python/Node 标准库，无需安装 npm 或第三方 Python 包。Git 历史保存每次版本，规范版本与站点发布提交一起回退。hiking/langta 下保留的旧查看器文件仅供旧 URL 兼容；当前页面已使用 shared，不再维护旧副本。

## 发布前测试

- 自动测试：双指缩放中心和范围、双击共存、多指取消/松开、缩放后平移、下滑退出、短滑/斜滑不退出、左右动画及边界、关闭/再打开、连续操作、减少动态效果、正文滚动与焦点恢复。
- 通用与历史页面：示例的两个独立相册不能串图；狼塔原有章节、照片顺序和全部图片引用不变。新游记即使没有狼塔的 class 名，也必须正常操作。
- 真实浏览器：手机和桌面比例、无横向溢出、小图/大图选择、按钮/键盘、加载失败提示，以及关闭后的阅读位置。
- 有实体触屏设备时检查双指与单指切换；没有实体设备时如实记录已做的多指事件测试，不把模拟测试写成手机实测。
- 上线后：规范/索引/共用文件/示例均可访问，页面实际引用的版本正确。自动测试通过不代表照片细节真实恢复。

## 当前版本

1.0.0：从狼塔已发布查看器提取共用组件，保留现有手势，增加与页面布局无关的显式相册接口。后续变更见版本记录。
