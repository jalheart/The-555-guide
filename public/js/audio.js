(function (root) {
  'use strict';

  var ctx = null;
  var osc = null;
  var gain = null;
  var enabled = false;

  function ensureContext() {
    if (!ctx) {
      var AudioCtx = root.AudioContext || root.webkitAudioContext;
      if (!AudioCtx) return false;
      ctx = new AudioCtx();
      osc = ctx.createOscillator();
      gain = ctx.createGain();
      osc.type = 'square';
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(function () {});
    }
    return true;
  }

  function setEnabled(flag) {
    enabled = Boolean(flag);
    if (enabled) {
      ensureContext();
    } else if (gain && ctx) {
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
    }
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  function updateTone(params, simState) {
    if (!ctx || !gain || !osc) return;
    if (!enabled || !params || (!params.hasBuzzer && params.mode !== 'audio') || params.paused) {
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
      return;
    }

    var ast = root.Math555.calcAstable(params.r1, params.r2, params.c1);
    var freq = Math.max(40, Math.min(4000, ast.freq));
    osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.02);
    gain.gain.setTargetAtTime(0.055, ctx.currentTime, 0.02);
  }

  root.Audio555 = {
    setEnabled: setEnabled,
    isEnabled: isEnabled,
    updateTone: updateTone
  };
}(typeof self !== 'undefined' ? self : this));
