(function (root) {
  'use strict';

  function renderScope(canvas, simState, vcc) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var dpr = root.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(260, Math.round(rect.width || 360));
    var h = Math.max(116, Math.round(rect.height || 128));
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Dark instrument CRT backdrop
    ctx.fillStyle = '#0F1A27';
    ctx.fillRect(0, 0, w, h);

    var padL = 34;
    var padR = 10;
    var padT = 14;
    var padB = 16;
    var plotW = w - padL - padR;
    var plotH = h - padT - padB;
    var maxV = Math.max(5, Number(vcc) || 5) * 1.12;

    function vy(v) {
      return padT + plotH - (Math.max(0, Math.min(maxV, v)) / maxV) * plotH;
    }

    // Subtle graticule grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    ctx.lineWidth = 1;
    for (var gx = 0; gx <= 8; gx++) {
      var x = padL + (plotW * gx) / 8;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }
    for (var gy = 0; gy <= 4; gy++) {
      var y = padT + (plotH * gy) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
    }

    // 2/3 Vcc & 1/3 Vcc threshold dashed lines
    var y23 = vy((2 / 3) * vcc);
    var y13 = vy((1 / 3) * vcc);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(244, 185, 54, 0.45)';
    ctx.beginPath();
    ctx.moveTo(padL, y23);
    ctx.lineTo(padL + plotW, y23);
    ctx.moveTo(padL, y13);
    ctx.lineTo(padL + plotW, y13);
    ctx.stroke();
    ctx.restore();

    ctx.font = '600 9.5px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = 'rgba(244, 185, 54, 0.85)';
    ctx.fillText('⅔V', 6, y23 + 3);
    ctx.fillText('⅓V', 6, y13 + 3);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.fillText('0V', 10, padT + plotH + 3);

    var hist = simState.history || [];
    if (hist.length > 1) {
      // Pin 3 VOUT trace (Emerald)
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = 0; i < hist.length; i++) {
        var px = padL + (i / (220 - 1)) * plotW;
        var pyOut = vy(hist[i].vout);
        if (i === 0) ctx.moveTo(px, pyOut);
        else ctx.lineTo(px, pyOut);
      }
      ctx.stroke();

      // Capacitor Vc trace (Amber)
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var j = 0; j < hist.length; j++) {
        var cx = padL + (j / (220 - 1)) * plotW;
        var pyVc = vy(hist[j].vc);
        if (j === 0) ctx.moveTo(cx, pyVc);
        else ctx.lineTo(cx, pyVc);
      }
      ctx.stroke();
    }

    // Legend top-right
    ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillStyle = '#34D399';
    ctx.fillText('■ OUT (P3)', padL + 6, 11);
    ctx.fillStyle = '#FBBF24';
    ctx.fillText('■ Vc (P2/6)', padL + 84, 11);

    ctx.restore();
  }

  root.Scope555 = {
    renderScope: renderScope
  };
}(typeof self !== 'undefined' ? self : this));
