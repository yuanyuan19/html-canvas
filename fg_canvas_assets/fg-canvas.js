// 智能分块画布：修复滑块无法拖动问题
(function(){
  function init(){
    try{
      if (window.__fgInjected) return; window.__fgInjected = true;

      var toggleBtn = document.getElementById('fg-toggle');
      var colorInput = document.getElementById('fg-color');
      var sizeInput = document.getElementById('fg-size');
      var eraserBtn = document.getElementById('fg-eraser');
      var clearBtn  = document.getElementById('fg-clear');
      var saveBtn   = document.getElementById('fg-save');
      var hideBtn   = document.getElementById('fg-hide');
      var modeLabel = document.getElementById('fg-mode');

      if (!toggleBtn) return;

      var drawingEnabled = false, erasing = false, drawing = false;
      var canvasTiles = {}; 
      var tileSize = { w: 0, h: 0 };
      var currentTiles = [];
      var currentStroke = { color: '#000', size: 4, erasing: false };
      
      // ✅ 新增：获取工具条元素
      var toolbar = document.getElementById('fg-toolbar');
      
      function dpr(){ return Math.min(window.devicePixelRatio || 1, 2.5); }
      
      function getDocSize(){
        var doc = document.documentElement, body = document.body || doc;
        return {
          w: Math.max(doc.scrollWidth, body.scrollWidth, doc.clientWidth),
          h: Math.max(doc.scrollHeight, body.scrollHeight, doc.clientHeight)
        };
      }
      
      function getTileSize(){
        return { w: window.innerWidth, h: window.innerHeight };
      }
      
      function getTileIndex(x, y){
        var col = Math.floor(x / tileSize.w);
        var row = Math.floor(y / tileSize.h);
        return { row: row, col: col, key: row + '_' + col };
      }
      
      // ✅ 新增：检查点击是否在工具条上
      function isOnToolbar(x, y){
        if (!toolbar) return false;
        var rect = toolbar.getBoundingClientRect();
        var scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        var scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        return (
          x >= rect.left + scrollX &&
          x <= rect.right + scrollX &&
          y >= rect.top + scrollY &&
          y <= rect.bottom + scrollY
        );
      }
      
      function getOrCreateTile(row, col){
        var key = row + '_' + col;
        
        if (canvasTiles[key]) {
          return canvasTiles[key];
        }
        
        var canvas = document.createElement('canvas');
        var ratio = dpr();
        
        canvas.style.position = 'absolute';
        canvas.style.left = (col * tileSize.w) + 'px';
        canvas.style.top = (row * tileSize.h) + 'px';
        canvas.style.width = tileSize.w + 'px';
        canvas.style.height = tileSize.h + 'px';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '2147483000';
        
        canvas.width = Math.floor(tileSize.w * ratio);
        canvas.height = Math.floor(tileSize.h * ratio);
        
        var ctx = canvas.getContext('2d');
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        
        canvas.className = 'fg-canvas-tile';
        canvas.dataset.row = row;
        canvas.dataset.col = col;
        document.body.appendChild(canvas);
        
        canvasTiles[key] = { canvas: canvas, ctx: ctx, row: row, col: col };
        return canvasTiles[key];
      }
      
      function applyStroke(ctx){
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = currentStroke.size;
        if (currentStroke.erasing){
          ctx.globalCompositeOperation = 'destination-out';
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = currentStroke.color;
        }
      }
      
      function captureCurrentStyle(){
        currentStroke.color = colorInput ? colorInput.value : '#000';
        currentStroke.size = +(sizeInput ? sizeInput.value : 4);
        currentStroke.erasing = erasing;
        
        if (modeLabel) {
          modeLabel.textContent = currentStroke.erasing ? '模式：橡皮' : '模式：画笔';
        }
      }
      
      function toLocalCoord(x, y, tile){
        return {
          x: x - tile.col * tileSize.w,
          y: y - tile.row * tileSize.h
        };
      }
      
      function pos(ev){
        if (ev.touches && ev.touches[0]) return {x:ev.touches[0].pageX, y:ev.touches[0].pageY};
        if (ev.changedTouches && ev.changedTouches[0]) return {x:ev.changedTouches[0].pageX, y:ev.changedTouches[0].pageY};
        return {x:ev.pageX, y:ev.pageY};
      }
      
      var lastPoint = null;
      var activeTile = null;
      
      // ✅ 修复：检查是否在工具条上
      function start(ev){
        if(!drawingEnabled) return;
        
        var p = pos(ev);
        
        // ✅ 关键修复：如果点击在工具条上，不处理
        if (isOnToolbar(p.x, p.y)) {
          return;
        }
        
        drawing = true;
        lastPoint = p;
        
        captureCurrentStyle();
        
        var tileIdx = getTileIndex(p.x, p.y);
        var tile = getOrCreateTile(tileIdx.row, tileIdx.col);
        activeTile = tile;
        currentTiles = [tile];
        
        var local = toLocalCoord(p.x, p.y, tile);
        applyStroke(tile.ctx);
        tile.ctx.beginPath();
        tile.ctx.moveTo(local.x, local.y);
        
        ev.preventDefault();
      }
      
      function move(ev){
        if(!drawing || !lastPoint || !activeTile) return;
        var p = pos(ev);
        
        var tileIdx = getTileIndex(p.x, p.y);
        var tile = getOrCreateTile(tileIdx.row, tileIdx.col);
        var lastTileIdx = getTileIndex(lastPoint.x, lastPoint.y);
        
        if (tileIdx.key !== lastTileIdx.key) {
          var lastTile = activeTile;
          
          var lastLocal = toLocalCoord(lastPoint.x, lastPoint.y, lastTile);
          var pLocal = toLocalCoord(p.x, p.y, lastTile);
          lastTile.ctx.lineTo(pLocal.x, pLocal.y);
          lastTile.ctx.stroke();
          lastTile.ctx.closePath();
          
          activeTile = tile;
          var lastLocalInNew = toLocalCoord(lastPoint.x, lastPoint.y, tile);
          var pLocalInNew = toLocalCoord(p.x, p.y, tile);
          
          applyStroke(tile.ctx);
          tile.ctx.beginPath();
          tile.ctx.moveTo(lastLocalInNew.x, lastLocalInNew.y);
          tile.ctx.lineTo(pLocalInNew.x, pLocalInNew.y);
          tile.ctx.stroke();
          
          if (currentTiles.indexOf(tile) === -1) {
            currentTiles.push(tile);
          }
        } else {
          var local = toLocalCoord(p.x, p.y, tile);
          tile.ctx.lineTo(local.x, local.y);
          tile.ctx.stroke();
        }
        
        lastPoint = p;
        ev.preventDefault();
      }
      
      function end(){
        if (!drawing) return;
        drawing = false;
        lastPoint = null;
        activeTile = null;
        
        currentTiles.forEach(function(tile){
          tile.ctx.closePath();
        });
        currentTiles = [];
      }
      
      function enable(on){
        drawingEnabled = !!on;
        
        Object.keys(canvasTiles).forEach(function(key){
          canvasTiles[key].canvas.style.pointerEvents = drawingEnabled ? 'auto' : 'none';
        });
        
        toggleBtn.textContent = drawingEnabled ? '停止绘图' : '开始绘图';
        toggleBtn.setAttribute('aria-pressed', drawingEnabled ? 'true' : 'false');
      }
      
      function clearAll(){
        Object.keys(canvasTiles).forEach(function(key){
          var tile = canvasTiles[key];
          tile.ctx.clearRect(0, 0, tile.canvas.width, tile.canvas.height);
        });
      }
      
      function toggleHidden(){
        var firstKey = Object.keys(canvasTiles)[0];
        if (!firstKey) return;
        
        var firstCanvas = canvasTiles[firstKey].canvas;
        var isHidden = firstCanvas.style.display === 'none';
        
        Object.keys(canvasTiles).forEach(function(key){
          canvasTiles[key].canvas.style.display = isHidden ? 'block' : 'none';
        });
        
        if (hideBtn) {
          hideBtn.textContent = isHidden ? '隐藏画布' : '显示画布';
        }
      }
      
      function saveImage(){
        var docSize = getDocSize();
        var ratio = dpr();
        
        var tempCanvas = document.createElement('canvas');
        tempCanvas.width = Math.floor(docSize.w * ratio);
        tempCanvas.height = Math.floor(docSize.h * ratio);
        var tempCtx = tempCanvas.getContext('2d');
        tempCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
        
        Object.keys(canvasTiles).forEach(function(key){
          var tile = canvasTiles[key];
          var x = tile.col * tileSize.w;
          var y = tile.row * tileSize.h;
          tempCtx.drawImage(tile.canvas, x, y, tileSize.w, tileSize.h);
        });
        
        var a = document.createElement('a');
        a.download = 'drawing.png';
        a.href = tempCanvas.toDataURL('image/png');
        a.click();
      }
      
      function initCanvas(){
        tileSize = getTileSize();
        
        var scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        var scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        var startRow = Math.floor(scrollY / tileSize.h);
        var startCol = Math.floor(scrollX / tileSize.w);
        
        for (var row = startRow - 1; row <= startRow + 1; row++) {
          for (var col = startCol - 1; col <= startCol + 1; col++) {
            if (row >= 0 && col >= 0) {
              getOrCreateTile(row, col);
            }
          }
        }
      }
      
      document.addEventListener('mousedown', start);
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', end);
      document.addEventListener('touchstart', start, {passive:false});
      document.addEventListener('touchmove', move, {passive:false});
      document.addEventListener('touchend', end, {passive:false});
      
      toggleBtn.addEventListener('click', function(){ enable(!drawingEnabled); });
      
      eraserBtn.addEventListener('click', function(){ 
        erasing = !erasing; 
        eraserBtn.textContent = erasing ? '画笔' : '橡皮';
      });
      
      clearBtn.addEventListener('click', clearAll);
      hideBtn.addEventListener('click', toggleHidden);
      saveBtn.addEventListener('click', saveImage);
      
      window.addEventListener('keydown', function(e){
        var t = (e.target && e.target.tagName || '').toLowerCase();
        if(t === 'input' || t === 'textarea') return;
        if (e.key === 'd' || e.key === 'D') enable(!drawingEnabled);
        else if (e.key === 'e' || e.key === 'E') eraserBtn.click();
        else if (e.key === 'c' || e.key === 'C') clearBtn.click();
        else if (e.key === 's' || e.key === 'S') { e.preventDefault(); saveBtn.click(); }
        else if (e.key === 'h' || e.key === 'H') hideBtn.click();
      });
      
      window.addEventListener('resize', function(){
        var oldTileSize = { w: tileSize.w, h: tileSize.h };
        tileSize = getTileSize();
        
        if (oldTileSize.w !== tileSize.w || oldTileSize.h !== tileSize.h) {
          Object.keys(canvasTiles).forEach(function(key){
            var tile = canvasTiles[key];
            var ratio = dpr();
            
            tile.canvas.style.left = (tile.col * tileSize.w) + 'px';
            tile.canvas.style.top = (tile.row * tileSize.h) + 'px';
            tile.canvas.style.width = tileSize.w + 'px';
            tile.canvas.style.height = tileSize.h + 'px';
            
            tile.canvas.width = Math.floor(tileSize.w * ratio);
            tile.canvas.height = Math.floor(tileSize.h * ratio);
            tile.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
          });
        }
      });
      
      var scrollTimer = null;
      window.addEventListener('scroll', function(){
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function(){
          var scrollX = window.pageXOffset || document.documentElement.scrollLeft;
          var scrollY = window.pageYOffset || document.documentElement.scrollTop;
          
          var visibleRow = Math.floor(scrollY / tileSize.h);
          var visibleCol = Math.floor(scrollX / tileSize.w);
          
          for (var row = visibleRow - 1; row <= visibleRow + 1; row++) {
            for (var col = visibleCol - 1; col <= visibleCol + 1; col++) {
              if (row >= 0 && col >= 0) {
                getOrCreateTile(row, col);
              }
            }
          }
        }, 100);
      });
      
      initCanvas();
      
    }catch(e){
      console && console.error && console.error('fg-canvas init error:', e);
    }
  }
  
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();