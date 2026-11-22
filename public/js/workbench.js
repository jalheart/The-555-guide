(function (root) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  // Breadboard geometry constants (in SVG user units, viewBox 0 0 920 560)
  var BB = {
    x: 110,
    y: 120,
    w: 700,
    h: 320,
    colStart: 150,
    colStep: 21.5,
    rows: {
      TOP_POS: 146,
      TOP_NEG: 168,
      A: 204,
      B: 223,
      C: 242,
      D: 261,
      E: 280,
      F: 318,
      G: 337,
      H: 356,
      I: 375,
      J: 394,
      BOT_POS: 422,
      BOT_NEG: 444
    }
  };

  function el(tag, attrs, children) {
    var node = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k) && attrs[k] !== undefined && attrs[k] !== null) {
          node.setAttribute(k, String(attrs[k]));
        }
      }
    }
    if (children) {
      for (var i = 0; i < children.length; i++) {
        if (children[i]) node.appendChild(children[i]);
      }
    }
    return node;
  }

  function txt(str, attrs) {
    var node = el('text', attrs);
    node.textContent = str;
    return node;
  }

  function holeXY(col, row) {
    var x = BB.colStart + (col - 1) * BB.colStep;
    var y = BB.rows[row] !== undefined ? BB.rows[row] : 280;
    return { x: x, y: y };
  }

  function buildCuttingMatBase(svg) {
    var defs = el('defs');

    var minorPat = el('pattern', { id: 'mat-minor', width: 20, height: 20, patternUnits: 'userSpaceOnUse' }, [
      el('path', { d: 'M 20 0 L 0 0 0 20', fill: 'none', stroke: 'rgba(255,255,255,0.08)', 'stroke-width': 0.8 })
    ]);
    var majorPat = el('pattern', { id: 'mat-major', width: 100, height: 100, patternUnits: 'userSpaceOnUse' }, [
      el('rect', { width: 100, height: 100, fill: 'url(#mat-minor)' }),
      el('path', { d: 'M 100 0 L 0 0 0 100', fill: 'none', stroke: 'rgba(255,255,255,0.18)', 'stroke-width': 1.1 })
    ]);
    var glowFilter = el('filter', { id: 'glow-yellow', x: '-35%', y: '-35%', width: '170%', height: '170%' }, [
      el('feDropShadow', { dx: 0, dy: 0, stdDeviation: 4, 'flood-color': '#F4B936', 'flood-opacity': 0.95 })
    ]);
    defs.appendChild(minorPat);
    defs.appendChild(majorPat);
    defs.appendChild(glowFilter);
    svg.appendChild(defs);

    var viewport = el('g', { id: 'wb-viewport' });

    // ESD Mat rectangle
    var mat = el('g', { id: 'cutting-mat' });
    mat.appendChild(el('rect', {
      x: 40, y: 40, width: 840, height: 480, rx: 14,
      fill: '#1E524E', stroke: '#143634', 'stroke-width': 3
    }));
    mat.appendChild(el('rect', {
      x: 56, y: 56, width: 808, height: 448, rx: 6,
      fill: 'url(#mat-major)', stroke: 'rgba(255,255,255,0.28)', 'stroke-width': 1.2
    }));

    // Ruler marks along top & left of mat
    for (var rx = 60; rx <= 860; rx += 40) {
      mat.appendChild(el('line', { x1: rx, y1: 50, x2: rx, y2: 56, stroke: 'rgba(255,255,255,0.4)', 'stroke-width': 1 }));
      mat.appendChild(txt(String((rx - 60) / 20), {
        x: rx, y: 49, 'text-anchor': 'middle',
        fill: 'rgba(255,255,255,0.52)', 'font-size': 8.5,
        'font-family': 'ui-monospace, SFMono-Regular, monospace'
      }));
    }
    for (var ry = 60; ry <= 500; ry += 40) {
      mat.appendChild(el('line', { x1: 50, y1: ry, x2: 56, y2: ry, stroke: 'rgba(255,255,255,0.4)', 'stroke-width': 1 }));
    }

    viewport.appendChild(mat);
    svg.appendChild(viewport);
    return viewport;
  }

  function renderBreadboardBase(parent) {
    var g = el('g', { id: 'breadboard-base' });

    // Drop shadow
    g.appendChild(el('rect', {
      x: BB.x + 4, y: BB.y + 6, width: BB.w, height: BB.h + 26, rx: 12,
      fill: 'rgba(10, 24, 18, 0.35)'
    }));

    // Main ABS plastic body
    g.appendChild(el('rect', {
      x: BB.x, y: BB.y, width: BB.w, height: BB.h + 26, rx: 10,
      fill: '#F7F4EC', stroke: '#D5CEBA', 'stroke-width': 2
    }));

    // Power rail stripes
    g.appendChild(el('line', { x1: BB.x + 22, y1: BB.rows.TOP_POS - 8, x2: BB.x + BB.w - 22, y2: BB.rows.TOP_POS - 8, stroke: '#DC2626', 'stroke-width': 2 }));
    g.appendChild(el('line', { x1: BB.x + 22, y1: BB.rows.TOP_NEG + 9, x2: BB.x + BB.w - 22, y2: BB.rows.TOP_NEG + 9, stroke: '#2563EB', 'stroke-width': 2 }));
    g.appendChild(el('line', { x1: BB.x + 22, y1: BB.rows.BOT_POS - 8, x2: BB.x + BB.w - 22, y2: BB.rows.BOT_POS - 8, stroke: '#DC2626', 'stroke-width': 2 }));
    g.appendChild(el('line', { x1: BB.x + 22, y1: BB.rows.BOT_NEG + 9, x2: BB.x + BB.w - 22, y2: BB.rows.BOT_NEG + 9, stroke: '#2563EB', 'stroke-width': 2 }));

    // + / - indicators
    g.appendChild(txt('+', { x: BB.x + 18, y: BB.rows.TOP_POS + 4, fill: '#DC2626', 'font-size': 13, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));
    g.appendChild(txt('−', { x: BB.x + 18, y: BB.rows.TOP_NEG + 4, fill: '#2563EB', 'font-size': 13, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));
    g.appendChild(txt('+', { x: BB.x + 18, y: BB.rows.BOT_POS + 4, fill: '#DC2626', 'font-size': 13, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));
    g.appendChild(txt('−', { x: BB.x + 18, y: BB.rows.BOT_NEG + 4, fill: '#2563EB', 'font-size': 13, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));

    // Center DIP channel ravine
    g.appendChild(el('rect', {
      x: BB.x + 18, y: 291, width: BB.w - 36, height: 16, rx: 3,
      fill: '#E7E1D0', stroke: '#D2CBB6', 'stroke-width': 1
    }));

    // Row labels
    var rowNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    for (var r = 0; r < rowNames.length; r++) {
      var rn = rowNames[r];
      g.appendChild(txt(rn, {
        x: BB.x + 22, y: BB.rows[rn] + 3.5, fill: '#64748B',
        'font-size': 9, 'font-weight': 700, 'font-family': 'ui-monospace, monospace'
      }));
    }

    // Socket holes (30 cols)
    for (var c = 1; c <= 30; c++) {
      var cx = BB.colStart + (c - 1) * BB.colStep;
      if (c === 1 || c % 5 === 0) {
        g.appendChild(txt(String(c), {
          x: cx, y: 190, 'text-anchor': 'middle', fill: '#64748B',
          'font-size': 8.5, 'font-weight': 600, 'font-family': 'ui-monospace, monospace'
        }));
      }

      // Power rail holes (skip every 6th group visual gap at 1,6,11.. or render cleanly)
      var railKeys = ['TOP_POS', 'TOP_NEG', 'BOT_POS', 'BOT_NEG'];
      for (var rk = 0; rk < railKeys.length; rk++) {
        g.appendChild(el('rect', {
          x: cx - 3, y: BB.rows[railKeys[rk]] - 3, width: 6, height: 6, rx: 1.2,
          fill: '#2A333E'
        }));
      }

      for (var ri = 0; ri < rowNames.length; ri++) {
        g.appendChild(el('rect', {
          x: cx - 3, y: BB.rows[rowNames[ri]] - 3, width: 6, height: 6, rx: 1.2,
          fill: '#26303B'
        }));
      }
    }

    // Power rail bridge wires on column 2 (ties top & bottom +V and -GND together)
    var topPos2 = holeXY(2, 'TOP_POS');
    var botPos2 = holeXY(2, 'BOT_POS');
    var topNeg3 = holeXY(3, 'TOP_NEG');
    var botNeg3 = holeXY(3, 'BOT_NEG');
    g.appendChild(el('path', {
      d: 'M ' + topPos2.x + ' ' + topPos2.y + ' C ' + (topPos2.x - 28) + ' ' + (topPos2.y + 70) + ', ' + (botPos2.x - 28) + ' ' + (botPos2.y - 70) + ', ' + botPos2.x + ' ' + botPos2.y,
      fill: 'none', stroke: '#DC2626', 'stroke-width': 3.5, 'stroke-linecap': 'round'
    }));
    g.appendChild(el('path', {
      d: 'M ' + topNeg3.x + ' ' + topNeg3.y + ' C ' + (topNeg3.x - 16) + ' ' + (topNeg3.y + 70) + ', ' + (botNeg3.x - 16) + ' ' + (botNeg3.y - 70) + ', ' + botNeg3.x + ' ' + botNeg3.y,
      fill: 'none', stroke: '#1F2937', 'stroke-width': 3.5, 'stroke-linecap': 'round'
    }));

    // Supply tag on left
    g.appendChild(el('rect', { x: 64, y: 142, width: 38, height: 22, rx: 4, fill: '#DC2626' }));
    g.appendChild(txt('+Vcc', { x: 83, y: 157, 'text-anchor': 'middle', fill: '#FFF', 'font-size': 10, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));
    g.appendChild(el('rect', { x: 64, y: 168, width: 38, height: 20, rx: 4, fill: '#152232' }));
    g.appendChild(txt('GND', { x: 83, y: 181, 'text-anchor': 'middle', fill: '#FFF', 'font-size': 10, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));

    parent.appendChild(g);
  }

  function renderDip555OnBreadboard(parent, icType, showXray) {
    var p8 = holeXY(13, 'E');
    var p5 = holeXY(16, 'E');
    var p1 = holeXY(13, 'F');
    var x0 = p8.x - 10;
    var x1 = p5.x + 10;
    var y0 = p8.y - 4;
    var y1 = p1.y + 4;
    var w = x1 - x0;
    var h = y1 - y0;

    var g = el('g', {
      id: 'bb-555-ic',
      class: 'interactive-part',
      'data-part-id': 'ic-555',
      'data-hover-label': (icType || 'NE555P') + ' Timer IC',
      style: 'cursor: pointer;'
    });

    // Metal legs into E13-16 and F13-16
    for (var col = 13; col <= 16; col++) {
      var topPin = holeXY(col, 'E');
      var botPin = holeXY(col, 'F');
      var topNum = 8 - (col - 13);
      var botNum = 1 + (col - 13);

      g.appendChild(el('rect', {
        x: topPin.x - 3, y: topPin.y - 3, width: 6, height: 10, rx: 1,
        fill: '#64748B', stroke: '#1E293B', 'stroke-width': 0.9,
        'data-pin': topNum, 'data-hover-label': 'Pin ' + topNum, class: 'ic-pin-hit'
      }));
      g.appendChild(el('rect', {
        x: botPin.x - 3, y: botPin.y - 7, width: 6, height: 10, rx: 1,
        fill: '#64748B', stroke: '#1E293B', 'stroke-width': 0.9,
        'data-pin': botNum, 'data-hover-label': 'Pin ' + botNum, class: 'ic-pin-hit'
      }));
    }

    // Epoxy DIP-8 body
    g.appendChild(el('rect', {
      x: x0, y: y0 + 4, width: w, height: h - 8, rx: 4,
      fill: '#1E252E', stroke: '#0F141A', 'stroke-width': 1.5
    }));
    // Left U-notch & Pin 1 dot
    g.appendChild(el('path', {
      d: 'M ' + x0 + ' ' + (y0 + h / 2 - 7) + ' A 7 7 0 0 1 ' + x0 + ' ' + (y0 + h / 2 + 7),
      fill: '#374151'
    }));
    g.appendChild(el('circle', { cx: x0 + 9, cy: y1 - 11, r: 2.5, fill: '#9CA3AF' }));

    g.appendChild(txt(icType || 'NE555P', {
      x: x0 + w / 2 + 3, y: y0 + h / 2 + 4,
      'text-anchor': 'middle', fill: '#E5E7EB',
      'font-size': 11, 'font-weight': 700, 'font-family': 'ui-monospace, monospace'
    }));

    parent.appendChild(g);
  }

  function renderResistorOnBreadboard(parent, comp, ohms, wireId) {
    var p1 = holeXY(comp.col1, comp.row1);
    var p2 = holeXY(comp.col2, comp.row2);
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    var len = Math.hypot(dx, dy);
    var angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    var mx = (p1.x + p2.x) / 2;
    var my = (p1.y + p2.y) / 2;
    var resText = root.Math555.formatResistance(ohms);
    var lblPrefix = comp.label && comp.label.indexOf('Ω') === -1 ? comp.label + ' ' : '';

    var g = el('g', {
      class: 'bb-component',
      'data-comp-id': comp.id,
      'data-part-id': 'resistors',
      'data-hover-label': lblPrefix + resText,
      'data-wire-id': wireId || '',
      style: 'cursor: pointer;'
    });

    // Metal wire leads (high-contrast dark steel against light breadboard)
    g.appendChild(el('line', {
      x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
      stroke: '#475569', 'stroke-width': 2.4, 'stroke-linecap': 'round'
    }));
    g.appendChild(el('circle', { cx: p1.x, cy: p1.y, r: 2.8, fill: '#334155' }));
    g.appendChild(el('circle', { cx: p2.x, cy: p2.y, r: 2.8, fill: '#334155' }));

    var bodyLen = Math.min(34, Math.max(22, len * 0.56));
    var bodyH = 10;
    var bodyG = el('g', { transform: 'translate(' + mx + ',' + my + ') rotate(' + angle + ')' });

    bodyG.appendChild(el('rect', {
      x: -bodyLen / 2, y: -bodyH / 2, width: bodyLen, height: bodyH, rx: 4,
      fill: '#E5CFA7', stroke: '#B69B6E', 'stroke-width': 1
    }));

    var bands = root.Math555.getResistorBands(ohms);
    var bandOffsets = [-0.28, -0.1, 0.08, 0.28];
    for (var b = 0; b < 4; b++) {
      bodyG.appendChild(el('rect', {
        x: bandOffsets[b] * bodyLen - 1.6,
        y: -bodyH / 2 + 0.5,
        width: 3.2,
        height: bodyH - 1,
        fill: bands[b].hex
      }));
    }

    g.appendChild(bodyG);
    parent.appendChild(g);
  }

  function getCompMetaForSvg(comp, params) {
    if (comp.kind === 'cap-elec') {
      var capVal = comp.valueKey ? root.Math555.formatCapacitance(params[comp.valueKey]) : (comp.label || '10 µF');
      return { partId: 'cap-elec', hoverLabel: (comp.label || 'C') + ' ' + capVal };
    }
    if (comp.kind === 'cap-ceramic') {
      return { partId: 'cap-ceramic', hoverLabel: comp.label || '10 nF Ceramic Cap' };
    }
    if (comp.kind === 'diode') {
      return { partId: 'diode', hoverLabel: comp.label || '1N4148 Diode' };
    }
    if (comp.kind === 'led') {
      return { partId: 'leds', hoverLabel: comp.label || '5mm LED' };
    }
    if (comp.kind === 'button') {
      return { partId: 'button', hoverLabel: comp.label || 'Tactile Switch' };
    }
    if (comp.kind === 'pot') {
      return { partId: 'pot', hoverLabel: comp.label || '50 kΩ Potentiometer' };
    }
    if (comp.kind === 'buzzer') {
      return { partId: 'buzzer', hoverLabel: comp.label || '5V Piezo Buzzer' };
    }
    if (comp.kind === 'ldr') {
      return { partId: 'ldr', hoverLabel: comp.label || 'CdS Photoresistor (LDR)' };
    }
    return { partId: 'resistors', hoverLabel: comp.label || '' };
  }

  function renderComponentOnBreadboard(parent, comp, params, wireId) {
    if (comp.kind === 'resistor') {
      var ohms = comp.fixedOhms || (comp.valueKey ? params[comp.valueKey] : 10000);
      renderResistorOnBreadboard(parent, comp, ohms, wireId);
      return;
    }

    var p1 = holeXY(comp.col1, comp.row1);
    var p2 = holeXY(comp.col2, comp.row2);
    var mx = (p1.x + p2.x) / 2;
    var my = (p1.y + p2.y) / 2;
    var meta = getCompMetaForSvg(comp, params);

    var g = el('g', {
      class: 'bb-component',
      'data-comp-id': comp.id,
      'data-part-id': meta.partId,
      'data-hover-label': meta.hoverLabel,
      'data-wire-id': wireId || '',
      style: 'cursor: pointer;'
    });

    if (comp.kind === 'cap-elec') {
      g.appendChild(el('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: '#475569', 'stroke-width': 2.4 }));
      g.appendChild(el('circle', { cx: p1.x, cy: p1.y, r: 2.5, fill: '#334155' }));
      g.appendChild(el('circle', { cx: p2.x, cy: p2.y, r: 2.5, fill: '#334155' }));
      var cAng = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
      var cg = el('g', { transform: 'translate(' + mx + ',' + my + ') rotate(' + cAng + ')' });
      cg.appendChild(el('rect', { x: -13, y: -10, width: 26, height: 20, rx: 5, fill: '#1E3A8A', stroke: '#0F172A', 'stroke-width': 1.2 }));
      cg.appendChild(el('rect', { x: 6, y: -10, width: 5, height: 20, rx: 2, fill: '#93C5FD' }));
      cg.appendChild(txt('−', { x: 8.5, y: 3, 'text-anchor': 'middle', fill: '#0F172A', 'font-size': 9, 'font-weight': 800 }));
      g.appendChild(cg);
    } else if (comp.kind === 'cap-ceramic') {
      g.appendChild(el('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: '#475569', 'stroke-width': 2.2 }));
      g.appendChild(el('circle', { cx: p1.x, cy: p1.y, r: 2.3, fill: '#334155' }));
      g.appendChild(el('circle', { cx: p2.x, cy: p2.y, r: 2.3, fill: '#334155' }));
      var cerAng = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
      var cerg = el('g', { transform: 'translate(' + mx + ',' + my + ') rotate(' + cerAng + ')' });
      cerg.appendChild(el('ellipse', { cx: 0, cy: 0, rx: 9, ry: 6, fill: '#D97706', stroke: '#92400E', 'stroke-width': 1.1 }));
      g.appendChild(cerg);
    } else if (comp.kind === 'diode') {
      g.appendChild(el('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: '#475569', 'stroke-width': 2.2 }));
      var ang = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
      var dg = el('g', { transform: 'translate(' + mx + ',' + my + ') rotate(' + ang + ')' });
      dg.appendChild(el('rect', { x: -11, y: -4, width: 22, height: 8, rx: 2, fill: '#EA580C', stroke: '#7C2D12', 'stroke-width': 1 }));
      dg.appendChild(el('rect', { x: 5, y: -4, width: 4, height: 8, fill: '#111827' }));
      g.appendChild(dg);
    } else if (comp.kind === 'led') {
      g.appendChild(el('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: '#475569', 'stroke-width': 2.4 }));
      g.appendChild(el('circle', {
        cx: mx, cy: my, r: 19,
        fill: comp.color || '#EF4444',
        opacity: 0.1,
        class: 'live-led-halo',
        'data-led-id': comp.id,
        'data-sink': comp.sinkLed ? '1' : '0'
      }));
      g.appendChild(el('circle', {
        cx: mx, cy: my, r: 9.5,
        fill: comp.color || '#EF4444',
        stroke: '#1E293B', 'stroke-width': 1.2,
        class: 'live-led-lens',
        'data-led-id': comp.id,
        'data-sink': comp.sinkLed ? '1' : '0'
      }));
      g.appendChild(el('circle', { cx: mx - 2.5, cy: my - 2.5, r: 2.5, fill: 'rgba(255,255,255,0.65)' }));
    } else if (comp.kind === 'button') {
      var bx = Math.min(p1.x, p2.x) - 4;
      var by = p1.y - 16;
      var bw = Math.abs(p2.x - p1.x) + 8;
      var bh = 32;
      var btnGroup = el('g', {
        class: 'bb-interactive-btn',
        'data-btn-role': comp.role || 'trigger',
        style: 'cursor: pointer;'
      });
      btnGroup.appendChild(el('rect', { x: bx, y: by, width: bw, height: bh, rx: 5, fill: '#334155', stroke: '#0F172A', 'stroke-width': 1.5 }));
      btnGroup.appendChild(el('circle', { cx: mx, cy: my, r: 10, fill: comp.role === 'reset' ? '#2563EB' : '#F4B936', stroke: '#0F172A', 'stroke-width': 1.2 }));
      g.appendChild(btnGroup);
    } else if (comp.kind === 'pot') {
      g.appendChild(el('rect', { x: p1.x - 8, y: p1.y - 28, width: p2.x - p1.x + 16, height: 34, rx: 6, fill: '#1D4ED8', stroke: '#1E3A8A', 'stroke-width': 1.5 }));
      var px = mx;
      var py = p1.y - 11;
      g.appendChild(el('circle', { cx: px, cy: py, r: 12, fill: '#E2E8F0', stroke: '#475569', 'stroke-width': 1.2 }));
      var rot = -135 + (Number(params.potRatio || 0.5) * 270);
      g.appendChild(el('line', {
        x1: px, y1: py, x2: px, y2: py - 9,
        stroke: '#152232', 'stroke-width': 2.5, 'stroke-linecap': 'round',
        transform: 'rotate(' + rot + ' ' + px + ' ' + py + ')',
        class: 'live-pot-needle'
      }));
    } else if (comp.kind === 'buzzer') {
      g.appendChild(el('circle', { cx: mx, cy: my, r: 22, fill: '#1E293B', stroke: '#0F172A', 'stroke-width': 2 }));
      g.appendChild(el('circle', { cx: mx, cy: my, r: 6, fill: '#CBD5E1' }));
      g.appendChild(el('circle', { cx: mx, cy: my, r: 28, fill: 'none', stroke: '#F4B936', 'stroke-width': 2, opacity: 0, class: 'live-buzzer-wave' }));
    } else if (comp.kind === 'ldr') {
      g.appendChild(el('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: '#9CA3AF', 'stroke-width': 2 }));
      g.appendChild(el('ellipse', { cx: mx, cy: my, rx: 13, ry: 10, fill: '#FEF3C7', stroke: '#B45309', 'stroke-width': 1.5 }));
      g.appendChild(el('path', {
        d: 'M ' + (mx - 8) + ' ' + (my - 3) + ' Q ' + (mx - 3) + ' ' + (my + 4) + ', ' + mx + ' ' + my + ' T ' + (mx + 8) + ' ' + (my + 2),
        fill: 'none', stroke: '#B91C1C', 'stroke-width': 1.8
      }));
    }

    parent.appendChild(g);
  }

  function renderWire(parent, fromCoord, toCoord, color, wireId) {
    var a = holeXY(fromCoord[0], fromCoord[1]);
    var b = holeXY(toCoord[0], toCoord[1]);
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var mx = (a.x + b.x) / 2;
    var my = (a.y + b.y) / 2;

    var icMinX = holeXY(13, 'E').x - 10;
    var icMaxX = holeXY(16, 'E').x + 10;
    var icCenterX = (icMinX + icMaxX) / 2;
    var crossesIc = Math.min(a.y, b.y) < BB.rows.F + 6 &&
      Math.max(a.y, b.y) > BB.rows.E - 6 &&
      Math.max(a.x, b.x) > icMinX &&
      Math.min(a.x, b.x) < icMaxX;

    var pathD;
    if (crossesIc) {
      var detourX = mx <= icCenterX ? holeXY(12, 'E').x : holeXY(17, 'E').x;
      var ctrlX = detourX + (detourX <= icCenterX ? -12 : 12);
      pathD = 'M ' + a.x + ' ' + a.y + ' C ' + ctrlX + ' ' + a.y + ', ' + ctrlX + ' ' + b.y + ', ' + b.x + ' ' + b.y;
    } else {
      var arc = Math.min(28, Math.max(10, Math.hypot(dx, dy) * 0.22));
      var cx = mx + (Math.abs(dy) > Math.abs(dx) ? -arc * 0.6 : 0);
      var cy = my - arc;
      pathD = 'M ' + a.x + ' ' + a.y + ' Q ' + cx + ' ' + cy + ' ' + b.x + ' ' + b.y;
    }

    var g = el('g', {
      class: 'bb-wire',
      'data-wire-id': wireId || ''
    });

    g.appendChild(el('path', {
      d: pathD,
      fill: 'none', stroke: 'rgba(15,23,42,0.28)', 'stroke-width': 5.2, 'stroke-linecap': 'round'
    }));
    g.appendChild(el('path', {
      d: pathD,
      fill: 'none', stroke: color || '#E87722', 'stroke-width': 3.4, 'stroke-linecap': 'round',
      class: 'wire-stroke'
    }));
    g.appendChild(el('circle', { cx: a.x, cy: a.y, r: 3.1, fill: '#475569', stroke: '#1F2937', 'stroke-width': 0.9 }));
    g.appendChild(el('circle', { cx: b.x, cy: b.y, r: 3.1, fill: '#475569', stroke: '#1F2937', 'stroke-width': 0.9 }));

    parent.appendChild(g);
  }

  function renderPinoutHero(viewport, state) {
    var g = el('g', { id: 'pinout-hero' });

    // Header label on mat
    g.appendChild(txt('NE555 / TLC555 DIP-8 PACKAGE & KIT PARTS', {
      x: 460, y: 88, 'text-anchor': 'middle', fill: 'rgba(255,255,255,0.88)',
      'font-size': 13, 'font-weight': 700, 'font-family': 'ui-monospace, monospace', 'letter-spacing': '1.2'
    }));

    // Central large DIP-8 Pinout Explorer
    var icX = 270;
    var icY = 135;
    var icW = 140;
    var icH = 270;

    // Shadow
    g.appendChild(el('rect', { x: icX + 6, y: icY + 8, width: icW, height: icH, rx: 10, fill: 'rgba(10,20,16,0.4)' }));
    // Body
    g.appendChild(el('rect', { x: icX, y: icY, width: icW, height: icH, rx: 8, fill: '#1C2530', stroke: '#F4B936', 'stroke-width': 2 }));
    // Top notch
    g.appendChild(el('path', { d: 'M ' + (icX + icW / 2 - 18) + ' ' + icY + ' A 18 18 0 0 0 ' + (icX + icW / 2 + 18) + ' ' + icY, fill: '#1E524E' }));
    // Pin 1 indicator dot
    g.appendChild(el('circle', { cx: icX + 24, cy: icY + 34, r: 6, fill: '#F4B936' }));

    var heroBody = el('g', {
      'data-part-id': 'ic-555',
      'data-hover-label': (state.icType || 'NE555') + ' Timer IC',
      style: 'cursor:pointer;'
    });
    heroBody.appendChild(el('rect', { x: icX + 10, y: icY + 10, width: icW - 20, height: icH - 20, fill: 'transparent' }));
    heroBody.appendChild(txt(state.icType || 'NE555', {
      x: icX + icW / 2, y: icY + icH / 2 - 4, 'text-anchor': 'middle',
      fill: '#F8FAFC', 'font-size': 22, 'font-weight': 800, 'font-family': 'ui-monospace, monospace'
    }));
    heroBody.appendChild(txt('TIMER IC', {
      x: icX + icW / 2, y: icY + icH / 2 + 18, 'text-anchor': 'middle',
      fill: '#94A3B8', 'font-size': 10, 'font-weight': 600, 'font-family': 'ui-monospace, monospace'
    }));
    g.appendChild(heroBody);

    // Left pins 1..4, Right pins 8..5
    var leftPins = [1, 2, 3, 4];
    var rightPins = [8, 7, 6, 5];
    var pins = root.Circuits555.PINS;

    for (var i = 0; i < 4; i++) {
      var py = icY + 42 + i * 62;
      var lp = pins[leftPins[i] - 1];
      var rp = pins[rightPins[i] - 1];

      // Left pin + callout tag
      var lGroup = el('g', { class: 'pin-callout', 'data-wire-id': 'pin-' + lp.num, 'data-pin': lp.num, 'data-hover-label': 'Pin ' + lp.num + ' · ' + lp.name, style: 'cursor:pointer;' });
      lGroup.appendChild(el('rect', { x: icX - 24, y: py - 9, width: 24, height: 18, rx: 3, fill: '#D1D5DB', stroke: '#475569', 'stroke-width': 1 }));
      lGroup.appendChild(el('rect', { x: 88, y: py - 15, width: 146, height: 30, rx: 6, fill: '#FBF8F1', stroke: lp.color, 'stroke-width': 2 }));
      lGroup.appendChild(txt(lp.num + ' · ' + lp.name, { x: 100, y: py + 4, fill: '#152232', 'font-size': 11, 'font-weight': 800, 'font-family': 'ui-monospace, monospace' }));
      lGroup.appendChild(el('circle', { cx: 220, cy: py, r: 5, fill: lp.color }));
      g.appendChild(lGroup);

      // Right pin + callout tag
      var rGroup = el('g', { class: 'pin-callout', 'data-wire-id': 'pin-' + rp.num, 'data-pin': rp.num, 'data-hover-label': 'Pin ' + rp.num + ' · ' + rp.name, style: 'cursor:pointer;' });
      rGroup.appendChild(el('rect', { x: icX + icW, y: py - 9, width: 24, height: 18, rx: 3, fill: '#D1D5DB', stroke: '#475569', 'stroke-width': 1 }));
      rGroup.appendChild(el('rect', { x: icX + icW + 36, y: py - 15, width: 146, height: 30, rx: 6, fill: '#FBF8F1', stroke: rp.color, 'stroke-width': 2 }));
      rGroup.appendChild(el('circle', { cx: icX + icW + 50, cy: py, r: 5, fill: rp.color }));
      rGroup.appendChild(txt(rp.num + ' · ' + rp.name, { x: icX + icW + 64, y: py + 4, fill: '#152232', 'font-size': 11, 'font-weight': 800, 'font-family': 'ui-monospace, monospace' }));
      g.appendChild(rGroup);
    }

    // Right side parts tray on the mat
    var trayX = 635;
    var parts = [
      { id: 'resistors', title: '1/4W Resistors', sub: '220 Ω · 10 kΩ · 47 kΩ', y: 140, color: '#E5CFA7' },
      { id: 'caps', title: 'Timing Capacitors', sub: '10 nF · 10 µF · 47 µF', y: 215, color: '#1E3A8A' },
      { id: 'leds', title: 'LEDs & 1N4148 Diodes', sub: 'Red, Blue, Steering', y: 290, color: '#EF4444' },
      { id: 'inputs', title: 'Pot · LDR · Piezo · Switch', sub: 'Interactive Inputs/Outputs', y: 365, color: '#F4B936' }
    ];
    for (var p = 0; p < parts.length; p++) {
      var pt = parts[p];
      var card = el('g', { class: 'mat-part-card', 'data-part-id': pt.id, 'data-hover-label': pt.title, style: 'cursor:pointer;' });
      card.appendChild(el('rect', { x: trayX, y: pt.y, width: 205, height: 58, rx: 8, fill: '#FBF8F1', stroke: '#143634', 'stroke-width': 1.5 }));
      card.appendChild(el('rect', { x: trayX + 12, y: pt.y + 14, width: 28, height: 28, rx: 6, fill: pt.color }));
      card.appendChild(txt(pt.title, { x: trayX + 50, y: pt.y + 26, fill: '#152232', 'font-size': 11.5, 'font-weight': 700 }));
      card.appendChild(txt(pt.sub, { x: trayX + 50, y: pt.y + 43, fill: '#526274', 'font-size': 9.5, 'font-family': 'ui-monospace, monospace' }));
      g.appendChild(card);
    }

    viewport.appendChild(g);
  }

  function renderInternalBlockDiagram(viewport, params, simState, lang) {
    var isEs = lang === 'es';
    var g = el('g', { id: 'internal-block' });

    // Outer IC outline
    g.appendChild(el('rect', {
      x: 96, y: 92, width: 728, height: 380, rx: 12,
      fill: '#FBF8F1', stroke: '#152232', 'stroke-width': 2.5, 'stroke-dasharray': '6 4'
    }));
    g.appendChild(txt(isEs ? 'INTERIOR DEL TEMPORIZADOR 555 (DIAGRAMA DE BLOQUES)' : 'INSIDE THE 555 TIMER IC (FUNCTIONAL BLOCK DIAGRAM)', {
      x: 460, y: 78, 'text-anchor': 'middle', fill: '#FFFFFF',
      'font-size': 12.5, 'font-weight': 700, 'font-family': 'ui-monospace, monospace'
    }));

    // 3x 5k voltage divider
    g.appendChild(el('line', { x1: 210, y1: 118, x2: 210, y2: 438, stroke: '#152232', 'stroke-width': 2.2 }));
    var rYs = [155, 245, 335];
    for (var i = 0; i < 3; i++) {
      g.appendChild(el('rect', { x: 194, y: rYs[i], width: 32, height: 52, rx: 4, fill: '#E5CFA7', stroke: '#152232', 'stroke-width': 1.8 }));
      g.appendChild(txt('5 kΩ', { x: 210, y: rYs[i] + 30, 'text-anchor': 'middle', fill: '#152232', 'font-size': 10.5, 'font-weight': 800, 'font-family': 'ui-monospace, monospace' }));
    }
    g.appendChild(txt('PIN 8 · VCC (+5V)', { x: 210, y: 112, 'text-anchor': 'middle', fill: '#DC2626', 'font-size': 10.5, 'font-weight': 800, 'font-family': 'ui-monospace, monospace' }));
    g.appendChild(txt('PIN 1 · GND (0V)', { x: 210, y: 458, 'text-anchor': 'middle', fill: '#152232', 'font-size': 10.5, 'font-weight': 800, 'font-family': 'ui-monospace, monospace' }));

    // 2/3 Vcc & 1/3 Vcc taps
    g.appendChild(el('line', { x1: 210, y1: 226, x2: 340, y2: 226, stroke: '#7C48B5', 'stroke-width': 2.2 }));
    g.appendChild(txt('⅔ Vcc (3.33V)', { x: 274, y: 218, 'text-anchor': 'middle', fill: '#7C48B5', 'font-size': 9.5, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));
    g.appendChild(el('line', { x1: 210, y1: 316, x2: 340, y2: 316, stroke: '#7C48B5', 'stroke-width': 2.2 }));
    g.appendChild(txt('⅓ Vcc (1.67V)', { x: 274, y: 308, 'text-anchor': 'middle', fill: '#7C48B5', 'font-size': 9.5, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));

    // Upper Comparator
    var upperTripped = Boolean(params.manualThresHigh);
    g.appendChild(el('polygon', {
      points: '340,170 340,248 430,209',
      fill: upperTripped ? '#DBEAFE' : '#FFFFFF', stroke: '#2667C9', 'stroke-width': 2.2
    }));
    g.appendChild(txt('+', { x: 350, y: 196, fill: '#152232', 'font-size': 13, 'font-weight': 800 }));
    g.appendChild(txt('−', { x: 350, y: 232, fill: '#152232', 'font-size': 13, 'font-weight': 800 }));
    g.appendChild(txt('COMP 1', { x: 374, y: 213, fill: '#2667C9', 'font-size': 9.5, 'font-weight': 800, 'font-family': 'ui-monospace, monospace' }));
    // Pin 6 input
    g.appendChild(el('line', { x1: 110, y1: 192, x2: 186, y2: 192, stroke: upperTripped ? '#2667C9' : '#64748B', 'stroke-width': 2.5 }));
    g.appendChild(el('line', { x1: 234, y1: 192, x2: 340, y2: 192, stroke: upperTripped ? '#2667C9' : '#64748B', 'stroke-width': 2.5 }));
    g.appendChild(el('path', { d: 'M 186 192 Q 210 176 234 192', fill: 'none', stroke: upperTripped ? '#2667C9' : '#64748B', 'stroke-width': 2.2 }));
    g.appendChild(txt('PIN 6 · THRES', { x: 110, y: 182, 'text-anchor': 'start', fill: '#2667C9', 'font-size': 9.5, 'font-weight': 800, 'font-family': 'ui-monospace, monospace' }));

    // Lower Comparator
    var lowerTripped = Boolean(params.manualTrigLow);
    g.appendChild(el('polygon', {
      points: '340,295 340,373 430,334',
      fill: lowerTripped ? '#FFEDD5' : '#FFFFFF', stroke: '#E87722', 'stroke-width': 2.2
    }));
    g.appendChild(txt('+', { x: 350, y: 321, fill: '#152232', 'font-size': 13, 'font-weight': 800 }));
    g.appendChild(txt('−', { x: 350, y: 357, fill: '#152232', 'font-size': 13, 'font-weight': 800 }));
    g.appendChild(txt('COMP 2', { x: 374, y: 338, fill: '#E87722', 'font-size': 9.5, 'font-weight': 800, 'font-family': 'ui-monospace, monospace' }));
    // Pin 2 input
    g.appendChild(el('line', { x1: 110, y1: 352, x2: 186, y2: 352, stroke: lowerTripped ? '#E87722' : '#64748B', 'stroke-width': 2.5 }));
    g.appendChild(el('line', { x1: 234, y1: 352, x2: 340, y2: 352, stroke: lowerTripped ? '#E87722' : '#64748B', 'stroke-width': 2.5 }));
    g.appendChild(el('path', { d: 'M 186 352 Q 210 336 234 352', fill: 'none', stroke: lowerTripped ? '#E87722' : '#64748B', 'stroke-width': 2.2 }));
    g.appendChild(txt('PIN 2 · TRIG', { x: 110, y: 342, 'text-anchor': 'start', fill: '#E87722', 'font-size': 9.5, 'font-weight': 800, 'font-family': 'ui-monospace, monospace' }));

    // Wires into SR Flip-Flop
    g.appendChild(el('line', { x1: 430, y1: 209, x2: 490, y2: 209, stroke: upperTripped ? '#2667C9' : '#64748B', 'stroke-width': 2.4 }));
    g.appendChild(el('line', { x1: 430, y1: 334, x2: 490, y2: 334, stroke: lowerTripped ? '#E87722' : '#64748B', 'stroke-width': 2.4 }));

    // SR Flip-Flop Box
    var outHigh = simState.outputHigh;
    g.appendChild(el('rect', {
      x: 490, y: 185, width: 126, height: 175, rx: 8,
      fill: outHigh ? '#ECFDF5' : '#F1F5F9', stroke: '#152232', 'stroke-width': 2.2
    }));
    g.appendChild(txt('SR FLIP-FLOP', { x: 553, y: 268, 'text-anchor': 'middle', fill: '#152232', 'font-size': 11, 'font-weight': 800, 'font-family': 'ui-monospace, monospace' }));
    g.appendChild(txt('R', { x: 504, y: 213, fill: '#2667C9', 'font-size': 11, 'font-weight': 800 }));
    g.appendChild(txt('S', { x: 504, y: 338, fill: '#E87722', 'font-size': 11, 'font-weight': 800 }));
    g.appendChild(txt('Q: ' + (outHigh ? 'HIGH' : 'LOW'), {
      x: 553, y: 290, 'text-anchor': 'middle',
      fill: outHigh ? '#059669' : '#475569', 'font-size': 12, 'font-weight': 800, 'font-family': 'ui-monospace, monospace'
    }));

    // Pin 4 RESET line
    var rstLow = Boolean(params.manualResetLow);
    g.appendChild(el('line', { x1: 553, y1: 118, x2: 553, y2: 185, stroke: rstLow ? '#DC2626' : '#64748B', 'stroke-width': 2.2 }));
    g.appendChild(txt('PIN 4 · RESET (' + (rstLow ? '0V ACTIVE' : '+5V IDLE') + ')', {
      x: 553, y: 112, 'text-anchor': 'middle', fill: rstLow ? '#DC2626' : '#475569',
      'font-size': 9.5, 'font-weight': 800, 'font-family': 'ui-monospace, monospace'
    }));

    // Output Stage to Pin 3
    g.appendChild(el('line', { x1: 616, y1: 235, x2: 772, y2: 235, stroke: outHigh ? '#10B981' : '#475569', 'stroke-width': 3 }));
    g.appendChild(el('rect', {
      x: 636, y: 214, width: 62, height: 42, rx: 6,
      fill: outHigh ? '#10B981' : '#334155', stroke: '#152232', 'stroke-width': 1.8
    }));
    g.appendChild(txt('OUT', { x: 667, y: 239, 'text-anchor': 'middle', fill: '#FFFFFF', 'font-size': 11, 'font-weight': 800, 'font-family': 'ui-monospace, monospace' }));
    g.appendChild(txt('PIN 3 · ' + (outHigh ? 'HIGH' : 'LOW'), {
      x: 774, y: 224, 'text-anchor': 'end', fill: outHigh ? '#059669' : '#334155', 'font-size': 10, 'font-weight': 800, 'font-family': 'ui-monospace, monospace'
    }));

    // NPN Discharge Transistor to Pin 7
    var dischOn = simState.dischargeOn;
    g.appendChild(el('line', { x1: 616, y1: 334, x2: 660, y2: 334, stroke: dischOn ? '#D97706' : '#64748B', 'stroke-width': 2.2 }));
    g.appendChild(el('circle', { cx: 682, cy: 334, r: 22, fill: dischOn ? '#FEF3C7' : '#FFFFFF', stroke: '#152232', 'stroke-width': 2 }));
    g.appendChild(txt('NPN', { x: 682, y: 338, 'text-anchor': 'middle', fill: '#152232', 'font-size': 9.5, 'font-weight': 800, 'font-family': 'ui-monospace, monospace' }));
    g.appendChild(el('line', { x1: 682, y1: 356, x2: 682, y2: 410, stroke: '#152232', 'stroke-width': 2 }));
    g.appendChild(txt('GND', { x: 682, y: 424, 'text-anchor': 'middle', fill: '#152232', 'font-size': 9.5, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));
    g.appendChild(el('line', { x1: 704, y1: 334, x2: 772, y2: 334, stroke: dischOn ? '#D97706' : '#64748B', 'stroke-width': 2.4 }));
    g.appendChild(txt('PIN 7 · ' + (dischOn ? 'SINK ON' : 'OPEN'), {
      x: 774, y: 323, 'text-anchor': 'end', fill: dischOn ? '#B45309' : '#475569', 'font-size': 10, 'font-weight': 800, 'font-family': 'ui-monospace, monospace'
    }));

    viewport.appendChild(g);
  }

  function renderSchematicView(viewport, step, params, simState) {
    var g = el('g', { id: 'schematic-view' });

    // Clean crisp architectural schematic card on cutting mat
    g.appendChild(el('rect', {
      x: 100, y: 74, width: 720, height: 412, rx: 10,
      fill: '#FBF8F1', stroke: '#152232', 'stroke-width': 2
    }));

    var vcc = Number(params.vcc) || 5;
    // +Vcc Rail (top) and GND Rail (bottom)
    g.appendChild(el('line', { x1: 150, y1: 118, x2: 770, y2: 118, stroke: '#DC2626', 'stroke-width': 2.5 }));
    g.appendChild(txt('+Vcc (' + vcc.toFixed(1) + ' V)', { x: 150, y: 108, fill: '#DC2626', 'font-size': 11, 'font-weight': 800, 'font-family': 'ui-monospace, monospace' }));

    g.appendChild(el('line', { x1: 150, y1: 440, x2: 770, y2: 440, stroke: '#152232', 'stroke-width': 2.5 }));
    g.appendChild(txt('GND (0 V)', { x: 150, y: 458, fill: '#152232', 'font-size': 11, 'font-weight': 800, 'font-family': 'ui-monospace, monospace' }));

    // Central 555 IC Symbol Box
    var bx = 370;
    var by = 185;
    var bw = 180;
    var bh = 180;
    g.appendChild(el('rect', {
      x: bx, y: by, width: bw, height: bh, rx: 6, fill: '#FFFFFF', stroke: '#152232', 'stroke-width': 2.4,
      class: 'interactive-part', 'data-part-id': 'ic-555',
      'data-hover-label': (params.icType || 'NE555') + ' Timer IC',
      style: 'cursor: pointer;'
    }));
    g.appendChild(txt(params.icType || 'NE555', { x: bx + bw / 2, y: by + 26, 'text-anchor': 'middle', fill: '#152232', 'font-size': 14, 'font-weight': 800, 'font-family': 'ui-monospace, monospace', style: 'pointer-events: none;' }));
    g.appendChild(txt(step.title.toUpperCase(), { x: bx + bw / 2, y: by + 42, 'text-anchor': 'middle', fill: '#64748B', 'font-size': 9, 'font-weight': 700, 'font-family': 'ui-monospace, monospace', style: 'pointer-events: none;' }));

    // Pin connections on box:
    // Top: Pin 8 (VCC) at x=425, Pin 4 (RESET) at x=495
    // Bottom: Pin 1 (GND) at x=425, Pin 5 (CTRL) at x=495
    // Left: Pin 7 (DISCH) y=225, Pin 6 (THRES) y=275, Pin 2 (TRIG) y=325
    // Right: Pin 3 (OUT) y=275
    var pinsMeta = [
      { pin: 8, x: 425, y: by, tx: 425, ty: by + 16, lbl: '8 VCC' },
      { pin: 4, x: 495, y: by, tx: 495, ty: by + 16, lbl: '4 RST' },
      { pin: 1, x: 425, y: by + bh, tx: 425, ty: by + bh - 8, lbl: '1 GND' },
      { pin: 5, x: 495, y: by + bh, tx: 495, ty: by + bh - 8, lbl: '5 CTL' },
      { pin: 7, x: bx, y: 225, tx: bx + 8, ty: 229, lbl: '7 DIS', anchor: 'start' },
      { pin: 6, x: bx, y: 275, tx: bx + 8, ty: 279, lbl: '6 THR', anchor: 'start' },
      { pin: 2, x: bx, y: 325, tx: bx + 8, ty: 329, lbl: '2 TRG', anchor: 'start' },
      { pin: 3, x: bx + bw, y: 275, tx: bx + bw - 8, ty: 279, lbl: '3 OUT', anchor: 'end' }
    ];
    for (var i = 0; i < pinsMeta.length; i++) {
      var pm = pinsMeta[i];
      g.appendChild(el('circle', {
        cx: pm.x, cy: pm.y, r: 5, fill: '#152232',
        class: 'ic-pin-hit', 'data-pin': pm.pin, 'data-hover-label': pm.lbl, style: 'cursor: pointer;'
      }));
      g.appendChild(txt(pm.lbl, {
        x: pm.tx, y: pm.ty,
        'text-anchor': pm.anchor || 'middle',
        fill: '#334155', 'font-size': 9.5, 'font-weight': 700, 'font-family': 'ui-monospace, monospace',
        style: 'pointer-events: none;'
      }));
    }

    // Standard Pin 8 -> Vcc, Pin 1 -> GND, Pin 5 -> 10nF -> GND
    g.appendChild(el('line', { x1: 425, y1: 118, x2: 425, y2: by, stroke: '#DC2626', 'stroke-width': 2 }));
    g.appendChild(el('line', { x1: 425, y1: by + bh, x2: 425, y2: 440, stroke: '#152232', 'stroke-width': 2 }));
    // Pin 5 cap 10nF
    g.appendChild(el('line', { x1: 495, y1: by + bh, x2: 495, y2: 396, stroke: '#7C48B5', 'stroke-width': 2 }));
    var cBypassG = el('g', {
      class: 'interactive-part', 'data-part-id': 'cap-ceramic',
      'data-hover-label': '10 nF Bypass Cap', style: 'cursor: pointer;'
    });
    cBypassG.appendChild(el('rect', { x: 480, y: 391, width: 32, height: 18, fill: 'transparent' }));
    cBypassG.appendChild(el('line', { x1: 483, y1: 396, x2: 507, y2: 396, stroke: '#152232', 'stroke-width': 2.5 }));
    cBypassG.appendChild(el('line', { x1: 483, y1: 404, x2: 507, y2: 404, stroke: '#152232', 'stroke-width': 2.5 }));
    g.appendChild(cBypassG);
    g.appendChild(el('line', { x1: 495, y1: 404, x2: 495, y2: 440, stroke: '#152232', 'stroke-width': 2 }));
    g.appendChild(txt('10 nF', { x: 514, y: 404, fill: '#475569', 'font-size': 9, 'font-family': 'ui-monospace, monospace' }));

    // Pin 4 RESET wiring (LDR divider on step 09, RST button on step 05, else tied to Vcc)
    if (step.mode === 'ldr') {
      g.appendChild(el('line', { x1: 495, y1: by, x2: 495, y2: 155, stroke: '#F59E0B', 'stroke-width': 2 }));
      g.appendChild(el('line', { x1: 495, y1: 155, x2: 590, y2: 155, stroke: '#F59E0B', 'stroke-width': 2 }));
      g.appendChild(el('rect', {
        x: 576, y: 122, width: 28, height: 22, rx: 4, fill: '#FEF3C7', stroke: '#B45309', 'stroke-width': 1.5,
        class: 'interactive-part', 'data-part-id': 'ldr', 'data-hover-label': 'GL5528 LDR Photoresistor', style: 'cursor: pointer;'
      }));
      g.appendChild(txt('LDR', { x: 590, y: 136, 'text-anchor': 'middle', fill: '#92400E', 'font-size': 9, 'font-weight': 700, 'font-family': 'ui-monospace, monospace', style: 'pointer-events: none;' }));
      g.appendChild(el('line', { x1: 590, y1: 118, x2: 590, y2: 122, stroke: '#DC2626', 'stroke-width': 2 }));
      g.appendChild(el('line', { x1: 590, y1: 144, x2: 590, y2: 185, stroke: '#7C48B5', 'stroke-width': 2 }));
      g.appendChild(el('rect', {
        x: 580, y: 185, width: 20, height: 34, fill: '#E5CFA7', stroke: '#152232', 'stroke-width': 1.5,
        class: 'interactive-part', 'data-part-id': 'resistors',
        'data-hover-label': 'Rpull ' + root.Math555.formatResistance(params.rPull || 22000), style: 'cursor: pointer;'
      }));
      g.appendChild(txt(root.Math555.formatResistance(params.rPull || 22000), { x: 606, y: 205, fill: '#152232', 'font-size': 9, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));
      g.appendChild(el('line', { x1: 590, y1: 219, x2: 590, y2: 440, stroke: '#152232', 'stroke-width': 1.8 }));
    } else if (step.mode === 'bistable') {
      g.appendChild(el('line', { x1: 495, y1: 118, x2: 495, y2: by, stroke: '#2667C9', 'stroke-width': 2 }));
      g.appendChild(txt('10k + RST SW', { x: 505, y: 152, fill: '#2667C9', 'font-size': 9, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));
    } else {
      g.appendChild(el('line', { x1: 495, y1: 118, x2: 495, y2: by, stroke: '#DC2626', 'stroke-width': 2 }));
    }

    // Left Timing Network depending on mode
    var busX = 270;
    if (step.mode === 'fifty') {
      g.appendChild(el('line', { x1: bx, y1: 275, x2: busX, y2: 275, stroke: '#E87722', 'stroke-width': 2 }));
      g.appendChild(el('line', { x1: bx, y1: 325, x2: busX, y2: 325, stroke: '#E87722', 'stroke-width': 2 }));
      g.appendChild(el('line', { x1: busX, y1: 275, x2: busX, y2: 350, stroke: '#E87722', 'stroke-width': 2 }));
      g.appendChild(el('path', {
        d: 'M 590 275 L 590 154 L 270 154 L 270 205',
        fill: 'none', stroke: '#D4A838', 'stroke-width': 2.2
      }));
      g.appendChild(el('rect', {
        x: 258, y: 205, width: 24, height: 48, fill: '#E5CFA7', stroke: '#152232', 'stroke-width': 1.8,
        class: 'interactive-part', 'data-part-id': 'resistors',
        'data-hover-label': 'R2 ' + root.Math555.formatResistance(params.r2), style: 'cursor: pointer;'
      }));
      g.appendChild(txt('R2 ' + root.Math555.formatResistance(params.r2), { x: 250, y: 232, 'text-anchor': 'end', fill: '#152232', 'font-size': 9.5, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));
      g.appendChild(el('line', { x1: busX, y1: 253, x2: busX, y2: 275, stroke: '#D4A838', 'stroke-width': 2 }));
    } else if (step.mode === 'bistable') {
      g.appendChild(el('line', { x1: bx, y1: 275, x2: busX, y2: 275, stroke: '#152232', 'stroke-width': 2 }));
      g.appendChild(el('line', { x1: busX, y1: 275, x2: busX, y2: 440, stroke: '#152232', 'stroke-width': 2 }));
      g.appendChild(el('line', { x1: bx, y1: 325, x2: 200, y2: 325, stroke: '#E87722', 'stroke-width': 2 }));
      g.appendChild(txt('SET SW → GND', { x: 200, y: 318, fill: '#E87722', 'font-size': 9.5, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));
    } else if (step.mode === 'monostable') {
      g.appendChild(el('line', { x1: busX, y1: 118, x2: busX, y2: 160, stroke: '#DC2626', 'stroke-width': 2 }));
      g.appendChild(el('rect', {
        x: busX - 11, y: 160, width: 22, height: 45, fill: '#E5CFA7', stroke: '#152232', 'stroke-width': 1.6,
        class: 'interactive-part', 'data-part-id': 'resistors',
        'data-hover-label': 'R1 ' + root.Math555.formatResistance(params.r1), style: 'cursor: pointer;'
      }));
      g.appendChild(txt('R1 ' + root.Math555.formatResistance(params.r1), { x: busX - 16, y: 186, 'text-anchor': 'end', fill: '#152232', 'font-size': 9.5, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));
      g.appendChild(el('line', { x1: busX, y1: 205, x2: busX, y2: 350, stroke: '#2667C9', 'stroke-width': 2 }));
      g.appendChild(el('line', { x1: busX, y1: 225, x2: bx, y2: 225, stroke: '#D4A838', 'stroke-width': 2 }));
      g.appendChild(el('line', { x1: busX, y1: 275, x2: bx, y2: 275, stroke: '#2667C9', 'stroke-width': 2 }));
      g.appendChild(el('line', { x1: bx, y1: 325, x2: 185, y2: 325, stroke: '#E87722', 'stroke-width': 2 }));
      g.appendChild(el('rect', {
        x: 165, y: 312, width: 52, height: 24, rx: 4, fill: '#F4B936', stroke: '#152232', 'stroke-width': 1.5,
        class: 'interactive-part', 'data-part-id': 'button', 'data-hover-label': 'Trigger Pushbutton', style: 'cursor: pointer;'
      }));
      g.appendChild(txt('TRIG', { x: 191, y: 328, 'text-anchor': 'middle', fill: '#152232', 'font-size': 9.5, 'font-weight': 800, 'font-family': 'ui-monospace, monospace', style: 'pointer-events: none;' }));
    } else {
      g.appendChild(el('line', { x1: busX, y1: 118, x2: busX, y2: 145, stroke: '#DC2626', 'stroke-width': 2 }));
      g.appendChild(el('rect', {
        x: busX - 10, y: 145, width: 20, height: 42, fill: '#E5CFA7', stroke: '#152232', 'stroke-width': 1.6,
        class: 'interactive-part', 'data-part-id': 'resistors',
        'data-hover-label': 'R1 ' + root.Math555.formatResistance(params.r1), style: 'cursor: pointer;'
      }));
      g.appendChild(txt('R1 ' + root.Math555.formatResistance(params.r1), { x: busX - 15, y: 170, 'text-anchor': 'end', fill: '#152232', 'font-size': 9.5, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));
      g.appendChild(el('line', { x1: busX, y1: 187, x2: busX, y2: 225, stroke: '#E87722', 'stroke-width': 2 }));
      g.appendChild(el('line', { x1: busX, y1: 225, x2: bx, y2: 225, stroke: '#D4A838', 'stroke-width': 2 }));
      g.appendChild(el('rect', {
        x: busX - 10, y: 238, width: 20, height: 42, fill: '#E5CFA7', stroke: '#152232', 'stroke-width': 1.6,
        class: 'interactive-part', 'data-part-id': step.mode === 'pwm' ? 'pot' : 'resistors',
        'data-hover-label': step.mode === 'pwm' ? '50 kΩ Potentiometer' : ('R2 ' + root.Math555.formatResistance(params.r2)),
        style: 'cursor: pointer;'
      }));
      g.appendChild(txt(step.mode === 'pwm' ? 'POT 50k + D1/D2' : 'R2 ' + root.Math555.formatResistance(params.r2), {
        x: busX - 15, y: 263, 'text-anchor': 'end', fill: '#152232', 'font-size': 9.5, 'font-weight': 700, 'font-family': 'ui-monospace, monospace'
      }));
      g.appendChild(el('line', { x1: busX, y1: 225, x2: busX, y2: 238, stroke: '#E87722', 'stroke-width': 2 }));
      g.appendChild(el('line', { x1: busX, y1: 280, x2: busX, y2: 350, stroke: '#2667C9', 'stroke-width': 2 }));
      g.appendChild(el('line', { x1: busX, y1: 275, x2: bx, y2: 275, stroke: '#2667C9', 'stroke-width': 2 }));
      g.appendChild(el('line', { x1: busX, y1: 325, x2: bx, y2: 325, stroke: '#E87722', 'stroke-width': 2 }));
    }

    // Timing capacitor C1 (except bistable)
    if (step.mode !== 'bistable') {
      var c1G = el('g', {
        class: 'interactive-part', 'data-part-id': 'cap-elec',
        'data-hover-label': 'C1 ' + root.Math555.formatCapacitance(params.c1),
        style: 'cursor: pointer;'
      });
      c1G.appendChild(el('rect', { x: busX - 18, y: 350, width: 36, height: 22, fill: 'transparent' }));
      c1G.appendChild(el('line', { x1: busX - 16, y1: 355, x2: busX + 16, y2: 355, stroke: '#152232', 'stroke-width': 2.8 }));
      c1G.appendChild(el('line', { x1: busX - 16, y1: 365, x2: busX + 16, y2: 365, stroke: '#152232', 'stroke-width': 2.8 }));
      g.appendChild(c1G);
      g.appendChild(el('line', { x1: busX, y1: 365, x2: busX, y2: 440, stroke: '#152232', 'stroke-width': 2 }));
      g.appendChild(txt('C1 ' + root.Math555.formatCapacitance(params.c1), {
        x: busX - 20, y: 364, 'text-anchor': 'end', fill: '#2667C9', 'font-size': 9.5, 'font-weight': 700, 'font-family': 'ui-monospace, monospace'
      }));
      g.appendChild(txt('Vc', { x: busX + 20, y: 356, fill: '#B45309', 'font-size': 9, 'font-weight': 700, 'font-family': 'ui-monospace, monospace', class: 'live-schem-vc' }));
    }

    // Output Load (Pin 3 -> R -> LED/Buzzer -> GND)
    g.appendChild(el('line', { x1: bx + bw, y1: 275, x2: 635, y2: 275, stroke: '#2B8A57', 'stroke-width': 2.4, class: 'live-schem-out-wire' }));
    g.appendChild(el('rect', {
      x: 635, y: 265, width: 44, height: 20, fill: '#E5CFA7', stroke: '#152232', 'stroke-width': 1.6,
      class: 'interactive-part', 'data-part-id': 'resistors',
      'data-hover-label': step.mode === 'audio' ? '100 Ω Series Resistor' : '220 Ω LED Resistor',
      style: 'cursor: pointer;'
    }));
    g.appendChild(txt(step.mode === 'audio' ? '100 Ω' : '220 Ω', { x: 657, y: 258, 'text-anchor': 'middle', fill: '#152232', 'font-size': 9, 'font-weight': 700, 'font-family': 'ui-monospace, monospace' }));
    g.appendChild(el('line', { x1: 679, y1: 275, x2: 710, y2: 275, stroke: '#2B8A57', 'stroke-width': 2 }));
    g.appendChild(el('line', { x1: 710, y1: 275, x2: 710, y2: 330, stroke: '#2B8A57', 'stroke-width': 2 }));
    g.appendChild(el('circle', {
      cx: 710, cy: 350, r: 16,
      fill: simState.outputHigh ? '#10B981' : '#E2E8F0',
      stroke: '#152232', 'stroke-width': 2,
      class: 'live-schem-load interactive-part',
      'data-part-id': step.mode === 'audio' ? 'buzzer' : 'leds',
      'data-hover-label': step.mode === 'audio' ? '5 V Piezo Buzzer' : '5 mm Output LED',
      style: 'cursor: pointer;'
    }));
    g.appendChild(txt(step.mode === 'audio' ? 'SPK' : 'LED', { x: 710, y: 354, 'text-anchor': 'middle', fill: '#152232', 'font-size': 9.5, 'font-weight': 800, 'font-family': 'ui-monospace, monospace', style: 'pointer-events: none;' }));
    g.appendChild(el('line', { x1: 710, y1: 366, x2: 710, y2: 440, stroke: '#152232', 'stroke-width': 2 }));

    if (step.mode === 'dual_flasher') {
      g.appendChild(el('line', { x1: 615, y1: 118, x2: 615, y2: 185, stroke: '#DC2626', 'stroke-width': 2 }));
      g.appendChild(el('circle', {
        cx: 615, cy: 205, r: 14, fill: !simState.outputHigh ? '#3B82F6' : '#E2E8F0', stroke: '#152232', 'stroke-width': 2,
        class: 'live-schem-sink-load interactive-part', 'data-part-id': 'leds', 'data-hover-label': 'Sink Blue LED', style: 'cursor: pointer;'
      }));
      g.appendChild(txt('BLU', { x: 615, y: 209, 'text-anchor': 'middle', fill: '#152232', 'font-size': 8.5, 'font-weight': 800, 'font-family': 'ui-monospace, monospace', style: 'pointer-events: none;' }));
      g.appendChild(el('line', { x1: 615, y1: 219, x2: 615, y2: 275, stroke: '#3B82F6', 'stroke-width': 2 }));
    }

    g.appendChild(txt('OUT: ' + (simState.outputHigh ? 'HIGH' : 'LOW'), {
      x: 710, y: 318, 'text-anchor': 'middle', fill: '#152232',
      'font-size': 9.5, 'font-weight': 800, 'font-family': 'ui-monospace, monospace', class: 'live-schem-out-lbl'
    }));

    viewport.appendChild(g);
  }

  function renderWorkbench(host, state, step, simState, options) {
    if (!host) return;
    host.innerHTML = '';

    var svg = el('svg', {
      viewBox: '0 0 920 560',
      class: 'workbench-svg',
      role: 'img',
      'aria-label': step.title + ' interactive wiring diagram'
    });

    var viewport = buildCuttingMatBase(svg);

    if (step.mode === 'pinout') {
      renderPinoutHero(viewport, state);
    } else if (step.mode === 'block') {
      renderInternalBlockDiagram(viewport, state.params, simState, state.lang);
    } else if (state.viewMode === 'schematic') {
      renderSchematicView(viewport, step, state.params, simState);
    } else {
      renderBreadboardBase(viewport);
      renderDip555OnBreadboard(viewport, state.icType, state.showXray);

      var wiresLayer = el('g', { id: 'wires-layer' });
      var compsLayer = el('g', { id: 'components-layer' });

      // Main wires defined on step
      var wires = step.wires || [];
      for (var w = 0; w < wires.length; w++) {
        var wire = wires[w];
        if (wire.from && wire.to) {
          renderWire(wiresLayer, wire.from, wire.to, wire.color, wire.id);
        }
      }

      // Secondary routing wires
      var extras = step.extraWires || [];
      for (var e = 0; e < extras.length; e++) {
        renderWire(wiresLayer, extras[e].from, extras[e].to, extras[e].color, extras[e].parentWire || '');
      }

      // Electronic components
      var comps = step.components || [];
      for (var c = 0; c < comps.length; c++) {
        var comp = comps[c];
        // Find matching wire row id
        var matchedWireId = '';
        for (var k = 0; k < wires.length; k++) {
          if (wires[k].component === comp.id) {
            matchedWireId = wires[k].id;
            break;
          }
        }
        renderComponentOnBreadboard(compsLayer, comp, state.params, matchedWireId);
      }

      viewport.appendChild(wiresLayer);
      viewport.appendChild(compsLayer);
    }

    if (options && options.animate) {
      var seq = [];
      var icNode = svg.querySelector('#bb-555-ic');
      if (icNode) seq.push(icNode);
      var compNodes = svg.querySelectorAll('.bb-component, .mat-part-card, .pin-callout');
      for (var ci = 0; ci < compNodes.length; ci++) seq.push(compNodes[ci]);
      var wireNodes = svg.querySelectorAll('.bb-wire');
      for (var wi = 0; wi < wireNodes.length; wi++) seq.push(wireNodes[wi]);
      for (var si = 0; si < seq.length; si++) {
        seq[si].classList.add('svg-mount-anim');
        seq[si].style.animationDelay = (si * 55) + 'ms';
      }
    }

    host.appendChild(svg);
    applyViewportTransform(host, state.zoom, state.panX, state.panY);
    applyHighlight(host, state.highlightedWireId);
    updateLiveVisuals(host, simState, state.params);
  }

  function applyViewportTransform(host, zoom, panX, panY) {
    var vp = host && host.querySelector('#wb-viewport');
    if (!vp) return;
    var cx = 460;
    var cy = 280;
    var z = zoom || 1;
    var x = panX || 0;
    var y = panY || 0;
    vp.setAttribute('transform', 'translate(' + (cx + x) + ',' + (cy + y) + ') scale(' + z + ') translate(' + (-cx) + ',' + (-cy) + ')');
  }

  function applyHighlight(host, wireId) {
    if (!host) return;
    var nodes = host.querySelectorAll('[data-wire-id]');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var wid = n.getAttribute('data-wire-id');
      if (!wireId) {
        n.style.opacity = '';
        n.removeAttribute('filter');
      } else if (wid === wireId) {
        n.style.opacity = '1';
        n.setAttribute('filter', 'url(#glow-yellow)');
      } else {
        n.style.opacity = '0.32';
        n.removeAttribute('filter');
      }
    }
  }

  function updateLiveVisuals(host, simState, params) {
    if (!host || !simState) return;
    var vcc = Number(params.vcc) || 5;
    var voh = root.Math555.getOutputHighVoltage(vcc, params.icType);

    // Breadboard LEDs
    var lenses = host.querySelectorAll('.live-led-lens');
    var halos = host.querySelectorAll('.live-led-halo');
    for (var i = 0; i < lenses.length; i++) {
      var isSink = lenses[i].getAttribute('data-sink') === '1';
      var lit = isSink ? !simState.outputHigh : simState.outputHigh;
      lenses[i].style.opacity = lit ? '1' : '0.28';
      if (halos[i]) {
        halos[i].style.opacity = lit ? '0.45' : '0.03';
      }
    }

    // Buzzer acoustic ring
    var wave = host.querySelector('.live-buzzer-wave');
    if (wave) {
      wave.style.opacity = simState.outputHigh ? '0.85' : '0.12';
    }

    // Potentiometer rotation
    var needle = host.querySelector('.live-pot-needle');
    if (needle) {
      var rot = -135 + (Number(params.potRatio || 0.5) * 270);
      var px = needle.getAttribute('x1');
      var py = needle.getAttribute('y1');
      needle.setAttribute('transform', 'rotate(' + rot + ' ' + px + ' ' + py + ')');
    }

    // Schematic live nodes
    var schemVc = host.querySelector('.live-schem-vc');
    if (schemVc) {
      schemVc.textContent = 'Vc: ' + simState.vc.toFixed(2) + 'V';
    }
    var schemOutLbl = host.querySelector('.live-schem-out-lbl');
    if (schemOutLbl) {
      schemOutLbl.textContent = 'OUT: ' + (simState.outputHigh ? voh.toFixed(1) + 'V HIGH' : '0.1V LOW');
    }
    var schemLoad = host.querySelector('.live-schem-load');
    if (schemLoad) {
      schemLoad.setAttribute('fill', simState.outputHigh ? '#10B981' : '#E2E8F0');
    }
    var schemSink = host.querySelector('.live-schem-sink-load');
    if (schemSink) {
      schemSink.setAttribute('fill', !simState.outputHigh ? '#3B82F6' : '#E2E8F0');
    }
  }

  function renderThumbnailSvg(step) {
    var color = step.mode === 'pinout' ? '#F4B936' : step.mode === 'block' ? '#2667C9' : '#1E524E';
    return '<svg viewBox="0 0 64 42" width="54" height="36" aria-hidden="true">' +
      '<rect x="2" y="2" width="60" height="38" rx="4" fill="' + color + '" stroke="#143634" stroke-width="1.5"/>' +
      '<rect x="10" y="9" width="44" height="24" rx="2" fill="#F7F4EC"/>' +
      '<rect x="24" y="15" width="16" height="12" rx="1.5" fill="#1E252E"/>' +
      '<circle cx="48" cy="21" r="3" fill="' + (step.mode === 'dual_flasher' ? '#3B82F6' : '#EF4444') + '"/>' +
      '<path d="M14 21 H24 M40 21 H45" stroke="#E87722" stroke-width="1.8"/>' +
      '</svg>';
  }

  root.Workbench555 = {
    renderWorkbench: renderWorkbench,
    applyViewportTransform: applyViewportTransform,
    applyHighlight: applyHighlight,
    updateLiveVisuals: updateLiveVisuals,
    renderThumbnailSvg: renderThumbnailSvg
  };
}(typeof self !== 'undefined' ? self : this));
