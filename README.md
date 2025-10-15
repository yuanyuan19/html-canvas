在 `</head>` 之前加入：

```html
<link rel="stylesheet" href="./fg_canvas_assets/fg-canvas.css">
```

在 `</body>` 之前加入下面这段**纯 HTML 标记**和 **外链脚本** ：

```html
<!-- fg-canvas overlay (no inline script/style) -->
<div id="fg-toolbar" role="region" aria-label="自由绘图工具条">
  <button id="fg-toggle" title="开启/关闭绘图 (D)">开始绘图</button>
  <label title="选择画笔颜色">颜色 <input id="fg-color" type="color" value="#ff2d55"></label>
  <label title="调整画笔粗细">粗细 <input id="fg-size" type="range" min="1" max="40" value="4"></label>
  <button id="fg-eraser" title="切换橡皮 (E)">橡皮</button>
  <span id="fg-mode" class="fg-badge">模式：画笔</span>
  <button id="fg-clear" title="清空画布 (C)">清空</button>
  <button id="fg-save"  title="导出为PNG (S)">保存PNG</button>
  <button id="fg-hide"  title="显示/隐藏画布 (H)">隐藏画布</button>
</div>
<canvas id="fg-canvas"></canvas>
<script src="./fg_canvas_assets/fg-canvas.js" defer></script>

```

完成后，用浏览器打开该 HTML。点击“开始绘图”或按 `D`，即可在整页上画；`E` 切换橡皮，`C` 清空，`S` 导出 PNG，`H` 隐藏/显示画布。
