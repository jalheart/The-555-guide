import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Math555 = require('../public/js/math555.js');

test('calcAstable computes accurate timing and duty cycle for R1=10k, R2=47k, C=10uF', () => {
  const res = Math555.calcAstable(10000, 47000, 10);
  // tHigh = ln(2)*(57k)*(10uF) ≈ 0.3951s
  // tLow  = ln(2)*(47k)*(10uF) ≈ 0.3258s
  assert.ok(Math.abs(res.tHigh - 0.3951) < 0.002);
  assert.ok(Math.abs(res.tLow - 0.3258) < 0.002);
  assert.ok(Math.abs(res.freq - 1.387) < 0.01);
  assert.ok(res.duty > 54 && res.duty < 56);
});

test('calcMonostable follows T = 1.1 * R * C', () => {
  const res = Math555.calcMonostable(47000, 47);
  // 1.1 * 47000 * 47e-6 = 2.4299 s
  assert.ok(Math.abs(res.pulseWidth - 2.4299) < 0.001);
});

test('calcFiftyPercentAstable outputs exact 50% duty cycle', () => {
  const res = Math555.calcFiftyPercentAstable(47000, 22);
  assert.equal(res.duty, 50);
  assert.ok(Math.abs(res.tHigh - res.tLow) < 1e-9);
});

test('calcPwmDimmer sweeps duty cycle smoothly with potentiometer ratio', () => {
  const low = Math555.calcPwmDimmer(1000, 50000, 0.1, 0.1);
  const high = Math555.calcPwmDimmer(1000, 50000, 0.9, 0.1);
  assert.ok(low.duty < 15);
  assert.ok(high.duty > 85);
});

test('calcLdrDetector activates alarm in darkness and silences in bright light', () => {
  const dark = Math555.calcLdrDetector(10, 22000, 0.45);
  const bright = Math555.calcLdrDetector(90, 22000, 0.45);
  assert.equal(dark.alarmActive, true);
  assert.equal(bright.alarmActive, false);
});

test('getResistorBands produces accurate EIA 4-band colors', () => {
  // 220 Ohm -> Red, Red, Brown, Gold
  const b220 = Math555.getResistorBands(220);
  assert.deepEqual(
    b220.map((b: { name: string }) => b.name),
    ['Red', 'Red', 'Brown', 'Gold']
  );

  // 47 kOhm -> Yellow, Violet, Orange, Gold
  const b47k = Math555.getResistorBands(47000);
  assert.deepEqual(
    b47k.map((b: { name: string }) => b.name),
    ['Yellow', 'Violet', 'Orange', 'Gold']
  );
});

test('stepSimulation flips astable output at 2/3 Vcc and 1/3 Vcc thresholds', () => {
  const sim = Math555.createSimState(5);
  sim.vc = 1.7;
  sim.outputHigh = true;
  const params = { mode: 'astable', vcc: 5, r1: 1000, r2: 1000, c1: 10, speed: 1, icType: 'NE555' };

  let sawHigh = false;
  let sawLow = false;
  for (let i = 0; i < 60; i++) {
    Math555.stepSimulation(sim, 0.02, params);
    if (sim.outputHigh) sawHigh = true;
    else sawLow = true;
  }
  assert.equal(sawHigh, true);
  assert.equal(sawLow, true);
  assert.ok(sim.history.length > 10);
});

test('stepSimulation monostable triggers on pulse and settles back to idle', () => {
  const sim = Math555.createSimState(5);
  sim.outputHigh = false;
  sim.vc = 0;
  const params = { mode: 'monostable', vcc: 5, r1: 1000, c1: 10, speed: 1, icType: 'NE555' };

  sim.triggerPressed = true;
  Math555.stepSimulation(sim, 0.002, params);
  sim.triggerPressed = false;
  assert.equal(sim.outputHigh, true);

  // Advance past 1.1 * 1k * 10uF = 11ms
  for (let i = 0; i < 10; i++) {
    Math555.stepSimulation(sim, 0.01, params);
  }
  assert.equal(sim.outputHigh, false);
});

test('formatters format resistance, capacitance, frequency, and time cleanly', () => {
  assert.equal(Math555.formatResistance(47000), '47 kΩ');
  assert.equal(Math555.formatResistance(10000), '10 kΩ');
  assert.equal(Math555.formatResistance(1000000), '1 MΩ');
  assert.equal(Math555.formatResistance(220), '220 Ω');
  assert.equal(Math555.formatCapacitance(0.1), '100 nF');
  assert.equal(Math555.formatCapacitance(10), '10 µF');
  assert.equal(Math555.formatCapacitance(100), '100 µF');
  assert.equal(Math555.formatCapacitance(47), '47 µF');
  assert.equal(Math555.formatFrequency(1500), '1.50 kHz');
  assert.equal(Math555.formatTime(0.025), '25.0 ms');
});

test('all breadboard circuits have zero duplicate holes and keep DIP-8 IC leg holes clear', () => {
  const code = fs.readFileSync(new URL('../public/js/circuits.js', import.meta.url), 'utf8');
  const sandbox: { self?: unknown; Circuits555?: { STEPS: Array<any> } } = {};
  sandbox.self = sandbox;
  vm.runInNewContext(code, sandbox);
  const Circuits555 = sandbox.Circuits555!;
  assert.ok(Array.isArray(Circuits555.STEPS) && Circuits555.STEPS.length === 10);

  for (const step of Circuits555.STEPS) {
    if (!step.components || step.components.length === 0) continue;

    const occupied = new Map<string, string>();
    const claim = (col: number, row: string, owner: string) => {
      const key = `${col}:${row}`;
      assert.equal(
        occupied.has(key),
        false,
        `Step "${step.id}" hole ${key} collision between "${occupied.get(key)}" and "${owner}"`
      );
      occupied.set(key, owner);
    };

    // Reserve DIP-8 555 IC legs at cols 13..16, rows E and F
    for (let col = 13; col <= 16; col++) {
      claim(col, 'E', `IC-top-${col}`);
      claim(col, 'F', `IC-bot-${col}`);
    }

    for (const w of step.wires || []) {
      if (w.from) claim(w.from[0], w.from[1], `wire:${w.id}:from`);
      if (w.to) claim(w.to[0], w.to[1], `wire:${w.id}:to`);
    }

    for (let i = 0; i < (step.extraWires || []).length; i++) {
      const ex = step.extraWires[i];
      claim(ex.from[0], ex.from[1], `extraWire[${i}]:from`);
      claim(ex.to[0], ex.to[1], `extraWire[${i}]:to`);
    }

    for (const comp of step.components) {
      claim(comp.col1, comp.row1, `comp:${comp.id}:1`);
      claim(comp.col2, comp.row2, `comp:${comp.id}:2`);
      if (typeof comp.wiperCol === 'number') {
        claim(comp.wiperCol, comp.row1, `comp:${comp.id}:wiper`);
      }
    }
  }
});

