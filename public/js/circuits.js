(function (root) {
  'use strict';

  var PINS = [
    { num: 1, name: 'GND', full: 'Ground (0 V)', color: '#1F242B', desc: 'Common negative return connected to battery minus / 0 V rail.' },
    { num: 2, name: 'TRIG', full: 'Trigger Input', color: '#E87722', desc: 'Active-low comparator input. Drops below 1/3 Vcc to SET Output HIGH and turn off Discharge.' },
    { num: 3, name: 'OUT', full: 'Output', color: '#2B8A57', desc: 'Push-pull output stage capable of sourcing or sinking up to 200 mA to drive LEDs, buzzers, or MOSFETs.' },
    { num: 4, name: 'RESET', full: 'Reset (Active Low)', color: '#D93829', desc: 'Overrides all inputs when pulled below 0.7 V, forcing Output LOW. Tie to Vcc when unused.' },
    { num: 5, name: 'CTRL', full: 'Control Voltage', color: '#7C48B5', desc: 'Direct access to the 2/3 Vcc reference divider. Bypass to GND with a 10 nF capacitor for noise immunity.' },
    { num: 6, name: 'THRES', full: 'Threshold Input', color: '#2667C9', desc: 'Active-high comparator input. Rises above 2/3 Vcc to RESET Output LOW and turn on Discharge.' },
    { num: 7, name: 'DISCH', full: 'Discharge (Open Collector)', color: '#D4A838', desc: 'Internal NPN transistor collector to GND. Discharges the timing capacitor when Output is LOW.' },
    { num: 8, name: 'VCC', full: 'Supply Voltage (+4.5 V to +16 V)', color: '#B91C1C', desc: 'Positive power supply rail. TLC555 CMOS works down to 2 V; NE555 needs 4.5 V–16 V.' }
  ];

  var STEPS = [
    {
      id: 'pinout',
      num: '01',
      shortTitle: 'Pinout',
      kicker: 'FOUNDATIONS · STEP 1 OF 10',
      title: 'Pinout & Parts',
      mode: 'pinout',
      subtitle: 'Step 1 · Meet the 555 IC & Parts',
      description: 'Every 555 project starts with the 8-pin DIP package and a handful of passive parts. Notch goes left, Pin 1 starts bottom-left and counts counter-clockwise to Pin 8. Hover any row or click a pin on the mat to inspect its role.',
      defaults: { vcc: 5, r1: 10000, r2: 47000, c1: 10 },
      controls: [],
      showScope: false,
      bom: [
        { id: 'ic-555', qty: '1×', text: 'NE555P or TLC555 Timer IC (DIP-8 package)', badge: 'PIN 1–8', target: 'ic' },
        { id: 'bb-400', qty: '1×', text: '400-point solderless breadboard with power rails', badge: 'MAT', target: 'breadboard' },
        { id: 'resistors', qty: '4×', text: 'Resistors: 220 Ω (LED), 10 kΩ, 47 kΩ, 100 kΩ (1/4 W)', badge: 'R1 / R2', target: 'r1' },
        { id: 'caps', qty: '3×', text: 'Capacitors: 10 nF ceramic (Pin 5), 10 µF & 47 µF electrolytic', badge: 'C1 / C2', target: 'c1' },
        { id: 'leds', qty: '2×', text: '5 mm LEDs (Red & Blue/Green) + 1N4148 steering diodes', badge: 'OUT', target: 'led1' },
        { id: 'inputs', qty: '1×', text: 'Tactile pushbuttons, 50 kΩ pot, LDR cell & 5 V piezo buzzer', badge: 'I/O', target: 'extra' }
      ],
      wires: PINS.map(function (p) {
        return {
          id: 'pin-' + p.num,
          label: p.full + ' — ' + p.desc,
          badge: 'PIN ' + p.num + ' · ' + p.name,
          color: p.color,
          pin: p.num
        };
      }),
      note: 'Always check the U-shaped notch or circular dot on the top of the chip before applying power. Reversing Pin 1 (GND) and Pin 8 (VCC) will overheat a bipolar NE555 within seconds.'
    },
    {
      id: 'block',
      num: '02',
      shortTitle: 'Inside 555',
      kicker: 'FOUNDATIONS · STEP 2 OF 10',
      title: 'Internal Architecture',
      mode: 'block',
      subtitle: 'Step 2 · Divider, Comparators & SR Flip-Flop',
      description: 'Inside the 555 are just three matched 5 kΩ resistors (which gave the chip its name), two analog comparators, an SR flip-flop, an output buffer, and one discharge NPN transistor. Toggle TRIG, THRES, and RESET below to watch the latch react live.',
      defaults: { vcc: 5, r1: 10000, r2: 47000, c1: 10, manualTrigLow: false, manualThresHigh: false, manualResetLow: false },
      controls: [
        { type: 'block-toggles' }
      ],
      showScope: false,
      wires: [
        { id: 'blk-div', label: 'Three 5 kΩ resistors divide Vcc into 2/3 Vcc (Upper) & 1/3 Vcc (Lower)', badge: '5k·5k·5k', color: '#7C48B5', target: 'divider' },
        { id: 'blk-comp-u', label: 'Upper Comparator: resets latch when Pin 6 (THRES) > 2/3 Vcc', badge: 'PIN 6', color: '#2667C9', pin: 6, target: 'comp-upper' },
        { id: 'blk-comp-l', label: 'Lower Comparator: sets latch when Pin 2 (TRIG) < 1/3 Vcc', badge: 'PIN 2', color: '#E87722', pin: 2, target: 'comp-lower' },
        { id: 'blk-ff', label: 'SR Flip-Flop holds output state between threshold crossings', badge: 'LATCH', color: '#2B8A57', target: 'flipflop' },
        { id: 'blk-disch', label: 'NPN Discharge Transistor shorts Pin 7 to GND when Output is LOW', badge: 'PIN 7', color: '#D4A838', pin: 7, target: 'discharge' },
        { id: 'blk-rst', label: 'Pin 4 RESET overrides the flip-flop immediately when pulled LOW', badge: 'PIN 4', color: '#D93829', pin: 4, target: 'flipflop' }
      ],
      note: 'Because both thresholds (1/3 Vcc and 2/3 Vcc) scale linearly with Vcc, timing periods in astable and monostable circuits remain remarkably independent of battery voltage!'
    },
    {
      id: 'astable',
      num: '03',
      shortTitle: 'Astable',
      kicker: 'CORE MODE · STEP 3 OF 10',
      title: 'Astable LED Flasher',
      mode: 'astable',
      subtitle: 'Step 3 · Self-Triggering Square Wave Oscillator',
      description: 'Tie TRIG (Pin 2) to THRES (Pin 6) and the 555 oscillates forever without external input. C1 charges through R1 + R2 until reaching 2/3 Vcc, then discharges through R2 to GND via Pin 7 until falling to 1/3 Vcc.',
      defaults: { vcc: 5, r1: 10000, r2: 47000, c1: 10 },
      controls: [
        { type: 'slider', key: 'vcc', label: 'Supply Vcc', min: 4.5, max: 12, step: 0.5, unit: 'V' },
        { type: 'slider', key: 'r1', label: 'Resistor R1', min: 1000, max: 100000, step: 1000, unit: 'Ω', format: 'R' },
        { type: 'slider', key: 'r2', label: 'Resistor R2', min: 1000, max: 100000, step: 1000, unit: 'Ω', format: 'R' },
        { type: 'slider', key: 'c1', label: 'Capacitor C1', min: 1, max: 100, step: 1, unit: 'µF', format: 'C' }
      ],
      showScope: true,
      wires: [
        { id: 'w-vcc', label: 'Pin 8 (VCC) → Red +V Power Rail', badge: 'PIN 8', color: '#D93829', pin: 8, from: [13, 'A'], to: [13, 'TOP_POS'] },
        { id: 'w-gnd', label: 'Pin 1 (GND) → Blue −GND Power Rail', badge: 'PIN 1', color: '#1F242B', pin: 1, from: [13, 'J'], to: [13, 'BOT_NEG'] },
        { id: 'w-rst', label: 'Pin 4 (RESET) → Red +V Rail (keeps chip enabled)', badge: 'PIN 4', color: '#D93829', pin: 4, from: [16, 'J'], to: [16, 'BOT_POS'] },
        { id: 'w-ctrl', label: '10 nF Bypass Cap: Pin 5 (CTRL) → Top −GND Rail', badge: 'PIN 5', color: '#7C48B5', pin: 5, component: 'c2' },
        { id: 'w-r1', label: 'R1: Red +V Rail → Pin 7 (DISCH)', badge: 'R1', color: '#E87722', pin: 7, component: 'r1' },
        { id: 'w-r2', label: 'R2: Pin 7 (DISCH) → Timing Node (Col 18)', badge: 'R2', color: '#D4A838', pin: 7, component: 'r2' },
        { id: 'w-c1', label: 'C1 (+): Timing Node (Col 18) → Top −GND Rail', badge: 'C1', color: '#2667C9', component: 'c1' },
        { id: 'w-th', label: 'Pin 6 (THRES) → Timing Node (Col 18) · Yellow jumper', badge: 'PIN 6', color: '#EAB308', pin: 6, from: [15, 'C'], to: [18, 'C'] },
        { id: 'w-bridge', label: 'Pin 6 (THRES) ↔ Pin 2 (TRIG) jumper routed around IC', badge: 'PIN 6↔2', color: '#E87722', pin: 2, from: [15, 'A'], to: [14, 'G'] },
        { id: 'w-led', label: 'Pin 3 (OUT) → 220 Ω Resistor → Red LED → −GND', badge: 'PIN 3', color: '#2B8A57', pin: 3, component: 'led1' }
      ],
      components: [
        { id: 'r1', kind: 'resistor', col1: 14, row1: 'TOP_POS', col2: 14, row2: 'B', valueKey: 'r1', label: 'R1' },
        { id: 'r2', kind: 'resistor', col1: 14, row1: 'D', col2: 18, row2: 'D', valueKey: 'r2', label: 'R2' },
        { id: 'c1', kind: 'cap-elec', col1: 18, row1: 'A', col2: 18, row2: 'TOP_NEG', valueKey: 'c1', label: 'C1' },
        { id: 'c2', kind: 'cap-ceramic', col1: 16, row1: 'A', col2: 16, row2: 'TOP_NEG', label: '10 nF' },
        { id: 'rled', kind: 'resistor', col1: 15, row1: 'I', col2: 22, row2: 'I', fixedOhms: 220, label: '220 Ω' },
        { id: 'led1', kind: 'led', col1: 22, row1: 'H', col2: 23, row2: 'H', color: '#EF4444', label: 'OUT LED' }
      ],
      extraWires: [
        { from: [23, 'J'], to: [23, 'BOT_NEG'], color: '#1F242B', parentWire: 'w-led' }
      ],
      note: 'In standard astable mode, R1 charges C1 while R2 both charges and discharges C1, so duty cycle is always > 50%. Make R2 much larger than R1 to approach a 50% square wave.'
    },
    {
      id: 'monostable',
      num: '04',
      shortTitle: 'Monostable',
      kicker: 'CORE MODE · STEP 4 OF 10',
      title: 'One-Shot Pulse Timer',
      mode: 'monostable',
      subtitle: 'Step 4 · Clean Debounced Timed Pulse',
      description: 'Press the tactile button (or Trigger button below) to pull Pin 2 briefly LOW. Output snaps HIGH for T = 1.1 × R1 × C1 while C1 charges from 0 V to 2/3 Vcc, then resets automatically—ideal for switch debouncing or porch light timers.',
      defaults: { vcc: 5, r1: 47000, r2: 10000, c1: 47 },
      controls: [
        { type: 'trigger-button', label: 'Press TRIG Button (Pin 2 → GND)' },
        { type: 'slider', key: 'r1', label: 'Timing R1', min: 10000, max: 220000, step: 5000, unit: 'Ω', format: 'R' },
        { type: 'slider', key: 'c1', label: 'Timing C1', min: 10, max: 100, step: 5, unit: 'µF', format: 'C' }
      ],
      showScope: true,
      wires: [
        { id: 'w-vcc', label: 'Pin 8 (VCC) → Red +V Rail & Pin 4 (RESET) → +V', badge: 'PIN 8/4', color: '#D93829', pin: 8, from: [13, 'A'], to: [13, 'TOP_POS'] },
        { id: 'w-gnd', label: 'Pin 1 (GND) → Blue −GND Rail', badge: 'PIN 1', color: '#1F242B', pin: 1, from: [13, 'J'], to: [13, 'BOT_NEG'] },
        { id: 'w-rpull', label: '10 kΩ Pull-up Resistor: Red +V → Pin 2 (TRIG)', badge: 'PULL-UP', color: '#E87722', pin: 2, component: 'rpull' },
        { id: 'w-btn', label: 'Tactile Switch: Pin 2 (Col 9) → Blue −GND Rail', badge: 'TRIG SW', color: '#F59E0B', pin: 2, component: 'btn1' },
        { id: 'w-r1', label: 'R1: Red +V Rail → Pin 7 (DISCH)', badge: 'R1', color: '#D4A838', pin: 7, component: 'r1' },
        { id: 'w-th', label: 'Pin 7 (DISCH) ↔ Pin 6 (THRES) tie jumper', badge: 'PIN 7↔6', color: '#2667C9', pin: 6, from: [14, 'C'], to: [15, 'C'] },
        { id: 'w-c1', label: 'C1 (+): Pin 6 (Col 15) → Top −GND Rail', badge: 'C1', color: '#2667C9', component: 'c1' },
        { id: 'w-ctrl', label: '10 nF Bypass Cap: Pin 5 (CTRL) → Top −GND Rail', badge: 'PIN 5', color: '#7C48B5', pin: 5, component: 'c2' },
        { id: 'w-led', label: 'Pin 3 (OUT) → 220 Ω → Green LED → −GND', badge: 'PIN 3', color: '#2B8A57', pin: 3, component: 'led1' }
      ],
      components: [
        { id: 'r1', kind: 'resistor', col1: 14, row1: 'TOP_POS', col2: 14, row2: 'B', valueKey: 'r1', label: 'R1' },
        { id: 'c1', kind: 'cap-elec', col1: 15, row1: 'A', col2: 15, row2: 'TOP_NEG', valueKey: 'c1', label: 'C1' },
        { id: 'c2', kind: 'cap-ceramic', col1: 16, row1: 'A', col2: 16, row2: 'TOP_NEG', label: '10 nF' },
        { id: 'rpull', kind: 'resistor', col1: 9, row1: 'BOT_POS', col2: 9, row2: 'I', fixedOhms: 10000, label: '10 kΩ' },
        { id: 'btn1', kind: 'button', col1: 9, row1: 'H', col2: 11, row2: 'H', label: 'TRIG', role: 'trigger' },
        { id: 'rled', kind: 'resistor', col1: 15, row1: 'I', col2: 22, row2: 'I', fixedOhms: 220, label: '220 Ω' },
        { id: 'led1', kind: 'led', col1: 22, row1: 'H', col2: 23, row2: 'H', color: '#10B981', label: 'PULSE LED' }
      ],
      extraWires: [
        { from: [16, 'J'], to: [16, 'BOT_POS'], color: '#D93829', parentWire: 'w-vcc' },
        { from: [9, 'G'], to: [14, 'G'], color: '#E87722', parentWire: 'w-btn' },
        { from: [11, 'J'], to: [11, 'BOT_NEG'], color: '#1F242B', parentWire: 'w-btn' },
        { from: [23, 'J'], to: [23, 'BOT_NEG'], color: '#1F242B', parentWire: 'w-led' }
      ],
      note: 'Once triggered, additional button bounces during the timing cycle are ignored—making the 555 monostable a classic hardware switch debouncer.'
    },
    {
      id: 'bistable',
      num: '05',
      shortTitle: 'Bistable',
      kicker: 'CORE MODE · STEP 5 OF 10',
      title: 'Bistable SR Latch',
      mode: 'bistable',
      subtitle: 'Step 5 · Two-Button Hardware Memory Toggle',
      description: 'Without any timing capacitor, the 555 becomes a pure SR flip-flop! Press SET (Pin 2 → GND) to latch Output HIGH indefinitely; press RESET (Pin 4 → GND) to latch Output LOW.',
      defaults: { vcc: 5, r1: 10000, r2: 10000, c1: 0.01 },
      controls: [
        { type: 'bistable-buttons' }
      ],
      showScope: true,
      wires: [
        { id: 'w-vcc', label: 'Pin 8 (VCC) → Red +V Rail & Pin 1 (GND) → Blue −GND Rail', badge: 'PWR', color: '#D93829', pin: 8, from: [13, 'A'], to: [13, 'TOP_POS'] },
        { id: 'w-th-gnd', label: 'Pin 6 (THRES) → Top −GND Rail (disables threshold reset)', badge: 'PIN 6', color: '#1F242B', pin: 6, from: [15, 'B'], to: [15, 'TOP_NEG'] },
        { id: 'w-set-r', label: '10 kΩ Pull-up on Pin 2 (TRIG) + SET tactile button to −GND', badge: 'SET (PIN 2)', color: '#E87722', pin: 2, component: 'btn1' },
        { id: 'w-rst-r', label: '10 kΩ Pull-up on Pin 4 (RESET) + RESET tactile button to −GND', badge: 'RST (PIN 4)', color: '#2667C9', pin: 4, component: 'btn2' },
        { id: 'w-ctrl', label: '10 nF Bypass Cap: Pin 5 (CTRL) → Top −GND Rail', badge: 'PIN 5', color: '#7C48B5', pin: 5, component: 'c2' },
        { id: 'w-led', label: 'Pin 3 (OUT) → 220 Ω → Amber LED → −GND', badge: 'PIN 3', color: '#2B8A57', pin: 3, component: 'led1' }
      ],
      components: [
        { id: 'c2', kind: 'cap-ceramic', col1: 16, row1: 'A', col2: 16, row2: 'TOP_NEG', label: '10 nF' },
        { id: 'rset', kind: 'resistor', col1: 9, row1: 'BOT_POS', col2: 9, row2: 'I', fixedOhms: 10000, label: '10 kΩ' },
        { id: 'btn1', kind: 'button', col1: 9, row1: 'H', col2: 11, row2: 'H', label: 'SET', role: 'trigger' },
        { id: 'rrst', kind: 'resistor', col1: 20, row1: 'BOT_POS', col2: 20, row2: 'I', fixedOhms: 10000, label: '10 kΩ' },
        { id: 'btn2', kind: 'button', col1: 18, row1: 'H', col2: 20, row2: 'H', label: 'RST', role: 'reset' },
        { id: 'rled', kind: 'resistor', col1: 15, row1: 'D', col2: 22, row2: 'D', fixedOhms: 220, label: '220 Ω' },
        { id: 'led1', kind: 'led', col1: 22, row1: 'C', col2: 23, row2: 'C', color: '#F59E0B', label: 'LATCH LED' }
      ],
      extraWires: [
        { from: [13, 'J'], to: [13, 'BOT_NEG'], color: '#1F242B', parentWire: 'w-vcc' },
        { from: [9, 'G'], to: [14, 'G'], color: '#E87722', parentWire: 'w-set-r' },
        { from: [11, 'J'], to: [11, 'BOT_NEG'], color: '#1F242B', parentWire: 'w-set-r' },
        { from: [16, 'G'], to: [20, 'G'], color: '#2667C9', parentWire: 'w-rst-r' },
        { from: [18, 'J'], to: [18, 'BOT_NEG'], color: '#1F242B', parentWire: 'w-rst-r' },
        { from: [15, 'I'], to: [15, 'C'], color: '#2B8A57', parentWire: 'w-led' },
        { from: [23, 'A'], to: [23, 'TOP_NEG'], color: '#1F242B', parentWire: 'w-led' }
      ],
      note: 'Pin 7 (DISCH) is left unconnected in bistable mode. Remember to tie Pin 6 (THRES) to GND so stray electric fields cannot accidentally reset the flip-flop.'
    },
    {
      id: 'pwm',
      num: '06',
      shortTitle: 'PWM Dimmer',
      kicker: 'APPLICATION · STEP 6 OF 10',
      title: 'PWM Motor / LED Dimmer',
      mode: 'pwm',
      subtitle: 'Step 6 · Steering Diodes & Potentiometer Control',
      description: 'Two 1N4148 diodes split the potentiometer wiper into separate charge and discharge paths. Turning the knob smoothly sweeps duty cycle from 5% to 95% while keeping total frequency nearly constant—perfect for DC motors and LED strips.',
      defaults: { vcc: 9, r1: 1000, r2: 50000, c1: 0.1, potRatio: 0.65 },
      controls: [
        { type: 'slider', key: 'potRatio', label: 'Potentiometer Duty', min: 0.05, max: 0.95, step: 0.01, unit: '%', format: 'PCT' },
        { type: 'slider', key: 'c1', label: 'Timing Cap C1', min: 0.05, max: 1, step: 0.05, unit: 'µF', format: 'C' }
      ],
      showScope: true,
      wires: [
        { id: 'w-vcc', label: 'Pin 8 (VCC) & Pin 4 (RESET) → Red +V Rail', badge: 'PIN 8/4', color: '#D93829', pin: 8, from: [13, 'A'], to: [13, 'TOP_POS'] },
        { id: 'w-gnd', label: 'Pin 1 (GND) → Blue −GND Rail', badge: 'PIN 1', color: '#1F242B', pin: 1, from: [13, 'J'], to: [13, 'BOT_NEG'] },
        { id: 'w-r1', label: '1 kΩ Safety Resistor: Red +V → Pin 7 (DISCH)', badge: 'R1 · 1k', color: '#E87722', pin: 7, component: 'r1' },
        { id: 'w-pot', label: '50 kΩ Potentiometer outer legs → D1 & D2 steering diodes', badge: 'POT 50k', color: '#D4A838', component: 'pot1' },
        { id: 'w-diodes', label: '1N4148 D1 (charge) & D2 (discharge) steer current to wiper', badge: 'D1 / D2', color: '#0EA5E9', component: 'd1' },
        { id: 'w-c1', label: 'C1: Pot Wiper / Pin 6 / Pin 2 node → −GND Rail', badge: 'C1', color: '#2667C9', component: 'c1' },
        { id: 'w-led', label: 'Pin 3 (OUT) → 330 Ω → High-Bright Cyan LED → −GND', badge: 'PIN 3', color: '#2B8A57', pin: 3, component: 'led1' }
      ],
      components: [
        { id: 'r1', kind: 'resistor', col1: 14, row1: 'TOP_POS', col2: 14, row2: 'B', fixedOhms: 1000, label: '1 kΩ' },
        { id: 'd1', kind: 'diode', col1: 14, row1: 'C', col2: 18, row2: 'C', label: 'D1' },
        { id: 'd2', kind: 'diode', col1: 20, row1: 'C', col2: 14, row2: 'D', label: 'D2', reverse: true },
        { id: 'pot1', kind: 'pot', col1: 18, row1: 'B', col2: 20, row2: 'B', wiperCol: 19, label: '50 kΩ POT' },
        { id: 'c1', kind: 'cap-ceramic', col1: 21, row1: 'B', col2: 21, row2: 'TOP_NEG', label: '100 nF' },
        { id: 'c2', kind: 'cap-ceramic', col1: 16, row1: 'A', col2: 16, row2: 'TOP_NEG', label: '10 nF' },
        { id: 'rled', kind: 'resistor', col1: 15, row1: 'I', col2: 23, row2: 'I', fixedOhms: 330, label: '330 Ω' },
        { id: 'led1', kind: 'led', col1: 23, row1: 'H', col2: 24, row2: 'H', color: '#06B6D4', label: 'PWM LED' }
      ],
      extraWires: [
        { from: [16, 'J'], to: [16, 'BOT_POS'], color: '#D93829', parentWire: 'w-vcc' },
        { from: [19, 'D'], to: [21, 'C'], color: '#D4A838', parentWire: 'w-pot' },
        { from: [15, 'A'], to: [21, 'A'], color: '#2667C9', parentWire: 'w-c1' },
        { from: [15, 'B'], to: [14, 'G'], color: '#E87722', parentWire: 'w-c1' },
        { from: [24, 'J'], to: [24, 'BOT_NEG'], color: '#1F242B', parentWire: 'w-led' }
      ],
      note: 'To drive a heavier DC motor instead of an LED, feed Pin 3 through a 100 Ω gate resistor into an N-channel logic-level MOSFET (like IRLZ44N) with a flyback diode across the motor.'
    },
    {
      id: 'fifty',
      num: '07',
      shortTitle: '50% Clock',
      kicker: 'APPLICATION · STEP 7 OF 10',
      title: 'Precision 50% Duty Clock',
      mode: 'fifty',
      subtitle: 'Step 7 · Symmetric Output-Feedback Oscillator',
      description: 'Instead of charging from Vcc through R1, connect R2 directly from Pin 3 (OUT) to C1! Because the capacitor both charges and discharges through the exact same resistor R2, the output becomes a balanced 50/50 square wave.',
      defaults: { vcc: 5, r1: 0, r2: 47000, c1: 22 },
      controls: [
        { type: 'slider', key: 'r2', label: 'Feedback R2', min: 2200, max: 150000, step: 1000, unit: 'Ω', format: 'R' },
        { type: 'slider', key: 'c1', label: 'Capacitor C1', min: 1, max: 100, step: 1, unit: 'µF', format: 'C' }
      ],
      showScope: true,
      wires: [
        { id: 'w-vcc', label: 'Pin 8 (VCC) & Pin 4 (RESET) → Red +V Rail', badge: 'PIN 8/4', color: '#D93829', pin: 8, from: [13, 'A'], to: [13, 'TOP_POS'] },
        { id: 'w-gnd', label: 'Pin 1 (GND) → Blue −GND Rail', badge: 'PIN 1', color: '#1F242B', pin: 1, from: [13, 'J'], to: [13, 'BOT_NEG'] },
        { id: 'w-fb', label: 'R2 Feedback: Pin 3 (OUT) → Timing Node (Col 19)', badge: 'PIN 3→R2', color: '#D4A838', pin: 3, component: 'r2' },
        { id: 'w-c1', label: 'C1 (+): Timing Node (Col 19) → −GND Rail', badge: 'C1', color: '#2667C9', component: 'c1' },
        { id: 'w-sense', label: 'Pin 6 (THRES) & Pin 2 (TRIG) sense C1 voltage (Pin 7 unused)', badge: 'PIN 6↔2', color: '#E87722', pin: 6, from: [15, 'B'], to: [19, 'B'] },
        { id: 'w-led', label: 'Pin 3 (OUT) → 220 Ω → Clock LED → −GND', badge: 'CLK LED', color: '#2B8A57', pin: 3, component: 'led1' }
      ],
      components: [
        { id: 'r2', kind: 'resistor', col1: 15, row1: 'H', col2: 19, row2: 'H', valueKey: 'r2', label: 'R2' },
        { id: 'c1', kind: 'cap-elec', col1: 19, row1: 'A', col2: 19, row2: 'TOP_NEG', valueKey: 'c1', label: 'C1' },
        { id: 'c2', kind: 'cap-ceramic', col1: 16, row1: 'A', col2: 16, row2: 'TOP_NEG', label: '10 nF' },
        { id: 'rled', kind: 'resistor', col1: 15, row1: 'I', col2: 23, row2: 'I', fixedOhms: 220, label: '220 Ω' },
        { id: 'led1', kind: 'led', col1: 23, row1: 'H', col2: 24, row2: 'H', color: '#3B82F6', label: 'CLK LED' }
      ],
      extraWires: [
        { from: [16, 'J'], to: [16, 'BOT_POS'], color: '#D93829', parentWire: 'w-vcc' },
        { from: [19, 'G'], to: [19, 'C'], color: '#D4A838', parentWire: 'w-fb' },
        { from: [15, 'A'], to: [14, 'G'], color: '#E87722', parentWire: 'w-sense' },
        { from: [24, 'J'], to: [24, 'BOT_NEG'], color: '#1F242B', parentWire: 'w-led' }
      ],
      note: 'Switch the top IC selector between NE555 and TLC555! Notice that on a bipolar NE555, output high saturates ~1.4 V below Vcc, slightly skewing symmetry unless you use a CMOS TLC555.'
    },
    {
      id: 'audio',
      num: '08',
      shortTitle: 'Audio Tone',
      kicker: 'APPLICATION · STEP 8 OF 10',
      title: 'Piezo Tone Oscillator',
      mode: 'audio',
      subtitle: 'Step 8 · Audible Square-Wave Synthesizer',
      description: 'Swap the big electrolytic capacitor for a 100 nF ceramic cap and the 555 jumps into the audio band (200 Hz–2 kHz). Click the Audio speaker button on the workbench to hear the live pitch change as you sweep R2.',
      defaults: { vcc: 5, r1: 4700, r2: 12000, c1: 0.1 },
      controls: [
        { type: 'slider', key: 'r2', label: 'Pitch Resistor R2', min: 2000, max: 47000, step: 500, unit: 'Ω', format: 'R' },
        { type: 'slider', key: 'c1', label: 'Tone Cap C1', min: 0.02, max: 0.47, step: 0.01, unit: 'µF', format: 'C' }
      ],
      showScope: true,
      wires: [
        { id: 'w-vcc', label: 'Pin 8 (VCC) & Pin 4 (RESET) → Red +V Rail', badge: 'PIN 8/4', color: '#D93829', pin: 8, from: [13, 'A'], to: [13, 'TOP_POS'] },
        { id: 'w-gnd', label: 'Pin 1 (GND) → Blue −GND Rail', badge: 'PIN 1', color: '#1F242B', pin: 1, from: [13, 'J'], to: [13, 'BOT_NEG'] },
        { id: 'w-r1', label: 'R1 (4.7 kΩ): Red +V → Pin 7 (DISCH)', badge: 'R1', color: '#E87722', pin: 7, component: 'r1' },
        { id: 'w-r2', label: 'Pitch R2: Pin 7 (DISCH) → Timing Node (Col 18)', badge: 'R2 PITCH', color: '#D4A838', component: 'r2' },
        { id: 'w-c1', label: '100 nF Film/Ceramic Cap C1: Col 18 → −GND Rail', badge: 'C1', color: '#2667C9', component: 'c1' },
        { id: 'w-spkr', label: 'Pin 3 (OUT) → 100 Ω → Piezo Buzzer / 8 Ω Speaker → −GND', badge: 'BUZZER', color: '#2B8A57', pin: 3, component: 'buzzer1' }
      ],
      components: [
        { id: 'r1', kind: 'resistor', col1: 14, row1: 'TOP_POS', col2: 14, row2: 'B', valueKey: 'r1', label: 'R1' },
        { id: 'r2', kind: 'resistor', col1: 14, row1: 'D', col2: 18, row2: 'D', valueKey: 'r2', label: 'R2' },
        { id: 'c1', kind: 'cap-ceramic', col1: 18, row1: 'A', col2: 18, row2: 'TOP_NEG', label: '100 nF' },
        { id: 'c2', kind: 'cap-ceramic', col1: 16, row1: 'A', col2: 16, row2: 'TOP_NEG', label: '10 nF' },
        { id: 'rout', kind: 'resistor', col1: 15, row1: 'I', col2: 21, row2: 'I', fixedOhms: 100, label: '100 Ω' },
        { id: 'buzzer1', kind: 'buzzer', col1: 21, row1: 'G', col2: 24, row2: 'G', label: 'PIEZO' }
      ],
      extraWires: [
        { from: [16, 'J'], to: [16, 'BOT_POS'], color: '#D93829', parentWire: 'w-vcc' },
        { from: [15, 'C'], to: [18, 'C'], color: '#EAB308', parentWire: 'w-r2' },
        { from: [15, 'A'], to: [14, 'G'], color: '#E87722', parentWire: 'w-r2' },
        { from: [24, 'J'], to: [24, 'BOT_NEG'], color: '#1F242B', parentWire: 'w-spkr' }
      ],
      note: 'Two of these audio oscillators chained together (with the first Pin 3 modulating the second Pin 5 CTRL) form the legendary Atari Punk Console!'
    },
    {
      id: 'ldr',
      num: '09',
      shortTitle: 'Light Alarm',
      kicker: 'APPLICATION · STEP 9 OF 10',
      title: 'Darkness-Activated Alarm',
      mode: 'ldr',
      subtitle: 'Step 9 · Photoresistor Gated Reset Circuit',
      description: 'A CdS photoresistor (LDR) and 22 kΩ resistor form a light-sensing voltage divider wired straight into Pin 4 (RESET). In daylight the voltage stays below 0.7 V, silencing the alarm; cover the LDR and Pin 4 rises, unleashing the pulsed alert.',
      defaults: { vcc: 5, r1: 10000, r2: 47000, c1: 10, rPull: 22000, lightPercent: 25 },
      controls: [
        { type: 'slider', key: 'lightPercent', label: 'Ambient Light', min: 0, max: 100, step: 1, unit: '%', format: 'LIGHT' },
        { type: 'slider', key: 'rPull', label: 'Sensitivity R_pull', min: 4700, max: 100000, step: 1000, unit: 'Ω', format: 'R' }
      ],
      showScope: true,
      wires: [
        { id: 'w-vcc', label: 'Pin 8 (VCC) → Red +V Rail & Pin 1 (GND) → Blue −GND Rail', badge: 'PWR', color: '#D93829', pin: 8, from: [13, 'A'], to: [13, 'TOP_POS'] },
        { id: 'w-ldr', label: 'LDR Photoresistor: Red +V → Sensor Node (Col 19) → Pin 4 (RESET)', badge: 'LDR → P4', color: '#F59E0B', pin: 4, component: 'ldr1' },
        { id: 'w-rpull', label: '22 kΩ Divider Resistor: Sensor Node (Col 19) → Blue −GND', badge: 'R_PULL', color: '#7C48B5', component: 'rpull' },
        { id: 'w-ast', label: 'Astable Timing Network (R1, R2, C1) pulses alert rate', badge: 'R1/R2/C1', color: '#2667C9', component: 'r2' },
        { id: 'w-out', label: 'Pin 3 (OUT) → 220 Ω → Alarm LED + Piezo → −GND', badge: 'ALARM OUT', color: '#2B8A57', pin: 3, component: 'led1' }
      ],
      components: [
        { id: 'r1', kind: 'resistor', col1: 14, row1: 'TOP_POS', col2: 14, row2: 'B', valueKey: 'r1', label: 'R1' },
        { id: 'r2', kind: 'resistor', col1: 14, row1: 'D', col2: 18, row2: 'D', valueKey: 'r2', label: 'R2' },
        { id: 'c1', kind: 'cap-elec', col1: 18, row1: 'A', col2: 18, row2: 'TOP_NEG', valueKey: 'c1', label: 'C1' },
        { id: 'ldr1', kind: 'ldr', col1: 19, row1: 'H', col2: 19, row2: 'BOT_POS', label: 'CdS LDR' },
        { id: 'rpull', kind: 'resistor', col1: 19, row1: 'I', col2: 19, row2: 'BOT_NEG', valueKey: 'rPull', label: 'R_pull' },
        { id: 'rled', kind: 'resistor', col1: 15, row1: 'I', col2: 23, row2: 'I', fixedOhms: 220, label: '220 Ω' },
        { id: 'led1', kind: 'led', col1: 23, row1: 'H', col2: 24, row2: 'H', color: '#EF4444', label: 'ALERT LED' }
      ],
      extraWires: [
        { from: [13, 'J'], to: [13, 'BOT_NEG'], color: '#1F242B', parentWire: 'w-vcc' },
        { from: [16, 'G'], to: [19, 'G'], color: '#F59E0B', parentWire: 'w-ldr' },
        { from: [15, 'C'], to: [18, 'C'], color: '#EAB308', parentWire: 'w-ast' },
        { from: [15, 'A'], to: [14, 'G'], color: '#E87722', parentWire: 'w-ast' },
        { from: [24, 'J'], to: [24, 'BOT_NEG'], color: '#1F242B', parentWire: 'w-out' }
      ],
      note: 'Drag the Ambient Light slider below 45% to trip the darkness threshold. Swap the LDR and R_pull positions to invert the logic into a sunlight-activated alarm.'
    },
    {
      id: 'dual_flasher',
      num: '10',
      shortTitle: 'Dual Flasher',
      kicker: 'APPLICATION · STEP 10 OF 10',
      title: 'Alternating Dual-LED Flasher',
      mode: 'dual_flasher',
      subtitle: 'Step 10 · Sourcing & Sinking Push-Pull Output',
      description: 'Because Pin 3 both sources current (when HIGH) and sinks current (when LOW), wiring one LED from +V into Pin 3 and another from Pin 3 to −GND makes Red and Blue blink in crisp opposition—just like a railroad crossing.',
      defaults: { vcc: 5, r1: 4700, r2: 47000, c1: 10 },
      controls: [
        { type: 'slider', key: 'r2', label: 'Flash Speed R2', min: 10000, max: 100000, step: 2000, unit: 'Ω', format: 'R' },
        { type: 'slider', key: 'c1', label: 'Capacitor C1', min: 2, max: 47, step: 1, unit: 'µF', format: 'C' }
      ],
      showScope: true,
      wires: [
        { id: 'w-vcc', label: 'Pin 8 (VCC) & Pin 4 (RESET) → Red +V Rail', badge: 'PIN 8/4', color: '#D93829', pin: 8, from: [13, 'A'], to: [13, 'TOP_POS'] },
        { id: 'w-gnd', label: 'Pin 1 (GND) → Blue −GND Rail', badge: 'PIN 1', color: '#1F242B', pin: 1, from: [13, 'J'], to: [13, 'BOT_NEG'] },
        { id: 'w-ast', label: 'Astable Network (R1 4.7 kΩ, R2, C1) drives ~1.5 Hz beat', badge: 'TIMING', color: '#D4A838', component: 'r2' },
        { id: 'w-led1', label: 'Source LED (Red): Pin 3 (OUT) → 220 Ω → Anode → −GND (lit when HIGH)', badge: 'SOURCE RED', color: '#EF4444', pin: 3, component: 'led1' },
        { id: 'w-led2', label: 'Sink LED (Blue): Red +V → 220 Ω → Anode → Cathode → Pin 3 (lit when LOW)', badge: 'SINK BLUE', color: '#3B82F6', pin: 3, component: 'led2' }
      ],
      components: [
        { id: 'r1', kind: 'resistor', col1: 14, row1: 'TOP_POS', col2: 14, row2: 'B', valueKey: 'r1', label: 'R1' },
        { id: 'r2', kind: 'resistor', col1: 14, row1: 'D', col2: 18, row2: 'D', valueKey: 'r2', label: 'R2' },
        { id: 'c1', kind: 'cap-elec', col1: 18, row1: 'A', col2: 18, row2: 'TOP_NEG', valueKey: 'c1', label: 'C1' },
        { id: 'c2', kind: 'cap-ceramic', col1: 16, row1: 'A', col2: 16, row2: 'TOP_NEG', label: '10 nF' },
        { id: 'rled1', kind: 'resistor', col1: 15, row1: 'I', col2: 22, row2: 'I', fixedOhms: 220, label: '220 Ω' },
        { id: 'led1', kind: 'led', col1: 22, row1: 'H', col2: 23, row2: 'H', color: '#EF4444', label: 'RED (HIGH)' },
        { id: 'rled2', kind: 'resistor', col1: 26, row1: 'BOT_POS', col2: 26, row2: 'F', fixedOhms: 220, label: '220 Ω' },
        { id: 'led2', kind: 'led', col1: 26, row1: 'G', col2: 25, row2: 'G', color: '#3B82F6', label: 'BLUE (LOW)', sinkLed: true }
      ],
      extraWires: [
        { from: [16, 'J'], to: [16, 'BOT_POS'], color: '#D93829', parentWire: 'w-vcc' },
        { from: [15, 'C'], to: [18, 'C'], color: '#EAB308', parentWire: 'w-ast' },
        { from: [15, 'A'], to: [14, 'G'], color: '#E87722', parentWire: 'w-ast' },
        { from: [23, 'J'], to: [23, 'BOT_NEG'], color: '#1F242B', parentWire: 'w-led1' },
        { from: [25, 'J'], to: [15, 'J'], color: '#3B82F6', parentWire: 'w-led2' }
      ],
      note: 'Each LED needs its own 220 Ω current-limiting resistor! Sharing one resistor between both LEDs can cause subtle leakage glow depending on supply voltage.'
    }
  ];

  root.Circuits555 = {
    PINS: PINS,
    STEPS: STEPS
  };
}(typeof self !== 'undefined' ? self : this));
