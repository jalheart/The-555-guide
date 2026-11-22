(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Math555 = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LN2 = Math.LN2; // ~0.69314718056

  var COLOR_PALETTE = [
    { name: 'Black', hex: '#1F242B' },
    { name: 'Brown', hex: '#7A4320' },
    { name: 'Red', hex: '#D93829' },
    { name: 'Orange', hex: '#E87722' },
    { name: 'Yellow', hex: '#F2C12E' },
    { name: 'Green', hex: '#2B8A57' },
    { name: 'Blue', hex: '#2667C9' },
    { name: 'Violet', hex: '#7C48B5' },
    { name: 'Grey', hex: '#7C8594' },
    { name: 'White', hex: '#F4F6F8' }
  ];

  /**
   * Compute 4-band EIA resistor color codes (digits + multiplier + 5% gold tolerance).
   */
  function getResistorBands(ohms) {
    var val = Math.max(1, Number(ohms) || 1000);
    var exp = Math.floor(Math.log10(val));
    var norm = val / Math.pow(10, exp); // [1, 10)
    var twoDigits = Math.round(norm * 10);
    if (twoDigits >= 100) {
      twoDigits = 10;
      exp += 1;
    }
    var d1 = Math.floor(twoDigits / 10);
    var d2 = twoDigits % 10;
    var multIdx = Math.max(0, Math.min(9, exp - 1));
    if (val < 10) {
      d1 = Math.floor(val);
      d2 = Math.round((val - d1) * 10) % 10;
      return [
        COLOR_PALETTE[Math.max(1, Math.min(9, d1))],
        COLOR_PALETTE[Math.max(0, Math.min(9, d2))],
        { name: 'Gold', hex: '#D4A838' },
        { name: 'Gold', hex: '#D4A838' }
      ];
    }
    return [
      COLOR_PALETTE[Math.max(0, Math.min(9, d1))],
      COLOR_PALETTE[Math.max(0, Math.min(9, d2))],
      COLOR_PALETTE[multIdx],
      { name: 'Gold', hex: '#D4A838' }
    ];
  }

  function trimDecimalZeros(str) {
    return str.indexOf('.') >= 0 ? str.replace(/\.?0+$/, '') : str;
  }

  function formatResistance(ohms) {
    var v = Number(ohms) || 0;
    if (v >= 1e6) return trimDecimalZeros((v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 2)) + ' MΩ';
    if (v >= 1e3) return trimDecimalZeros((v / 1e3).toFixed(v % 1e3 === 0 ? 0 : 1)) + ' kΩ';
    return Math.round(v) + ' Ω';
  }

  function formatCapacitance(microFarads) {
    var uf = Number(microFarads) || 0;
    if (uf >= 1) return trimDecimalZeros(uf.toFixed(uf >= 10 ? 0 : 2)) + ' µF';
    var nf = uf * 1000;
    if (nf >= 1) return trimDecimalZeros(nf.toFixed(1)) + ' nF';
    return Math.round(nf * 1000) + ' pF';
  }

  function formatFrequency(hz) {
    if (!isFinite(hz) || hz <= 0) return '0 Hz';
    if (hz >= 1e6) return (hz / 1e6).toFixed(2) + ' MHz';
    if (hz >= 1e3) return (hz / 1e3).toFixed(2) + ' kHz';
    if (hz >= 10) return hz.toFixed(1) + ' Hz';
    return hz.toFixed(2) + ' Hz';
  }

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0 ms';
    if (seconds >= 1) return seconds.toFixed(2) + ' s';
    if (seconds >= 0.001) return (seconds * 1000).toFixed(1) + ' ms';
    return (seconds * 1e6).toFixed(0) + ' µs';
  }

  function getOutputHighVoltage(vcc, icType) {
    var supply = Math.max(3, Number(vcc) || 5);
    if (icType === 'TLC555') return supply;
    return Math.max(1.2, supply - 1.4);
  }

  /**
   * Standard Astable 555 calculations.
   * R1, R2 in Ohms; C in microFarads.
   */
  function calcAstable(r1, r2, cUf) {
    var R1 = Math.max(100, Number(r1) || 1000);
    var R2 = Math.max(100, Number(r2) || 1000);
    var C = Math.max(0.0001, Number(cUf) || 1) * 1e-6;
    var tHigh = LN2 * (R1 + R2) * C;
    var tLow = LN2 * R2 * C;
    var period = tHigh + tLow;
    var freq = 1 / period;
    var duty = (tHigh / period) * 100;
    return {
      tHigh: tHigh,
      tLow: tLow,
      period: period,
      freq: freq,
      duty: duty
    };
  }

  /**
   * Classic Monostable 555 one-shot pulse width: T = 1.1 * R * C.
   */
  function calcMonostable(r1, cUf) {
    var R = Math.max(100, Number(r1) || 10000);
    var C = Math.max(0.0001, Number(cUf) || 10) * 1e-6;
    var pulseWidth = 1.1 * R * C;
    return {
      pulseWidth: pulseWidth,
      tHigh: pulseWidth,
      tLow: 0,
      period: pulseWidth,
      freq: 0,
      duty: 100
    };
  }

  /**
   * 50% Duty-Cycle Astable (Pin 3 charges/discharges C through R2).
   */
  function calcFiftyPercentAstable(r2, cUf) {
    var R2 = Math.max(100, Number(r2) || 10000);
    var C = Math.max(0.0001, Number(cUf) || 10) * 1e-6;
    var tHalf = LN2 * R2 * C;
    var period = 2 * tHalf;
    return {
      tHigh: tHalf,
      tLow: tHalf,
      period: period,
      freq: 1 / period,
      duty: 50
    };
  }

  /**
   * Steering-diode PWM dimmer using potentiometer R_pot split by potRatio [0.05..0.95].
   */
  function calcPwmDimmer(rSeries, rPot, potRatio, cUf) {
    var Rs = Math.max(100, Number(rSeries) || 1000);
    var Rp = Math.max(1000, Number(rPot) || 50000);
    var ratio = Math.max(0.05, Math.min(0.95, Number(potRatio) || 0.5));
    var C = Math.max(0.0001, Number(cUf) || 0.1) * 1e-6;
    var rCharge = Rs + Rp * ratio;
    var rDischarge = Rs + Rp * (1 - ratio);
    var tHigh = LN2 * rCharge * C;
    var tLow = LN2 * rDischarge * C;
    var period = tHigh + tLow;
    return {
      rCharge: rCharge,
      rDischarge: rDischarge,
      tHigh: tHigh,
      tLow: tLow,
      period: period,
      freq: 1 / period,
      duty: (tHigh / period) * 100
    };
  }

  /**
   * LDR darkness detector math: lightPercent [0..100], dark = high resistance.
   */
  function calcLdrDetector(lightPercent, rPull, thresholdFraction) {
    var light = Math.max(0, Math.min(100, Number(lightPercent)));
    // Realistic CdS cell: ~100 kOhm in dark (0%) down to ~400 Ohm in bright light (100%)
    var rLdr = 400 + Math.pow((100 - light) / 100, 2.2) * 120000;
    var pull = Math.max(100, Number(rPull) || 10000);
    // LDR connected between Vcc and Pin 4/2 divider OR GND and divider:
    // Here LDR is on top (Vcc -> LDR -> Node -> R_pull -> GND) or bottom (Vcc -> R_pull -> Node -> LDR -> GND).
    // With LDR from Node to GND and R_pull from Vcc to Node:
    // Dark => R_ldr high => Node voltage rises above 2/3 Vcc or enables Pin 4 RESET (> 0.7V) to trigger alarm!
    var nodeRatio = rLdr / (pull + rLdr);
    var trigFrac = typeof thresholdFraction === 'number' ? thresholdFraction : 0.45;
    var alarmActive = nodeRatio >= trigFrac;
    return {
      rLdr: rLdr,
      nodeRatio: nodeRatio,
      alarmActive: alarmActive
    };
  }

  /**
   * Create initial simulation state for any circuit mode.
   */
  function createSimState(vcc) {
    var supply = Number(vcc) || 5;
    return {
      time: 0,
      vc: supply * 0.34,
      outputHigh: true,
      dischargeOn: false,
      monostableActive: false,
      triggerPressed: false,
      resetPressed: false,
      bistableSet: false,
      phaseTime: 0,
      history: []
    };
  }

  /**
   * Advance discrete-time 555 circuit simulation by dt seconds.
   * Modes: 'astable', 'monostable', 'bistable', 'pwm', 'fifty', 'audio', 'ldr', 'dual_flasher', 'block', 'pinout'
   */
  function stepSimulation(state, dt, params) {
    var stepDt = Math.max(0.0001, Math.min(0.05, Number(dt) || 0.016));
    var vcc = Math.max(3, Number(params.vcc) || 5);
    var vUpper = (2 / 3) * vcc;
    var vLower = (1 / 3) * vcc;
    var mode = params.mode || 'astable';
    var icType = params.icType || 'NE555';
    var voh = getOutputHighVoltage(vcc, icType);

    // Sub-step for numerical stability on fast oscillators (visual timescale clamped for readability)
    var visualSpeed = Number(params.speed) || 1;
    var subSteps = 6;
    var h = (stepDt * visualSpeed) / subSteps;

    for (var i = 0; i < subSteps; i++) {
      state.time += h;

      if (mode === 'pinout') {
        state.vc = 0;
        state.outputHigh = false;
        state.dischargeOn = false;
      } else if (mode === 'block') {
        // Controlled directly by user TRIG (active low < 1/3 Vcc) and THRES (active high > 2/3 Vcc)
        var trigLow = Boolean(params.manualTrigLow);
        var thresHigh = Boolean(params.manualThresHigh);
        var resetLow = Boolean(params.manualResetLow);
        if (resetLow) {
          state.outputHigh = false;
          state.dischargeOn = true;
        } else if (trigLow) {
          state.outputHigh = true;
          state.dischargeOn = false;
        } else if (thresHigh) {
          state.outputHigh = false;
          state.dischargeOn = true;
        }
        state.vc = thresHigh ? vcc * 0.78 : trigLow ? vcc * 0.2 : vcc * 0.5;
      } else if (mode === 'bistable') {
        if (state.resetPressed) {
          state.outputHigh = false;
          state.dischargeOn = true;
        } else if (state.triggerPressed) {
          state.outputHigh = true;
          state.dischargeOn = false;
        }
        state.vc = state.outputHigh ? vcc * 0.15 : vcc * 0.85;
      } else if (mode === 'monostable') {
        var r = Math.max(100, Number(params.r1) || 47000);
        var c = Math.max(0.0001, Number(params.c1) || 47) * 1e-6;
        // Scale fast audio/short RC slightly only if < 50ms? Keep real seconds for realistic LED timing,
        // and clamp RC >= 0.15s in monostable sliders so user visibly sees it!
        var tau = r * c;
        if (state.triggerPressed && !state.monostableActive) {
          state.monostableActive = true;
          state.outputHigh = true;
          state.dischargeOn = false;
          state.vc = 0;
        }
        if (state.monostableActive) {
          state.vc += ((vcc - state.vc) / tau) * h;
          if (state.vc >= vUpper) {
            state.vc = 0;
            state.monostableActive = false;
            state.outputHigh = false;
            state.dischargeOn = true;
          }
        } else {
          state.vc = 0;
          state.outputHigh = false;
          state.dischargeOn = true;
        }
      } else if (mode === 'pwm') {
        var pwm = calcPwmDimmer(params.r1 || 1000, params.r2 || 50000, params.potRatio || 0.5, params.c1 || 10);
        // For visual clarity when frequency is high (e.g. > 8Hz), use visual cycle rate so the waveform & LED pulse are readable
        var period = pwm.period;
        var simRate = period < 0.18 ? (0.45 / period) : 1;
        var effH = h / simRate;
        var tauC = pwm.rCharge * (Number(params.c1 || 10) * 1e-6);
        var tauD = pwm.rDischarge * (Number(params.c1 || 10) * 1e-6);
        if (state.outputHigh) {
          state.vc += ((vcc - state.vc) / tauC) * effH;
          if (state.vc >= vUpper) {
            state.vc = vUpper;
            state.outputHigh = false;
            state.dischargeOn = true;
          }
        } else {
          state.vc += ((0 - state.vc) / tauD) * effH;
          if (state.vc <= vLower) {
            state.vc = vLower;
            state.outputHigh = true;
            state.dischargeOn = false;
          }
        }
      } else if (mode === 'fifty') {
        var r50 = Math.max(100, Number(params.r2) || 47000);
        var c50 = Math.max(0.0001, Number(params.c1) || 22) * 1e-6;
        var tau50 = r50 * c50;
        var target = state.outputHigh ? voh : 0;
        state.vc += ((target - state.vc) / tau50) * h;
        if (state.outputHigh && state.vc >= vUpper) {
          state.vc = vUpper;
          state.outputHigh = false;
          state.dischargeOn = false;
        } else if (!state.outputHigh && state.vc <= vLower) {
          state.vc = vLower;
          state.outputHigh = true;
          state.dischargeOn = false;
        }
      } else if (mode === 'ldr') {
        var ldr = calcLdrDetector(params.lightPercent !== undefined ? params.lightPercent : 35, params.rPull || 22000, 0.45);
        if (!ldr.alarmActive) {
          // Held in RESET when bright
          state.outputHigh = false;
          state.dischargeOn = true;
          state.vc = Math.max(0, state.vc - (state.vc / 0.04) * h);
        } else {
          var astLdr = calcAstable(params.r1 || 10000, params.r2 || 47000, params.c1 || 10);
          var simScaleLdr = astLdr.period < 0.2 ? (0.4 / astLdr.period) : 1;
          var effHLdr = h / simScaleLdr;
          var cLdr = Math.max(0.0001, Number(params.c1) || 10) * 1e-6;
          if (state.outputHigh) {
            var tauUpL = ((Number(params.r1) || 10000) + (Number(params.r2) || 47000)) * cLdr;
            state.vc += ((vcc - state.vc) / tauUpL) * effHLdr;
            if (state.vc >= vUpper) {
              state.vc = vUpper;
              state.outputHigh = false;
              state.dischargeOn = true;
            }
          } else {
            var tauDnL = (Number(params.r2) || 47000) * cLdr;
            state.vc += ((0 - state.vc) / tauDnL) * effHLdr;
            if (state.vc <= vLower) {
              state.vc = vLower;
              state.outputHigh = true;
              state.dischargeOn = false;
            }
          }
        }
      } else {
        // Standard astable / audio / dual_flasher
        var r1 = Math.max(100, Number(params.r1) || 10000);
        var r2 = Math.max(100, Number(params.r2) || 47000);
        var cUf = Math.max(0.0001, Number(params.c1) || 10);
        var cF = cUf * 1e-6;
        var ast = calcAstable(r1, r2, cUf);
        // If audio oscillator runs at hundreds of Hz, visually normalize the scope wave to ~2.2 Hz so human eyes can inspect the RC sawtooth & square wave cleanly while true Hz is displayed!
        var simScale = ast.period < 0.16 ? (0.42 / ast.period) : 1;
        var effH = h / simScale;
        if (state.outputHigh) {
          var tauCharge = (r1 + r2) * cF;
          state.vc += ((vcc - state.vc) / tauCharge) * effH;
          if (state.vc >= vUpper) {
            state.vc = vUpper;
            state.outputHigh = false;
            state.dischargeOn = true;
          }
        } else {
          var tauDis = r2 * cF;
          state.vc += ((0 - state.vc) / tauDis) * effH;
          if (state.vc <= vLower) {
            state.vc = vLower;
            state.outputHigh = true;
            state.dischargeOn = false;
          }
        }
      }
    }

    // Record oscilloscope sample
    state.history.push({
      t: state.time,
      vc: state.vc,
      vout: state.outputHigh ? voh : 0.12
    });
    if (state.history.length > 220) {
      state.history.shift();
    }

    return state;
  }

  return {
    getResistorBands: getResistorBands,
    formatResistance: formatResistance,
    formatCapacitance: formatCapacitance,
    formatFrequency: formatFrequency,
    formatTime: formatTime,
    getOutputHighVoltage: getOutputHighVoltage,
    calcAstable: calcAstable,
    calcMonostable: calcMonostable,
    calcFiftyPercentAstable: calcFiftyPercentAstable,
    calcPwmDimmer: calcPwmDimmer,
    calcLdrDetector: calcLdrDetector,
    createSimState: createSimState,
    stepSimulation: stepSimulation
  };
}));
