(function (root) {
  'use strict';

  var Math555 = root.Math555;
  var Circuits555 = root.Circuits555;
  var Workbench555 = root.Workbench555;
  var Workbench3D555 = root.Workbench3D555;
  var Scope555 = root.Scope555;
  var Audio555 = root.Audio555;
  var I18n555 = root.I18n555;

  var STORAGE_KEY = '555kit_progress_v1';
  var LANG_KEY = '555kit_lang_v1';
  var THEME_KEY = '555kit_theme_v1';
  var SPEEDS = [0.5, 1, 2];

  var state = {
    stepIndex: 0,
    viewMode: '3d', // '3d' | 'schematic'
    icType: 'NE555', // 'NE555' | 'TLC555'
    lang: loadLang(), // 'en' | 'es'
    theme: loadTheme(), // 'light' | 'dark'
    paused: false,
    speedIdx: 1,
    zoom: 1,
    panX: 0,
    panY: 0,
    exploded: false,
    highlightedWireId: null,
    selectedPartId: null,
    checkedItems: loadCheckedItems(),
    params: {}
  };

  var simState = Math555.createSimState(5);
  var lastTick = performance.now();
  var scopeCanvas = null;
  var wb3d = null;
  var wb3dUnavailable = false;
  var sliderRebuildTimer = 0;
  var lastFocusedEl = null;
  var pendingAssemblyAnim = false;

  function loadLang() {
    try {
      var saved = localStorage.getItem(LANG_KEY);
      if (saved === 'en' || saved === 'es') return saved;
    } catch (e) {
      // ignore
    }
    var navLang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language.toLowerCase() : '';
    return navLang.indexOf('es') === 0 ? 'es' : 'en';
  }

  function saveLang() {
    try {
      localStorage.setItem(LANG_KEY, state.lang);
    } catch (e) {
      // ignore
    }
  }

  function loadTheme() {
    try {
      var saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
      // ignore
    }
    return 'light';
  }

  function saveTheme() {
    try {
      localStorage.setItem(THEME_KEY, state.theme);
    } catch (e) {
      // ignore
    }
  }

  function applyTheme() {
    var isDark = state.theme === 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    var btn = document.getElementById('btn-theme-toggle');
    var iMoon = document.getElementById('icon-moon');
    var iSun = document.getElementById('icon-sun');
    if (iMoon) iMoon.classList.toggle('hidden', isDark);
    if (iSun) iSun.classList.toggle('hidden', !isDark);
    if (btn) {
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      var lbl = isDark ? t('themeToLight') : t('themeToDark');
      btn.title = lbl;
      btn.setAttribute('aria-label', lbl);
    }
    if (wb3d && wb3d.setTheme) {
      wb3d.setTheme(state.theme);
    }
  }

  function stepHasBuzzer(step) {
    return Boolean(step && step.components && step.components.some(function (c) { return c.kind === 'buzzer'; }));
  }

  function t(key) {
    return I18n555 ? I18n555.t(key, state.lang) : key;
  }

  function loadCheckedItems() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCheckedItems() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.checkedItems));
    } catch (e) {
      // ignore storage quota errors
    }
  }

  function rawStepAt(idx) {
    return Circuits555.STEPS[idx] || Circuits555.STEPS[0];
  }

  function getLocalizedStep(idx) {
    var base = rawStepAt(idx !== undefined ? idx : state.stepIndex);
    return I18n555 ? I18n555.getStep(base, state.lang) : base;
  }

  function currentStep() {
    return getLocalizedStep(state.stepIndex);
  }

  function getLocalizedPin(pinNum) {
    var base = Circuits555.PINS[pinNum - 1];
    if (!base) return null;
    return I18n555 ? I18n555.getPin(base, state.lang) : base;
  }

  function cloneDefaults(step) {
    var out = {};
    var defs = step.defaults || {};
    for (var k in defs) {
      if (Object.prototype.hasOwnProperty.call(defs, k)) {
        out[k] = defs[k];
      }
    }
    out.mode = step.mode;
    out.hasBuzzer = stepHasBuzzer(step);
    out.icType = state.icType;
    out.speed = SPEEDS[state.speedIdx];
    out.paused = state.paused;
    return out;
  }

  function syncAudioButtonState(step) {
    var btnAudio = document.getElementById('btn-audio-toggle');
    var hasBuzzer = stepHasBuzzer(step);
    if (!hasBuzzer) {
      if (Audio555.isEnabled()) Audio555.setEnabled(false);
      Audio555.updateTone(state.params, simState);
    }
    if (!btnAudio) return;
    var active = hasBuzzer && Audio555.isEnabled();
    btnAudio.disabled = !hasBuzzer;
    btnAudio.setAttribute('aria-pressed', active ? 'true' : 'false');
    btnAudio.classList.toggle('active', active);
    var label = hasBuzzer ? t('hudAudioToggle') : t('hudAudioDisabled');
    btnAudio.title = label;
    btnAudio.setAttribute('aria-label', label);
    btnAudio.innerHTML = active
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>';
  }

  function showToast(message) {
    var region = document.getElementById('toast-region');
    if (!region) return;
    var item = document.createElement('div');
    item.className = 'toast-item';
    item.textContent = message;
    region.appendChild(item);
    setTimeout(function () {
      item.classList.add('toast-leave');
      setTimeout(function () {
        if (item.parentNode) item.parentNode.removeChild(item);
      }, 240);
    }, 2600);
  }

  function setStep(idx, updateHash) {
    var clamped = Math.max(0, Math.min(Circuits555.STEPS.length - 1, idx));
    state.stepIndex = clamped;
    pendingAssemblyAnim = true;
    var step = currentStep();
    state.params = cloneDefaults(step);
    state.highlightedWireId = null;
    state.selectedPartId = null;
    closePartModal(true);
    simState = Math555.createSimState(state.params.vcc);
    if (step.mode === 'monostable') {
      simState.outputHigh = false;
      simState.dischargeOn = true;
      simState.vc = 0;
    }

    if (updateHash !== false && root.location && root.location.protocol !== 'file:') {
      try {
        history.replaceState(null, '', '#' + step.id);
      } catch (e) {
        root.location.hash = step.id;
      }
    }

    var jumpBtns = document.querySelectorAll('[data-jump-step]');
    for (var ji = 0; ji < jumpBtns.length; ji++) {
      var targetStep = Number(jumpBtns[ji].getAttribute('data-jump-step'));
      var isCur = (targetStep === 5) ? (clamped >= 5) : (targetStep === clamped);
      jumpBtns[ji].classList.toggle('active', isCur);
    }

    syncAudioButtonState(step);
    renderAll();
  }

  function applyStaticTranslations() {
    document.documentElement.lang = state.lang;
    var navMap = { '0': 'navPinout', '1': 'navInside', '2': 'navAstable', '3': 'navMonostable', '5': 'navApps' };
    var navBtns = document.querySelectorAll('[data-jump-step]');
    for (var i = 0; i < navBtns.length; i++) {
      var k = navMap[navBtns[i].getAttribute('data-jump-step')];
      if (k) navBtns[i].textContent = t(k);
    }
    var langBtn = document.getElementById('btn-lang-toggle');
    if (langBtn) {
      langBtn.textContent = state.lang === 'es' ? 'EN' : 'ES';
      langBtn.setAttribute('aria-pressed', state.lang === 'es' ? 'true' : 'false');
    }
    var saveBtn = document.getElementById('btn-download-offline');
    if (saveBtn) saveBtn.title = t('saveOfflineTitle');
    var saveLbl = document.getElementById('btn-download-offline-label');
    if (saveLbl) saveLbl.textContent = t('saveOffline');
    var wbTitle = document.getElementById('workbench-title');
    if (wbTitle) wbTitle.textContent = t('workbench');
    var btn3d = document.getElementById('btn-view-3d');
    if (btn3d) btn3d.textContent = t('view3d');
    var btnSch = document.getElementById('btn-view-schematic');
    if (btnSch) btnSch.textContent = t('viewSchematic');
    var btnBack = document.getElementById('btn-step-back');
    if (btnBack) btnBack.textContent = t('backBtn');
    var kbText = document.getElementById('keyboard-hint-text');
    if (kbText) kbText.textContent = t('stepsHint');
    var closeBtn = document.getElementById('btn-modal-close');
    if (closeBtn) closeBtn.setAttribute('aria-label', t('modalClose'));
    var hudMap = {
      'btn-zoom-in': 'hudZoomIn',
      'btn-zoom-out': 'hudZoomOut',
      'btn-zoom-reset': 'hudReset',
      'btn-explode-toggle': 'hudExplode'
    };
    for (var id in hudMap) {
      if (Object.prototype.hasOwnProperty.call(hudMap, id)) {
        var el = document.getElementById(id);
        if (el) {
          el.title = t(hudMap[id]);
          el.setAttribute('aria-label', t(hudMap[id]));
        }
      }
    }
    applyTheme();
    syncAudioButtonState(currentStep());
  }

  function renderStepStrip() {
    var strip = document.getElementById('step-strip');
    if (!strip) return;
    strip.innerHTML = '';

    for (var i = 0; i < Circuits555.STEPS.length; i++) {
      (function (idx) {
        var s = getLocalizedStep(idx);
        var li = document.createElement('li');
        li.className = 'step-strip-item';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'step-thumb-btn' + (idx === state.stepIndex ? ' active' : '');
        btn.setAttribute('aria-current', idx === state.stepIndex ? 'step' : 'false');
        btn.setAttribute('aria-label', s.num + ' ' + s.shortTitle);
        btn.innerHTML =
          '<span class="thumb-preview">' + Workbench555.renderThumbnailSvg(s) + '</span>' +
          '<span class="thumb-meta">' +
          '<span class="thumb-num">' + s.num + '</span>' +
          '<span class="thumb-name">' + s.shortTitle + '</span>' +
          '</span>';

        btn.addEventListener('click', function () {
          setStep(idx);
        });

        li.appendChild(btn);
        strip.appendChild(li);
      })(i);
    }

    // Keep active item scrolled into view smoothly
    var activeBtn = strip.querySelector('.step-thumb-btn.active');
    if (activeBtn && activeBtn.scrollIntoView) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function formatControlValue(ctrl, val) {
    if (ctrl.format === 'R') return Math555.formatResistance(val);
    if (ctrl.format === 'C') return Math555.formatCapacitance(val);
    if (ctrl.format === 'PCT') return Math.round(Number(val) * 100) + '%';
    if (ctrl.format === 'LIGHT') return Math.round(Number(val)) + '% lux';
    return Number(val).toFixed(1) + ' ' + (ctrl.unit || '');
  }

  function computeMetrics(step) {
    var p = state.params;
    if (step.mode === 'monostable') {
      var mono = Math555.calcMonostable(p.r1, p.c1);
      return [
        { label: 'Pulse Width', value: Math555.formatTime(mono.pulseWidth) },
        { label: 'Formula', value: '1.1 × R1 × C1' },
        { label: 'Threshold', value: ((2 / 3) * (p.vcc || 5)).toFixed(2) + ' V' },
        { label: 'State', value: simState.outputHigh ? 'HIGH' : 'IDLE' }
      ];
    }
    if (step.mode === 'bistable') {
      return [
        { label: 'Latch Output', value: simState.outputHigh ? 'HIGH (SET)' : 'LOW (RESET)' },
        { label: 'Pin 3 Voltage', value: simState.outputHigh ? Math555.getOutputHighVoltage(p.vcc, state.icType).toFixed(1) + ' V' : '0.1 V' },
        { label: 'Mode', value: 'SR Flip-Flop' },
        { label: 'Capacitor', value: 'None' }
      ];
    }
    if (step.mode === 'pwm') {
      var pwm = Math555.calcPwmDimmer(p.r1, p.r2, p.potRatio, p.c1);
      return [
        { label: 'Duty Cycle', value: pwm.duty.toFixed(1) + '%' },
        { label: 'Frequency', value: Math555.formatFrequency(pwm.freq) },
        { label: 'T High', value: Math555.formatTime(pwm.tHigh) },
        { label: 'T Low', value: Math555.formatTime(pwm.tLow) }
      ];
    }
    if (step.mode === 'fifty') {
      var fifty = Math555.calcFiftyPercentAstable(p.r2, p.c1);
      return [
        { label: 'Frequency', value: Math555.formatFrequency(fifty.freq) },
        { label: 'Duty Cycle', value: '50.0%' },
        { label: 'Period', value: Math555.formatTime(fifty.period) },
        { label: 'Half Cycle', value: Math555.formatTime(fifty.tHigh) }
      ];
    }
    if (step.mode === 'ldr') {
      var ldr = Math555.calcLdrDetector(p.lightPercent, p.rPull, 0.45);
      var astL = Math555.calcAstable(p.r1, p.r2, p.c1);
      return [
        { label: 'Alarm Status', value: ldr.alarmActive ? 'ACTIVE' : 'STANDBY' },
        { label: 'LDR Ohms', value: Math555.formatResistance(ldr.rLdr) },
        { label: 'Pin 4 Ratio', value: (ldr.nodeRatio * 100).toFixed(0) + '% Vcc' },
        { label: 'Pulse Rate', value: Math555.formatFrequency(astL.freq) }
      ];
    }
    var ast = Math555.calcAstable(p.r1, p.r2, p.c1);
    return [
      { label: 'Frequency', value: Math555.formatFrequency(ast.freq) },
      { label: 'Duty Cycle', value: ast.duty.toFixed(1) + '%' },
      { label: 'T High', value: Math555.formatTime(ast.tHigh) },
      { label: 'T Low', value: Math555.formatTime(ast.tLow) }
    ];
  }

  function renderMetricsBlock(container, step) {
    if (!container) return;
    var grid = container.querySelector('.metrics-grid');
    if (!grid) return;
    var items = computeMetrics(step);
    grid.innerHTML = '';
    for (var i = 0; i < items.length; i++) {
      var lbl = I18n555 ? I18n555.translateMetric(items[i].label, state.lang) : items[i].label;
      var val = I18n555 ? I18n555.translateMetric(items[i].value, state.lang) : items[i].value;
      var cell = document.createElement('div');
      cell.className = 'metric-cell';
      cell.innerHTML =
        '<span class="metric-label">' + lbl + '</span>' +
        '<span class="metric-value">' + val + '</span>';
      grid.appendChild(cell);
    }
  }

  function openPartModal(partId) {
    if (!partId || !I18n555) return;
    var info = I18n555.getPartDetail(partId, state.lang);
    if (!info) return;

    var backdrop = document.getElementById('part-modal-backdrop');
    if (!backdrop) return;

    state.selectedPartId = partId;
    var kickerEl = document.getElementById('part-modal-kicker');
    var titleEl = document.getElementById('part-modal-title');
    var badgeEl = document.getElementById('part-modal-badge');
    var sumEl = document.getElementById('part-modal-summary');
    var specsEl = document.getElementById('part-modal-specs');
    var closeBtn = document.getElementById('btn-modal-close');

    if (kickerEl) kickerEl.textContent = t('selectedPartKicker');
    if (titleEl) titleEl.textContent = info.title;
    if (badgeEl) badgeEl.textContent = info.badge;
    if (sumEl) sumEl.textContent = info.summary;
    if (specsEl) {
      specsEl.innerHTML =
        '<div class="part-spec-row"><dt class="part-spec-label">' + t('specPackage') + '</dt><dd class="part-spec-value">' + info.package + '</dd></div>' +
        '<div class="part-spec-row"><dt class="part-spec-label">' + t('specRatings') + '</dt><dd class="part-spec-value">' + info.ratings + '</dd></div>' +
        '<div class="part-spec-row"><dt class="part-spec-label">' + t('specPolarity') + '</dt><dd class="part-spec-value">' + info.polarity + '</dd></div>' +
        '<div class="part-spec-row"><dt class="part-spec-label">' + t('specRole') + '</dt><dd class="part-spec-value">' + info.role + '</dd></div>';
    }

    var bomBtns = document.querySelectorAll('.bom-select-btn');
    for (var i = 0; i < bomBtns.length; i++) {
      var row = bomBtns[i].closest('.bom-row');
      if (row) {
        row.classList.toggle('selected', bomBtns[i].getAttribute('data-part-id') === partId);
      }
    }

    var wireId = 'part-' + partId;
    var host = document.getElementById('workbench-svg-host');
    if (currentStep().mode === 'pinout') {
      state.highlightedWireId = wireId;
      Workbench555.applyHighlight(host, wireId);
      if (wb3d && state.viewMode === '3d') {
        wb3d.applyHighlight(wireId);
      }
    }

    lastFocusedEl = document.activeElement;
    backdrop.classList.remove('hidden');
    if (closeBtn) closeBtn.focus();
  }

  function closePartModal(skipFocusRestore) {
    var backdrop = document.getElementById('part-modal-backdrop');
    if (!backdrop || backdrop.classList.contains('hidden')) {
      state.selectedPartId = null;
      return;
    }
    backdrop.classList.add('hidden');
    state.selectedPartId = null;

    var selectedRows = document.querySelectorAll('.bom-row.selected');
    for (var i = 0; i < selectedRows.length; i++) {
      selectedRows[i].classList.remove('selected');
    }

    if (state.highlightedWireId && state.highlightedWireId.indexOf('part-') === 0) {
      highlightWire(null, null);
    }

    if (!skipFocusRestore && lastFocusedEl && typeof lastFocusedEl.focus === 'function' && document.contains(lastFocusedEl)) {
      lastFocusedEl.focus();
    }
    lastFocusedEl = null;
  }

  function renderInspector() {
    var step = currentStep();
    var badge = document.getElementById('inspector-badge');
    var kicker = document.getElementById('inspector-kicker');
    var title = document.getElementById('inspector-title');
    var subtitle = document.getElementById('workbench-subtitle');
    var body = document.getElementById('inspector-body');
    var btnBack = document.getElementById('btn-step-back');
    var btnNext = document.getElementById('btn-step-next');

    if (badge) badge.textContent = step.num;
    if (kicker) kicker.textContent = step.kicker;
    if (title) title.textContent = step.title.toUpperCase();
    if (subtitle) subtitle.textContent = step.subtitle;

    if (btnBack) {
      btnBack.disabled = state.stepIndex === 0;
      btnBack.textContent = t('backBtn');
    }
    if (btnNext) {
      if (state.stepIndex >= Circuits555.STEPS.length - 1) {
        btnNext.textContent = t('restartPinout');
      } else {
        var nextStep = getLocalizedStep(state.stepIndex + 1);
        btnNext.textContent = t('nextPrefix') + nextStep.shortTitle + ' →';
      }
    }

    if (!body) return;
    body.innerHTML = '';

    // Description
    var desc = document.createElement('p');
    desc.className = 'inspector-desc';
    desc.textContent = step.description;
    body.appendChild(desc);

    // Live Oscilloscope & Calculated Telemetry
    if (step.showScope) {
      var scopeSection = document.createElement('section');
      scopeSection.className = 'scope-section';
      scopeSection.innerHTML =
        '<div class="section-heading-row">' +
        '<h3 class="section-heading">' + t('liveScopeHeading') + '</h3>' +
        '<span class="section-meta">' + state.icType + ' · ' + Number(state.params.vcc || 5).toFixed(1) + ' V</span>' +
        '</div>' +
        '<div class="scope-frame">' +
        '<canvas id="scope-canvas" class="scope-canvas" data-testid="scope-canvas"></canvas>' +
        '</div>' +
        '<div class="metrics-grid" data-testid="metrics-grid"></div>';
      body.appendChild(scopeSection);
      scopeCanvas = scopeSection.querySelector('#scope-canvas');
      renderMetricsBlock(scopeSection, step);
    } else {
      scopeCanvas = null;
    }

    // Interactive Controls (sliders, trigger buttons, block toggles)
    if (step.controls && step.controls.length > 0) {
      var ctrlWrap = document.createElement('section');
      ctrlWrap.className = 'controls-section';
      var ctrlHead = document.createElement('h3');
      ctrlHead.className = 'section-heading';
      ctrlHead.textContent = t('controlsHeading');
      ctrlWrap.appendChild(ctrlHead);

      for (var c = 0; c < step.controls.length; c++) {
        (function (ctrl) {
          if (ctrl.type === 'slider') {
            var row = document.createElement('div');
            row.className = 'slider-row';
            var currentVal = state.params[ctrl.key];
            var labelRow = document.createElement('div');
            labelRow.className = 'slider-label-row';

            var lbl = document.createElement('label');
            lbl.setAttribute('for', 'ctrl-' + ctrl.key);
            lbl.textContent = ctrl.label;

            var valSpan = document.createElement('span');
            valSpan.className = 'slider-value';
            valSpan.textContent = formatControlValue(ctrl, currentVal);

            labelRow.appendChild(lbl);
            labelRow.appendChild(valSpan);

            var input = document.createElement('input');
            input.type = 'range';
            input.id = 'ctrl-' + ctrl.key;
            input.className = 'range-input';
            input.min = ctrl.min;
            input.max = ctrl.max;
            input.step = ctrl.step;
            input.value = currentVal;

            input.addEventListener('input', function () {
              var numVal = Number(input.value);
              state.params[ctrl.key] = numVal;
              valSpan.textContent = formatControlValue(ctrl, numVal);
              renderMetricsBlock(body, step);
              if (state.viewMode === '3d' && wb3d && !wb3dUnavailable) {
                wb3d.updateLiveVisuals(simState, state.params);
                if (ctrl.key !== 'potRatio') {
                  clearTimeout(sliderRebuildTimer);
                  sliderRebuildTimer = setTimeout(function () {
                    if (wb3d && state.viewMode === '3d') {
                      wb3d.buildCircuit(state, currentStep(), simState);
                    }
                  }, 100);
                }
              } else {
                var host = document.getElementById('workbench-svg-host');
                Workbench555.renderWorkbench(host, state, step, simState);
              }
              updateProbeReadout(null);
            });

            row.appendChild(labelRow);
            row.appendChild(input);
            ctrlWrap.appendChild(row);
          } else if (ctrl.type === 'trigger-button') {
            var trigBtn = document.createElement('button');
            trigBtn.type = 'button';
            trigBtn.className = 'btn-trigger-action';
            trigBtn.textContent = ctrl.label;
            trigBtn.addEventListener('click', function () {
              fireMonostableTrigger();
            });
            ctrlWrap.appendChild(trigBtn);
          } else if (ctrl.type === 'bistable-buttons') {
            var pair = document.createElement('div');
            pair.className = 'button-pair';
            var setBtn = document.createElement('button');
            setBtn.type = 'button';
            setBtn.className = 'btn-trigger-action';
            setBtn.textContent = t('setBtn');
            setBtn.addEventListener('click', function () {
              fireBistableSet();
            });
            var rstBtn = document.createElement('button');
            rstBtn.type = 'button';
            rstBtn.className = 'btn-secondary-action';
            rstBtn.textContent = t('rstBtn');
            rstBtn.addEventListener('click', function () {
              fireBistableReset();
            });
            pair.appendChild(setBtn);
            pair.appendChild(rstBtn);
            ctrlWrap.appendChild(pair);
          } else if (ctrl.type === 'block-toggles') {
            var toggleRow = document.createElement('div');
            toggleRow.className = 'block-toggle-grid';

            var defs = [
              { key: 'manualTrigLow', label: t('blockTrig') },
              { key: 'manualThresHigh', label: t('blockThres') },
              { key: 'manualResetLow', label: t('blockReset') }
            ];
            for (var d = 0; d < defs.length; d++) {
              (function (def) {
                var tBtn = document.createElement('button');
                tBtn.type = 'button';
                tBtn.className = 'btn-block-toggle' + (state.params[def.key] ? ' active' : '');
                tBtn.setAttribute('aria-pressed', state.params[def.key] ? 'true' : 'false');
                tBtn.textContent = def.label;
                tBtn.addEventListener('click', function () {
                  state.params[def.key] = !state.params[def.key];
                  Math555.stepSimulation(simState, 0.016, state.params);
                  renderInspector();
                  renderWorkbenchStage();
                });
                toggleRow.appendChild(tBtn);
              })(defs[d]);
            }
            ctrlWrap.appendChild(toggleRow);
          }
        })(step.controls[c]);
      }

      body.appendChild(ctrlWrap);
    }

    // Step 01 Bill of Materials checklist + Part Inspector trigger
    if (step.bom && step.bom.length > 0) {
      var bomSec = document.createElement('section');
      bomSec.className = 'bom-section';

      var checkedCount = 0;
      for (var b = 0; b < step.bom.length; b++) {
        if (state.checkedItems['bom:' + step.bom[b].id]) checkedCount++;
      }

      var bomHead = document.createElement('div');
      bomHead.className = 'section-heading-row';
      bomHead.innerHTML =
        '<h3 class="section-heading">' + t('bomHeading') + '</h3>' +
        '<span class="section-meta" id="bom-count">' + t('clickToInspect') + ' · ' + checkedCount + '/' + step.bom.length + '</span>';
      bomSec.appendChild(bomHead);

      var bomList = document.createElement('ul');
      bomList.className = 'bom-list';
      for (var bi = 0; bi < step.bom.length; bi++) {
        (function (item) {
          var key = 'bom:' + item.id;
          var checked = Boolean(state.checkedItems[key]);
          var isSelected = state.selectedPartId === item.id;
          var li = document.createElement('li');
          li.className = 'bom-row' + (checked ? ' checked' : '') + (isSelected ? ' selected' : '');
          li.innerHTML =
            '<input type="checkbox" class="bom-checkbox" aria-label="Check item" ' + (checked ? 'checked' : '') + ' />' +
            '<button type="button" class="bom-select-btn" data-part-id="' + item.id + '">' +
            '<span class="bom-qty">' + item.qty + '</span>' +
            '<span class="bom-text">' + item.text + '</span>' +
            '</button>';

          var cb = li.querySelector('input');
          cb.addEventListener('change', function () {
            state.checkedItems[key] = cb.checked;
            saveCheckedItems();
            li.classList.toggle('checked', cb.checked);
            var cnt = 0;
            for (var x = 0; x < step.bom.length; x++) {
              if (state.checkedItems['bom:' + step.bom[x].id]) cnt++;
            }
            var countEl = document.getElementById('bom-count');
            if (countEl) countEl.textContent = t('clickToInspect') + ' · ' + cnt + '/' + step.bom.length;
          });

          var selBtn = li.querySelector('.bom-select-btn');
          selBtn.addEventListener('click', function () {
            openPartModal(item.id);
          });

          bomList.appendChild(li);
        })(step.bom[bi]);
      }
      bomSec.appendChild(bomList);
      body.appendChild(bomSec);
    }

    // Wiring / Pin Map List
    if (step.wires && step.wires.length > 0) {
      var wireSec = document.createElement('section');
      wireSec.className = 'wiring-section';
      var wireHead = document.createElement('div');
      wireHead.className = 'section-heading-row';
      wireHead.innerHTML =
        '<h3 class="section-heading">' + (step.mode === 'pinout' ? t('pinoutMapHeading') : t('wiringMapHeading')) + '</h3>' +
        '<span class="section-meta">' + t('hoverToTrace') + '</span>';
      wireSec.appendChild(wireHead);

      var wireList = document.createElement('div');
      wireList.className = 'pinmap-list';

      for (var wi = 0; wi < step.wires.length; wi++) {
        (function (wire) {
          var rowBtn = document.createElement('button');
          rowBtn.type = 'button';
          rowBtn.className = 'pinmap-row';
          rowBtn.setAttribute('data-row-wire-id', wire.id);
          rowBtn.innerHTML =
            '<span class="wire-swatch" style="background:' + wire.color + '"></span>' +
            '<span class="wire-label">' + wire.label + '</span>' +
            '<span class="wire-badge">' + wire.badge + '</span>';

          rowBtn.addEventListener('mouseenter', function () {
            highlightWire(wire.id, wire);
          });
          rowBtn.addEventListener('mouseleave', function () {
            if (!state.selectedPartId) {
              highlightWire(null, null);
            }
          });
          rowBtn.addEventListener('click', function () {
            var nextId = state.highlightedWireId === wire.id ? null : wire.id;
            highlightWire(nextId, nextId ? wire : null);
          });

          wireList.appendChild(rowBtn);
        })(step.wires[wi]);
      }

      wireSec.appendChild(wireList);
      body.appendChild(wireSec);
    }

    // Engineering Note
    if (step.note) {
      var noteBox = document.createElement('aside');
      noteBox.className = 'note-box';
      noteBox.innerHTML =
        '<span class="note-kicker">' + t('noteLabel') + '</span>' +
        '<p class="note-text">' + step.note + '</p>';
      body.appendChild(noteBox);
    }
  }

  function highlightWire(wireId, wireObj) {
    state.highlightedWireId = wireId;
    var host = document.getElementById('workbench-svg-host');
    Workbench555.applyHighlight(host, wireId);
    if (wb3d && state.viewMode === '3d') {
      wb3d.applyHighlight(wireId);
    }

    var rows = document.querySelectorAll('.pinmap-row');
    for (var i = 0; i < rows.length; i++) {
      var rId = rows[i].getAttribute('data-row-wire-id');
      rows[i].classList.toggle('active', Boolean(wireId && rId === wireId));
    }

    updateProbeReadout(wireObj);
  }

  function updateProbeReadout(wireObj) {
    var telemetryEl = document.getElementById('live-telemetry-line');
    var calloutEl = document.getElementById('live-probe-callout');
    var titleEl = document.getElementById('probe-title');
    var detailEl = document.getElementById('probe-detail');

    var vcc = Number(state.params.vcc || 5).toFixed(1);
    var voh = Math555.getOutputHighVoltage(state.params.vcc || 5, state.icType);
    var outV = simState.outputHigh ? (voh.toFixed(1) + ' V ' + t('probeHigh')) : ('0.1 V ' + t('probeLow'));

    if (telemetryEl) {
      telemetryEl.textContent = state.icType + ' · ' + vcc + ' V · OUT ' + outV;
    }

    if (!calloutEl || !titleEl || !detailEl) return;
    if (wireObj) {
      titleEl.textContent = wireObj.badge || t('probeSelected');
      detailEl.textContent = wireObj.label;
      calloutEl.classList.remove('hidden');
    } else {
      calloutEl.classList.add('hidden');
    }
  }

  function fireMonostableTrigger() {
    simState.triggerPressed = true;
    Math555.stepSimulation(simState, 0.016, state.params);
    simState.triggerPressed = false;
    renderMetricsBlock(document.getElementById('inspector-body'), currentStep());
    showToast(t('toastTrig'));
  }

  function fireBistableSet() {
    simState.triggerPressed = true;
    simState.resetPressed = false;
    Math555.stepSimulation(simState, 0.016, state.params);
    simState.triggerPressed = false;
    renderMetricsBlock(document.getElementById('inspector-body'), currentStep());
    showToast(t('toastSet'));
  }

  function fireBistableReset() {
    simState.resetPressed = true;
    simState.triggerPressed = false;
    Math555.stepSimulation(simState, 0.016, state.params);
    simState.resetPressed = false;
    renderMetricsBlock(document.getElementById('inspector-body'), currentStep());
    showToast(t('toastReset'));
  }

  function findWireByMeta(meta) {
    var step = currentStep();
    var wires = step.wires || [];
    for (var i = 0; i < wires.length; i++) {
      if (meta.wireId && wires[i].id === meta.wireId) return wires[i];
      if (meta.pin && wires[i].pin === meta.pin) return wires[i];
    }
    return null;
  }

  function ensure3DWorkbench() {
    if (wb3d || wb3dUnavailable) return wb3d;
    var host3d = document.getElementById('workbench-3d-host');
    if (!host3d || !Workbench3D555 || !Workbench3D555.Studio3DWorkbench) {
      wb3dUnavailable = true;
      return null;
    }
    try {
      wb3d = new Workbench3D555.Studio3DWorkbench(host3d, {
        onClickTarget: function (meta) {
          if (!meta) return;
          if (meta.btnRole === 'reset') {
            fireBistableReset();
            return;
          }
          if (meta.btnRole) {
            if (currentStep().mode === 'bistable') fireBistableSet();
            else fireMonostableTrigger();
            return;
          }
          if (meta.pin) {
            var pinMeta = getLocalizedPin(meta.pin);
            if (pinMeta) {
              highlightWire(meta.wireId || ('pin-' + meta.pin), {
                badge: 'PIN ' + pinMeta.num + ' · ' + pinMeta.name,
                label: pinMeta.full + ' — ' + pinMeta.desc
              });
            }
            return;
          }
          if (meta.partId) {
            openPartModal(meta.partId);
            return;
          }
          var wireObj = findWireByMeta(meta);
          if (wireObj) {
            var nextId = state.highlightedWireId === wireObj.id ? null : wireObj.id;
            highlightWire(nextId, nextId ? wireObj : null);
          }
        },
        onHoverTarget: function (meta) {
          if (!meta) {
            updateProbeReadout(null);
            return;
          }
          if (meta.pin) {
            var pinMeta = getLocalizedPin(meta.pin);
            if (pinMeta) {
              updateProbeReadout({
                badge: 'PIN ' + pinMeta.num + ' · ' + pinMeta.name,
                label: pinMeta.full + ' — ' + pinMeta.desc
              });
              return;
            }
          }
          if (meta.partId && I18n555) {
            var pInfo = I18n555.getPartDetail(meta.partId, state.lang);
            if (pInfo) {
              updateProbeReadout({ badge: pInfo.badge, label: pInfo.title });
              return;
            }
          }
          var wireObj = findWireByMeta(meta);
          if (wireObj) {
            updateProbeReadout(wireObj);
            return;
          }
          if (meta.label) {
            updateProbeReadout({
              badge: t('probePart'),
              label: I18n555 ? I18n555.translateLabel3d(meta.label, state.lang) : meta.label
            });
          }
        }
      });
      wb3d.setTheme(state.theme);
    } catch (e) {
      wb3dUnavailable = true;
      wb3d = null;
    }
    return wb3d;
  }

  function is3dActiveForStep(step) {
    return state.viewMode === '3d' && step.mode !== 'block' && !wb3dUnavailable && Boolean(Workbench3D555);
  }

  function renderWorkbenchStage() {
    var host3d = document.getElementById('workbench-3d-host');
    var hostSvg = document.getElementById('workbench-svg-host');
    var svgTip = document.getElementById('svg-hover-tooltip');
    var btnExplode = document.getElementById('btn-explode-toggle');
    var btn3d = document.getElementById('btn-view-3d');
    var btnSch = document.getElementById('btn-view-schematic');
    var step = currentStep();
    var isBlockOnly = step.mode === 'block';
    var use3d = is3dActiveForStep(step);

    if (svgTip) svgTip.classList.add('hidden');
    if (btnExplode) {
      btnExplode.disabled = !use3d;
    }
    if (btn3d && btnSch) {
      btn3d.disabled = isBlockOnly || wb3dUnavailable;
      btn3d.classList.toggle('active', use3d);
      btnSch.classList.toggle('active', !use3d);
    }

    var doAnimate = pendingAssemblyAnim;
    pendingAssemblyAnim = false;

    if (use3d) {
      if (host3d) host3d.classList.remove('hidden');
      if (hostSvg) hostSvg.classList.add('hidden');
      var inst = ensure3DWorkbench();
      if (inst) {
        inst.resize();
        inst.setTheme(state.theme);
        inst.buildCircuit(state, step, simState, { animate: doAnimate });
        return;
      }
    }

    // Step 02 internal schematic diagram, Schematic view, or WebGL fallback
    if (host3d) host3d.classList.add('hidden');
    if (hostSvg) hostSvg.classList.remove('hidden');
    var fallbackState = state.viewMode === '3d'
      ? Object.assign({}, state, { viewMode: 'breadboard' })
      : state;
    Workbench555.renderWorkbench(hostSvg, fallbackState, step, simState, { animate: doAnimate });
  }

  function renderAll() {
    applyStaticTranslations();
    renderStepStrip();
    renderInspector();
    renderWorkbenchStage();
    updateProbeReadout(null);
  }

  function bindWorkbenchEvents() {
    var host = document.getElementById('workbench-svg-host');
    if (!host) return;

    var wrap = document.getElementById('workbench-wrap');
    var svgTip = document.getElementById('svg-hover-tooltip');

    function hideSvgHover() {
      if (svgTip) svgTip.classList.add('hidden');
      updateProbeReadout(null);
    }

    function positionSvgHover(ev, label) {
      if (!svgTip || !wrap || !label) return;
      var rect = wrap.getBoundingClientRect();
      var x = Math.max(48, Math.min(rect.width - 48, ev.clientX - rect.left));
      var y = Math.max(30, Math.min(rect.height - 20, ev.clientY - rect.top - 12));
      svgTip.textContent = I18n555 ? I18n555.translateLabel3d(label, state.lang) : label;
      svgTip.style.transform = 'translate(' + Math.round(x) + 'px, ' + Math.round(y) + 'px) translate(-50%, -100%)';
      svgTip.classList.remove('hidden');
    }

    // Click delegation inside SVG (buttons, pins, components)
    host.addEventListener('click', function (ev) {
      var btnEl = ev.target.closest('.bb-interactive-btn');
      if (btnEl && currentStep().mode !== 'pinout') {
        var role = btnEl.getAttribute('data-btn-role');
        if (role === 'reset') fireBistableReset();
        else if (currentStep().mode === 'bistable') fireBistableSet();
        else fireMonostableTrigger();
        return;
      }

      var pinEl = ev.target.closest('[data-pin]');
      if (pinEl) {
        var pinNum = Number(pinEl.getAttribute('data-pin'));
        var pinMeta = getLocalizedPin(pinNum);
        if (pinMeta) {
          var wireId = pinEl.getAttribute('data-wire-id') || null;
          highlightWire(wireId, {
            badge: 'PIN ' + pinMeta.num + ' · ' + pinMeta.name,
            label: pinMeta.full + ' — ' + pinMeta.desc
          });
        }
        return;
      }

      var partEl = ev.target.closest('[data-part-id]');
      if (partEl) {
        openPartModal(partEl.getAttribute('data-part-id'));
      }
    });

    // Hover pin, component, or wire on SVG (tooltip appears ONLY on hover)
    host.addEventListener('mousemove', function (ev) {
      var target = ev.target.closest('[data-hover-label], [data-wire-id]');
      if (!target) {
        hideSvgHover();
        return;
      }
      var hoverLbl = target.getAttribute('data-hover-label');
      if (hoverLbl) {
        positionSvgHover(ev, hoverLbl);
      } else if (svgTip) {
        svgTip.classList.add('hidden');
      }
      var wid = target.getAttribute('data-wire-id');
      if (wid) {
        var wires = currentStep().wires || [];
        for (var i = 0; i < wires.length; i++) {
          if (wires[i].id === wid) {
            updateProbeReadout(wires[i]);
            return;
          }
        }
      }
      var pid = target.getAttribute('data-part-id');
      if (pid && I18n555) {
        var info = I18n555.getPartDetail(pid, state.lang);
        if (info) updateProbeReadout({ badge: info.badge, label: info.title });
      }
    });

    host.addEventListener('mouseleave', hideSvgHover);

    // Drag to pan on cutting mat
    var dragging = false;
    var startX = 0;
    var startY = 0;
    var origPanX = 0;
    var origPanY = 0;

    host.addEventListener('pointerdown', function (ev) {
      if (ev.target.closest('.bb-interactive-btn') || ev.target.closest('[data-pin]') || ev.target.closest('[data-part-id]')) return;
      dragging = true;
      startX = ev.clientX;
      startY = ev.clientY;
      origPanX = state.panX;
      origPanY = state.panY;
      host.setPointerCapture && host.setPointerCapture(ev.pointerId);
    });

    host.addEventListener('pointermove', function (ev) {
      if (!dragging) return;
      state.panX = Math.max(-240, Math.min(240, origPanX + (ev.clientX - startX)));
      state.panY = Math.max(-180, Math.min(180, origPanY + (ev.clientY - startY)));
      Workbench555.applyViewportTransform(host, state.zoom, state.panX, state.panY);
    });

    host.addEventListener('pointerup', function () {
      dragging = false;
    });
    host.addEventListener('pointercancel', function () {
      dragging = false;
    });

    // Wheel zoom
    host.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var delta = ev.deltaY < 0 ? 0.12 : -0.12;
      state.zoom = Math.max(0.7, Math.min(2.2, Number((state.zoom + delta).toFixed(2))));
      Workbench555.applyViewportTransform(host, state.zoom, state.panX, state.panY);
    }, { passive: false });
  }

  function bindToolbarEvents() {
    // Top bar quick jumps
    var jumps = document.querySelectorAll('[data-jump-step]');
    for (var i = 0; i < jumps.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          setStep(Number(btn.getAttribute('data-jump-step')));
        });
      })(jumps[i]);
    }

    var brandHome = document.getElementById('brand-home');
    if (brandHome) {
      brandHome.addEventListener('click', function (ev) {
        ev.preventDefault();
        setStep(0);
      });
    }

    // View mode toggle (3D View / Schematic)
    var btn3d = document.getElementById('btn-view-3d');
    var btnSch = document.getElementById('btn-view-schematic');
    function setViewMode(mode) {
      state.viewMode = mode;
      if (btn3d) btn3d.classList.toggle('active', mode === '3d');
      if (btnSch) btnSch.classList.toggle('active', mode === 'schematic');
      renderWorkbenchStage();
    }
    if (btn3d) btn3d.addEventListener('click', function () { setViewMode('3d'); });
    if (btnSch) btnSch.addEventListener('click', function () { setViewMode('schematic'); });

    // IC type toggle (NE555 / TLC555)
    var btnNe = document.getElementById('btn-ic-ne555');
    var btnTlc = document.getElementById('btn-ic-tlc555');
    function setIcType(ic) {
      state.icType = ic;
      state.params.icType = ic;
      if (btnNe) btnNe.classList.toggle('active', ic === 'NE555');
      if (btnTlc) btnTlc.classList.toggle('active', ic === 'TLC555');
      renderInspector();
      renderWorkbenchStage();
      updateProbeReadout(null);
    }
    if (btnNe) btnNe.addEventListener('click', function () { setIcType('NE555'); });
    if (btnTlc) btnTlc.addEventListener('click', function () { setIcType('TLC555'); });

    // Play / Pause
    var btnPP = document.getElementById('btn-play-pause');
    if (btnPP) {
      btnPP.addEventListener('click', function () {
        state.paused = !state.paused;
        state.params.paused = state.paused;
        var iPause = document.getElementById('icon-pause');
        var iPlay = document.getElementById('icon-play');
        if (iPause) iPause.classList.toggle('hidden', state.paused);
        if (iPlay) iPlay.classList.toggle('hidden', !state.paused);
        btnPP.setAttribute('aria-label', state.paused ? t('hudResume') : t('hudPause'));
      });
    }

    // Speed
    var btnSpeed = document.getElementById('btn-speed');
    if (btnSpeed) {
      btnSpeed.addEventListener('click', function () {
        state.speedIdx = (state.speedIdx + 1) % SPEEDS.length;
        state.params.speed = SPEEDS[state.speedIdx];
        btnSpeed.textContent = SPEEDS[state.speedIdx] + '×';
        btnSpeed.setAttribute('aria-label', 'Simulation speed ' + SPEEDS[state.speedIdx] + 'x');
      });
    }

    // Audio toggle (buzzer circuits only)
    var btnAudio = document.getElementById('btn-audio-toggle');
    if (btnAudio) {
      btnAudio.addEventListener('click', function () {
        if (!stepHasBuzzer(currentStep())) {
          showToast(t('toastNoBuzzer'));
          return;
        }
        var next = !Audio555.isEnabled();
        Audio555.setEnabled(next);
        syncAudioButtonState(currentStep());
        showToast(next ? t('toastAudioOn') : t('toastAudioOff'));
      });
    }

    // Light / Dark Theme Toggle
    var btnTheme = document.getElementById('btn-theme-toggle');
    if (btnTheme) {
      btnTheme.addEventListener('click', function () {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        saveTheme();
        applyTheme();
        showToast(state.theme === 'dark' ? t('toastThemeDark') : t('toastThemeLight'));
      });
    }

    // Offline Language Toggle (EN / ES)
    var btnLang = document.getElementById('btn-lang-toggle');
    if (btnLang) {
      btnLang.addEventListener('click', function () {
        state.lang = state.lang === 'en' ? 'es' : 'en';
        saveLang();
        var openPart = state.selectedPartId;
        renderAll();
        if (openPart) openPartModal(openPart);
        showToast(state.lang === 'es' ? t('toastLangEs') : t('toastLangEn'));
      });
    }

    // Modal Dialog Close
    var modalBackdrop = document.getElementById('part-modal-backdrop');
    var btnModalClose = document.getElementById('btn-modal-close');
    if (btnModalClose) {
      btnModalClose.addEventListener('click', function () {
        closePartModal();
      });
    }
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', function (ev) {
        if (ev.target === modalBackdrop) {
          closePartModal();
        }
      });
    }

    // Zoom, Reset, Exploded View Controls
    var host = document.getElementById('workbench-svg-host');
    var btnZIn = document.getElementById('btn-zoom-in');
    var btnZOut = document.getElementById('btn-zoom-out');
    var btnZReset = document.getElementById('btn-zoom-reset');
    var btnExplode = document.getElementById('btn-explode-toggle');

    if (btnZIn) {
      btnZIn.addEventListener('click', function () {
        if (is3dActiveForStep(currentStep()) && wb3d) {
          wb3d.zoomBy(0.84);
        } else {
          state.zoom = Math.min(2.2, Number((state.zoom + 0.18).toFixed(2)));
          Workbench555.applyViewportTransform(host, state.zoom, state.panX, state.panY);
        }
      });
    }
    if (btnZOut) {
      btnZOut.addEventListener('click', function () {
        if (is3dActiveForStep(currentStep()) && wb3d) {
          wb3d.zoomBy(1.18);
        } else {
          state.zoom = Math.max(0.7, Number((state.zoom - 0.18).toFixed(2)));
          Workbench555.applyViewportTransform(host, state.zoom, state.panX, state.panY);
        }
      });
    }
    if (btnZReset) {
      btnZReset.addEventListener('click', function () {
        if (is3dActiveForStep(currentStep()) && wb3d) {
          wb3d.resetCamera();
        } else {
          state.zoom = 1;
          state.panX = 0;
          state.panY = 0;
          Workbench555.applyViewportTransform(host, state.zoom, state.panX, state.panY);
        }
      });
    }
    if (btnExplode) {
      btnExplode.classList.toggle('active', state.exploded);
      btnExplode.addEventListener('click', function () {
        if (!is3dActiveForStep(currentStep())) return;
        state.exploded = !state.exploded;
        btnExplode.setAttribute('aria-pressed', state.exploded ? 'true' : 'false');
        btnExplode.classList.toggle('active', state.exploded);
        if (wb3d) {
          wb3d.setExploded(state.exploded);
        }
      });
    }

    // Step Back / Next
    var btnBack = document.getElementById('btn-step-back');
    var btnNext = document.getElementById('btn-step-next');
    if (btnBack) {
      btnBack.addEventListener('click', function () {
        if (state.stepIndex > 0) setStep(state.stepIndex - 1);
      });
    }
    if (btnNext) {
      btnNext.addEventListener('click', function () {
        if (state.stepIndex < Circuits555.STEPS.length - 1) setStep(state.stepIndex + 1);
        else setStep(0);
      });
    }

    // Carousel scroll arrows
    var strip = document.getElementById('step-strip');
    var sPrev = document.getElementById('btn-strip-prev');
    var sNext = document.getElementById('btn-strip-next');
    if (sPrev && strip) {
      sPrev.addEventListener('click', function () {
        strip.scrollBy({ left: -240, behavior: 'smooth' });
      });
    }
    if (sNext && strip) {
      sNext.addEventListener('click', function () {
        strip.scrollBy({ left: 240, behavior: 'smooth' });
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        var backdrop = document.getElementById('part-modal-backdrop');
        if (backdrop && !backdrop.classList.contains('hidden')) {
          closePartModal();
          return;
        }
      }
      if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA')) return;
      if (ev.key === 'ArrowRight') {
        if (state.stepIndex < Circuits555.STEPS.length - 1) setStep(state.stepIndex + 1);
      } else if (ev.key === 'ArrowLeft') {
        if (state.stepIndex > 0) setStep(state.stepIndex - 1);
      } else if ((ev.key === 'e' || ev.key === 'E') && btnExplode) {
        btnExplode.click();
      } else if (ev.key === ' ' && btnPP) {
        ev.preventDefault();
        btnPP.click();
      }
    });

    // Save Single-File Offline HTML
    var btnSave = document.getElementById('btn-download-offline');
    if (btnSave) {
      btnSave.addEventListener('click', exportSingleFileOfflineHtml);
    }
  }

  /**
   * Package the entire CSS + Vanilla JS app into a single standalone HTML file
   * that runs on any phone, tablet, or computer via file:// with zero server!
   */
  function exportSingleFileOfflineHtml() {
    var cssLinks = ['./css/styles.css'];
    var jsFiles = [
      './js/math555.js',
      './js/circuits.js',
      './js/audio.js',
      './js/scope.js',
      './js/workbench.js',
      './js/three-vendor.js',
      './js/workbench3d.js',
      './js/i18n.js',
      './js/app.js'
    ];

    function readTextAsset(url) {
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      });
    }

    if (root.location && root.location.protocol === 'file:') {
      // Fallback: serialize currently loaded document styles & scripts if already running from file://
      var fallbackHtml = '<!doctype html>\n' + document.documentElement.outerHTML;
      triggerHtmlDownload(fallbackHtml);
      showToast(t('toastOfflineFile'));
      return;
    }

    Promise.all([
      Promise.all(cssLinks.map(readTextAsset)),
      Promise.all(jsFiles.map(readTextAsset))
    ]).then(function (results) {
      var cssBundle = results[0].join('\n');
      var jsBundle = results[1].join('\n;\n').replace(/<\/script/gi, '<\\/script');

      var cloneDoc = document.documentElement.cloneNode(true);
      // Clear dynamic DOM so app.js boots cleanly offline
      var strip = cloneDoc.querySelector('#step-strip');
      if (strip) strip.innerHTML = '';
      var wb3 = cloneDoc.querySelector('#workbench-3d-host');
      if (wb3) wb3.innerHTML = '';
      var wb = cloneDoc.querySelector('#workbench-svg-host');
      if (wb) wb.innerHTML = '';
      var insp = cloneDoc.querySelector('#inspector-body');
      if (insp) insp.innerHTML = '';
      var toast = cloneDoc.querySelector('#toast-region');
      if (toast) toast.innerHTML = '';

      // Remove external relative stylesheet & script tags
      var oldLinks = cloneDoc.querySelectorAll('link[rel="stylesheet"], link[rel="manifest"], link[rel="icon"]');
      for (var i = 0; i < oldLinks.length; i++) oldLinks[i].parentNode.removeChild(oldLinks[i]);
      var oldScripts = cloneDoc.querySelectorAll('script[src]');
      for (var j = 0; j < oldScripts.length; j++) oldScripts[j].parentNode.removeChild(oldScripts[j]);

      var head = cloneDoc.querySelector('head');
      var styleTag = document.createElement('style');
      styleTag.textContent = cssBundle;
      head.appendChild(styleTag);

      var body = cloneDoc.querySelector('body');
      var scriptTag = document.createElement('script');
      scriptTag.textContent = jsBundle;
      body.appendChild(scriptTag);

      var finalHtml = '<!doctype html>\n' + cloneDoc.outerHTML;
      triggerHtmlDownload(finalHtml);
      showToast(t('toastOfflineSaved'));
    }).catch(function () {
      showToast(t('toastOfflineErr'));
    });
  }

  function triggerHtmlDownload(htmlContent) {
    var blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '555kit-offline.html';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 300);
  }

  function registerOfflineServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (!root.location || root.location.protocol === 'file:') return;
    navigator.serviceWorker.register('./sw.js').catch(function () {
      // Ignore if environment restricts SW scope
    });
  }

  var lastProbeUpdate = 0;
  var lastPaintTime = 0;

  function animationLoop(now) {
    var elapsed = now - lastPaintTime;
    if (elapsed >= 32) {
      var dt = Math.min(0.05, Math.max(0.004, (now - lastTick) / 1000));
      lastTick = now;
      lastPaintTime = now;
      var step = currentStep();
      var isStatic = step.mode === 'pinout' || step.mode === 'block';

      if (!state.paused && !isStatic) {
        Math555.stepSimulation(simState, dt, state.params);
        if (state.viewMode === '3d' && wb3d && step.mode !== 'block') {
          wb3d.updateLiveVisuals(simState, state.params);
        } else {
          var host = document.getElementById('workbench-svg-host');
          Workbench555.updateLiveVisuals(host, simState, state.params);
        }
        if (scopeCanvas) {
          Scope555.renderScope(scopeCanvas, simState, state.params.vcc || 5);
        }
        Audio555.updateTone(state.params, simState);

        if (now - lastProbeUpdate > 200) {
          lastProbeUpdate = now;
          var telemetryEl = document.getElementById('live-telemetry-line');
          if (telemetryEl) {
            var vcc = Number(state.params.vcc || 5).toFixed(1);
            var voh = Math555.getOutputHighVoltage(state.params.vcc || 5, state.icType);
            var outV = simState.outputHigh ? (voh.toFixed(1) + ' V ' + t('probeHigh')) : ('0.1 V ' + t('probeLow'));
            telemetryEl.textContent = state.icType + ' · ' + vcc + ' V · OUT ' + outV;
          }
          if (step.mode === 'monostable') {
            var grid = document.querySelector('.metrics-grid');
            if (grid) {
              var vals = grid.querySelectorAll('.metric-value');
              if (vals[3]) vals[3].textContent = simState.outputHigh ? t('probeHigh') : (I18n555 ? I18n555.translateMetric('IDLE', state.lang) : 'IDLE');
            }
          }
        }
      }
    }

    root.requestAnimationFrame(animationLoop);
  }

  function init() {
    // Resolve initial step from URL hash if present
    var initialIdx = 0;
    if (root.location && root.location.hash) {
      var targetId = root.location.hash.replace('#', '').trim();
      for (var i = 0; i < Circuits555.STEPS.length; i++) {
        if (Circuits555.STEPS[i].id === targetId) {
          initialIdx = i;
          break;
        }
      }
    }

    bindWorkbenchEvents();
    bindToolbarEvents();
    registerOfflineServiceWorker();
    setStep(initialIdx, false);
    lastTick = performance.now();
    root.requestAnimationFrame(animationLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}(typeof self !== 'undefined' ? self : this));
