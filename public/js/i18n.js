(function (root) {
  'use strict';

  var STRINGS = {
    en: {
      workbench: 'WORKBENCH',
      view3d: '3D View',
      viewSchematic: 'Schematic',
      saveOffline: 'Save Offline',
      saveOfflineTitle: 'Save a single self-contained HTML file that runs without a server on any device',
      navPinout: 'Pinout',
      navInside: 'Inside 555',
      navAstable: 'Astable',
      navMonostable: 'Monostable',
      navApps: 'Applications',
      liveScopeHeading: 'LIVE OSCILLOSCOPE & MATH',
      controlsHeading: 'INTERACTIVE CONTROLS',
      bomHeading: 'BILL OF MATERIALS',
      pinoutMapHeading: 'DIP-8 PINOUT MAP',
      wiringMapHeading: 'WIRING & PIN MAP',
      hoverToTrace: 'Hover to trace',
      clickToInspect: 'Click part for details',
      noteLabel: 'Note',
      backBtn: '← Back',
      stepsHint: 'steps',
      nextPrefix: 'Next: ',
      restartPinout: 'Restart: Pinout ↺',
      selectedPartKicker: 'SELECTED PART',
      closePartBtn: 'All Parts ×',
      specPackage: 'Package / Type',
      specRatings: 'Key Specs',
      specPolarity: 'Polarity / Pinout',
      specRole: 'Role in 555 Circuits',
      probeHoverDefault: 'Hover a wire, pin, or component',
      probeSupply: 'supply',
      probeHigh: 'HIGH',
      probeLow: 'LOW',
      probeSelected: 'Selected Trace',
      probePart: 'PART',
      setBtn: 'Press SET (Pin 2 → 0V)',
      rstBtn: 'Press RESET (Pin 4 → 0V)',
      blockTrig: 'TRIG < ⅓Vcc (SET)',
      blockThres: 'THRES > ⅔Vcc (RST)',
      blockReset: 'PIN 4 RESET = 0V',
      toastTrig: 'TRIG pulsed LOW — One-shot timer started',
      toastSet: 'SET latched Pin 3 HIGH',
      toastReset: 'RESET latched Pin 3 LOW',
      toastAudioOn: 'Web Audio output enabled',
      toastAudioOff: 'Audio muted',
      toastOfflineSaved: 'Downloaded 555kit-offline.html — works offline with no server',
      toastOfflineFile: 'Saved portable offline copy',
      toastOfflineErr: 'Offline bundle available when opened from web host',
      toastLangEs: 'Idioma cambiado a Español',
      toastLangEn: 'Language switched to English',
      toastThemeDark: 'Dark theme enabled',
      toastThemeLight: 'Light theme enabled',
      toastNoBuzzer: 'This circuit has no buzzer — try Step 8 (Audio Tone) to hear sound',
      hudAudioDisabled: 'Audio available only on circuits with a buzzer (Step 8)',
      hudAudioToggle: 'Toggle piezo buzzer audio',
      themeToDark: 'Switch to dark theme',
      themeToLight: 'Switch to light theme',
      modalClose: 'Close',
      hudPause: 'Pause simulation',
      hudResume: 'Resume simulation',
      hudExplode: 'Exploded view (E)',
      hudLabels: 'Toggle IC pin numbers',
      hudReset: 'Reset view',
      hudZoomIn: 'Zoom in',
      hudZoomOut: 'Zoom out',
      metrics: {
        'Pulse Width': 'Pulse Width',
        'Formula': 'Formula',
        'Threshold': 'Threshold',
        'State': 'State',
        'Latch Output': 'Latch Output',
        'Pin 3 Voltage': 'Pin 3 Voltage',
        'Mode': 'Mode',
        'Capacitor': 'Capacitor',
        'Duty Cycle': 'Duty Cycle',
        'Frequency': 'Frequency',
        'T High': 'T High',
        'T Low': 'T Low',
        'Period': 'Period',
        'Half Cycle': 'Half Cycle',
        'Alarm Status': 'Alarm Status',
        'LDR Ohms': 'LDR Ohms',
        'Pin 4 Ratio': 'Pin 4 Ratio',
        'Pulse Rate': 'Pulse Rate',
        'HIGH': 'HIGH',
        'IDLE': 'IDLE',
        'ACTIVE': 'ACTIVE',
        'STANDBY': 'STANDBY',
        'HIGH (SET)': 'HIGH (SET)',
        'LOW (RESET)': 'LOW (RESET)',
        'SR Flip-Flop': 'SR Flip-Flop',
        'None': 'None'
      },
      labels3d: {
        '400-pt breadboard': '400-pt breadboard',
        'timer IC': 'timer IC',
        '1/4W resistors (220Ω · 10k · 47k)': '1/4W resistors (220Ω · 10k · 47k)',
        '10µF & 10nF caps': '10µF & 10nF caps',
        'LEDs & 1N4148 diode': 'LEDs & 1N4148 diode',
        'Switch · Pot · LDR · Piezo': 'Switch · Pot · LDR · Piezo',
        'OUT LED': 'OUT LED',
        'TRIG': 'TRIG',
        'PULSE LED': 'PULSE LED',
        'SET': 'SET',
        'RST': 'RST',
        'LATCH LED': 'LATCH LED',
        '50 kΩ POT': '50 kΩ POT',
        'PWM LED': 'PWM LED',
        'CLK LED': 'CLK LED',
        'PIEZO': 'PIEZO',
        'CdS LDR': 'CdS LDR',
        'ALERT LED': 'ALERT LED',
        'RED (HIGH)': 'RED (HIGH)',
        'BLUE (LOW)': 'BLUE (LOW)'
      }
    },
    es: {
      workbench: 'MESA DE TRABAJO',
      view3d: 'Vista 3D',
      viewSchematic: 'Esquema',
      saveOffline: 'Guardar Offline',
      saveOfflineTitle: 'Descarga un archivo HTML autónomo que funciona sin servidor en cualquier dispositivo',
      navPinout: 'Pines',
      navInside: 'Interior 555',
      navAstable: 'Astable',
      navMonostable: 'Monoestable',
      navApps: 'Aplicaciones',
      liveScopeHeading: 'OSCILOSCOPIO Y CÁLCULO EN VIVO',
      controlsHeading: 'CONTROLES INTERACTIVOS',
      bomHeading: 'LISTA DE COMPONENTES',
      pinoutMapHeading: 'MAPA DE PINES DIP-8',
      wiringMapHeading: 'CONEXIONES Y PINES',
      hoverToTrace: 'Pasa el cursor',
      clickToInspect: 'Clic para inspeccionar',
      noteLabel: 'Nota técnica',
      backBtn: '← Anterior',
      stepsHint: 'pasos',
      nextPrefix: 'Siguiente: ',
      restartPinout: 'Reiniciar: Pines ↺',
      selectedPartKicker: 'COMPONENTE SELECCIONADO',
      closePartBtn: 'Ver todos ×',
      specPackage: 'Encapsulado / Tipo',
      specRatings: 'Especificaciones',
      specPolarity: 'Polaridad / Pines',
      specRole: 'Función en el 555',
      probeHoverDefault: 'Pasa sobre un cable, pin o componente',
      probeSupply: 'alimentación',
      probeHigh: 'ALTO',
      probeLow: 'BAJO',
      probeSelected: 'Traza seleccionada',
      probePart: 'PIEZA',
      setBtn: 'Pulsar SET (Pin 2 → 0V)',
      rstBtn: 'Pulsar RESET (Pin 4 → 0V)',
      blockTrig: 'TRIG < ⅓Vcc (SET)',
      blockThres: 'THRES > ⅔Vcc (RST)',
      blockReset: 'PIN 4 RESET = 0V',
      toastTrig: 'TRIG pulsado a 0V — Temporizador iniciado',
      toastSet: 'SET enclavó el Pin 3 en ALTO',
      toastReset: 'RESET puso el Pin 3 en BAJO',
      toastAudioOn: 'Salida de audio Web activada',
      toastAudioOff: 'Audio silenciado',
      toastOfflineSaved: 'Descargado 555kit-offline.html — funciona sin servidor',
      toastOfflineFile: 'Copia offline guardada',
      toastOfflineErr: 'Descarga disponible al abrir desde servidor web',
      toastLangEs: 'Idioma cambiado a Español',
      toastLangEn: 'Language switched to English',
      toastThemeDark: 'Tema oscuro activado',
      toastThemeLight: 'Tema claro activado',
      toastNoBuzzer: 'Este circuito no tiene zumbador — ve al Paso 8 (Tono Audio) para escuchar sonido',
      hudAudioDisabled: 'Audio disponible solo en circuitos con zumbador (Paso 8)',
      hudAudioToggle: 'Activar/silenciar zumbador piezo',
      themeToDark: 'Cambiar a tema oscuro',
      themeToLight: 'Cambiar a tema claro',
      modalClose: 'Cerrar',
      hudPause: 'Pausar simulación',
      hudResume: 'Reanudar simulación',
      hudExplode: 'Vista explosionada (E)',
      hudLabels: 'Mostrar/ocultar números de pines',
      hudReset: 'Restablecer vista',
      hudZoomIn: 'Acercar',
      hudZoomOut: 'Alejar',
      metrics: {
        'Pulse Width': 'Ancho de Pulso',
        'Formula': 'Fórmula',
        'Threshold': 'Umbral',
        'State': 'Estado',
        'Latch Output': 'Salida Latch',
        'Pin 3 Voltage': 'Voltaje Pin 3',
        'Mode': 'Modo',
        'Capacitor': 'Condensador',
        'Duty Cycle': 'Ciclo de Trabajo',
        'Frequency': 'Frecuencia',
        'T High': 'Tiempo Alto',
        'T Low': 'Tiempo Bajo',
        'Period': 'Período',
        'Half Cycle': 'Semiciclo',
        'Alarm Status': 'Estado Alarma',
        'LDR Ohms': 'Resistencia LDR',
        'Pin 4 Ratio': 'Nivel Pin 4',
        'Pulse Rate': 'Tasa de Pulsos',
        'HIGH': 'ALTO',
        'IDLE': 'REPOSO',
        'ACTIVE': 'ACTIVA',
        'STANDBY': 'ESPERA',
        'HIGH (SET)': 'ALTO (SET)',
        'LOW (RESET)': 'BAJO (RESET)',
        'SR Flip-Flop': 'Biestable SR',
        'None': 'Ninguno'
      },
      labels3d: {
        '400-pt breadboard': 'Protoboard 400 pts',
        'timer IC': 'CI Temporizador',
        '1/4W resistors (220Ω · 10k · 47k)': 'Resistencias 1/4W (220Ω · 10k · 47k)',
        '10µF & 10nF caps': 'Condensadores 10µF y 10nF',
        'LEDs & 1N4148 diode': 'LEDs y diodo 1N4148',
        'Switch · Pot · LDR · Piezo': 'Pulsador · Pot · LDR · Piezo',
        'OUT LED': 'LED SALIDA',
        'TRIG': 'DISPARO',
        'PULSE LED': 'LED PULSO',
        'SET': 'SET',
        'RST': 'RESET',
        'LATCH LED': 'LED LATCH',
        '50 kΩ POT': 'POT 50 kΩ',
        'PWM LED': 'LED PWM',
        'CLK LED': 'LED RELOJ',
        'PIEZO': 'ZUMBADOR',
        'CdS LDR': 'Fotorresistencia LDR',
        'ALERT LED': 'LED ALERTA',
        'RED (HIGH)': 'ROJO (ALTO)',
        'BLUE (LOW)': 'AZUL (BAJO)'
      }
    }
  };

  var PART_CATALOG = {
    'ic-555': {
      badge: 'IC · DIP-8',
      en: {
        title: 'NE555P / TLC555 Timer IC',
        summary: 'Monolithic timing integrated circuit containing 3 internal 5 kΩ resistors, two comparators, an SR flip-flop, a 200 mA push-pull output stage, and a discharge NPN transistor.',
        package: '8-pin DIP (0.3" spacing, fits across center breadboard ravine)',
        ratings: 'NE555: 4.5 V–16 V, ±200 mA · TLC555 CMOS: 2 V–15 V, ultra-low power',
        polarity: 'U-notch faces left; dot marks Pin 1 (GND) at bottom-left, counting CCW to Pin 8 (VCC).',
        role: 'Core oscillator, one-shot pulse generator, SR latch, or PWM controller in every circuit.'
      },
      es: {
        title: 'Circuito Integrado Temporizador NE555P / TLC555',
        summary: 'Circuito integrado monolítico con 3 resistencias internas de 5 kΩ, dos comparadores, un flip-flop SR, una etapa de salida de hasta 200 mA y un transistor NPN de descarga.',
        package: 'Encapsulado DIP-8 (salva el canal central de la protoboard entre filas E y F)',
        ratings: 'NE555: 4.5 V–16 V, ±200 mA · TLC555 CMOS: 2 V–15 V, bajo consumo',
        polarity: 'Muesca en U hacia la izquierda; el punto marca el Pin 1 (GND) abajo-izquierda hasta el Pin 8 (VCC) en sentido antihorario.',
        role: 'Oscilador principal, temporizador monoestable, biestable SR o modulador PWM en todos los montajes.'
      }
    },
    'bb-400': {
      badge: '400 PTS',
      en: {
        title: '400-Point Solderless Breadboard',
        summary: 'Reusable prototyping board with spring-clip metal strips underneath allowing instant component insertion and modification without soldering.',
        package: '30 columns × rows A–J + 4 horizontal power bus rails (+V / −GND)',
        ratings: '0.1" (2.54 mm) standard pin pitch, max ~1 A per rail',
        polarity: 'Columns A–E are tied vertically; F–J are tied vertically; top & bottom +/− rails run horizontally.',
        role: 'Holds the DIP-8 555 across rows E & F while routing timing components and LEDs cleanly.'
      },
      es: {
        title: 'Protoboard de 400 Puntos sin Soldadura',
        summary: 'Placa de prototipos reutilizable con láminas conductoras internas que permite insertar y modificar componentes sin soldar.',
        package: '30 columnas × filas A–J + 4 buses horizontales de alimentación (+V / −GND)',
        ratings: 'Paso estándar de 2.54 mm (0.1"), soporta hasta ~1 A por bus',
        polarity: 'Las columnas A–E están unidas verticalmente; F–J también; los rieles + y − recorren la placa horizontalmente.',
        role: 'Aloja el integrado 555 cruzando el canal central (filas E y F) y conecta resistencias, condensadores y LEDs.'
      }
    },
    'resistors': {
      badge: 'R · 1/4 W',
      en: {
        title: '1/4 W Carbon / Metal Film Resistors',
        summary: 'Limit current through LEDs and establish precise RC charging/discharging rates for the 555 timing capacitor.',
        package: 'Axial through-hole 0.25 W · Color-coded with 4 EIA bands',
        ratings: 'Kit values: 220 Ω (LED), 1 kΩ, 10 kΩ, 47 kΩ, 100 kΩ (±5%)',
        polarity: 'Non-polarized — works equally well in either direction.',
        role: 'R1 & R2 set astable frequency and duty cycle; 220 Ω protects Pin 3 LEDs; 10 kΩ pulls trigger pins HIGH.'
      },
      es: {
        title: 'Resistencias de 1/4 W (Película de Carbón/Metal)',
        summary: 'Limitan la corriente de los LEDs y fijan las velocidades exactas de carga y descarga RC del condensador.',
        package: 'Axial de inserción 0.25 W · Código de 4 bandas de color EIA',
        ratings: 'Valores del kit: 220 Ω (LED), 1 kΩ, 10 kΩ, 47 kΩ, 100 kΩ (±5%)',
        polarity: 'Sin polaridad — funcionan igual en cualquier sentido.',
        role: 'R1 y R2 determinan la frecuencia y ciclo útil; 220 Ω protege el LED; 10 kΩ actúa como pull-up en entradas.'
      }
    },
    'caps': {
      badge: 'C · µF / nF',
      en: {
        title: 'Electrolytic & Ceramic Capacitors',
        summary: 'Store electric charge between 1/3 Vcc and 2/3 Vcc to create repeatable time delays, plus filter internal voltage references.',
        package: 'Radial blue electrolytic (10 µF, 47 µF) + orange ceramic disc (10 nF, 100 nF)',
        ratings: '10 nF (50 V) for Pin 5 bypass · 10 µF / 47 µF (25 V) for timing',
        polarity: 'Ceramic discs are non-polarized. Electrolytics have a vertical − stripe for the negative GND leg!',
        role: 'C1 charges and discharges between 1/3 and 2/3 Vcc; C2 (10 nF) stabilizes Pin 5 CTRL against noise.'
      },
      es: {
        title: 'Condensadores Electrolíticos y Cerámicos',
        summary: 'Almacenan carga entre 1/3 Vcc y 2/3 Vcc para generar retardos temporales precisos y filtrar la referencia interna.',
        package: 'Electrolítico radial azul (10 µF, 47 µF) + disco cerámico (10 nF, 100 nF)',
        ratings: '10 nF (50 V) para filtro en Pin 5 · 10 µF / 47 µF (25 V) para temporización',
        polarity: 'Los cerámicos no tienen polaridad. ¡Los electrolíticos llevan franja blanca/azul clara en la pata negativa (−)!',
        role: 'C1 se carga y descarga entre los dos umbrales; C2 (10 nF) evita disparos falsos en el Pin 5 (CTRL).'
      }
    },
    'leds': {
      badge: 'LED / D',
      en: {
        title: '5 mm Indicator LEDs & 1N4148 Diodes',
        summary: 'LEDs give instant visual feedback of Pin 3 HIGH/LOW states, while fast 1N4148 diodes separate PWM charge and discharge paths.',
        package: '5 mm epoxy dome LEDs (Red/Blue/Green/Cyan) + DO-35 orange glass diode',
        ratings: 'LED Vf ≈ 2.0–3.2 V at 10–20 mA · 1N4148 max 200 mA, 4 ns recovery',
        polarity: 'LED flat side / short lead = Cathode (−). 1N4148 black ring = Cathode (current flows toward ring).',
        role: 'LEDs show output pulses; dual 1N4148 steering diodes unlock 5%–95% PWM dimming in Step 6.'
      },
      es: {
        title: 'LEDs de 5 mm y Diodos Rápidos 1N4148',
        summary: 'Los LEDs muestran visualmente el estado de salida del Pin 3 y los diodos 1N4148 separan las rutas de carga y descarga PWM.',
        package: 'LEDs de 5 mm (Rojo/Azul/Verde/Cian) + diodo de vidrio naranja DO-35',
        ratings: 'LED Vf ≈ 2.0–3.2 V (10–20 mA) · 1N4148 hasta 200 mA, conmutación 4 ns',
        polarity: 'LED: pata corta / borde plano = Cátodo (−). 1N4148: banda negra = Cátodo.',
        role: 'Indican el estado de la salida; dos diodos 1N4148 permiten regular el PWM de 5% a 95% en el Paso 6.'
      }
    },
    'inputs': {
      badge: 'E/S · I/O',
      en: {
        title: 'Interactive I/O: Tactile Switch, Potentiometer, LDR & Piezo',
        summary: 'Real-world sensors and actuators that trigger, modulate, or convert 555 square waves into light, sound, and manual control.',
        package: '4-pin tactile switch, 50 kΩ rotary pot, CdS photoresistor (LDR), 5 V piezo buzzer',
        ratings: 'Pot: 50 kΩ linear · LDR: ~1 kΩ (bright) to >150 kΩ (dark) · Piezo: 5 V',
        polarity: 'Switch, Pot, and LDR are non-polarized; Piezo buzzer + pin goes to Pin 3 output resistor.',
        role: 'Switch triggers Monostable/Bistable modes; Pot sweeps PWM; LDR gates Pin 4 RESET; Piezo plays audio tones.'
      },
      es: {
        title: 'Entradas/Salidas: Pulsador, Potenciómetro, LDR y Zumbador',
        summary: 'Sensores y actuadores reales que disparan, modulan o convierten la señal del 555 en sonido y control manual.',
        package: 'Pulsador táctil, potenciómetro 50 kΩ, fotorresistencia CdS (LDR) y zumbador piezo 5 V',
        ratings: 'Pot: 50 kΩ lineal · LDR: ~1 kΩ (luz) a >150 kΩ (oscuridad) · Piezo: 5 V',
        polarity: 'Pulsador, potenciómetro y LDR no tienen polaridad; el positivo (+) del piezo va hacia el Pin 3.',
        role: 'El pulsador dispara Monoestable/Biestable; el pot ajusta PWM; la LDR controla el Pin 4; el piezo emite tonos.'
      }
    },
    'cap-elec': {
      badge: 'C · µF',
      en: {
        title: 'Electrolytic Timing Capacitor (10 µF / 47 µF)',
        summary: 'High-capacitance polarized capacitor used to create human-visible blinking and multi-second monostable delays.',
        package: 'Radial aluminum cylinder with negative (−) stripe',
        ratings: '10 µF–100 µF · 25 V rated',
        polarity: 'Polarized — negative (−) leg with light stripe must go to GND.',
        role: 'Charges and discharges between 1/3 Vcc and 2/3 Vcc via R1 and R2.'
      },
      es: {
        title: 'Condensador Electrolítico de Tiempo (10 µF / 47 µF)',
        summary: 'Condensador polarizado de alta capacidad usado para retardos largos y parpadeos visibles en LEDs.',
        package: 'Cilindro radial de aluminio con franja negativa (−)',
        ratings: '10 µF–100 µF · 25 V nominal',
        polarity: 'Polarizado — la pata negativa (−) con la franja debe conectarse a GND.',
        role: 'Se carga y descarga entre 1/3 Vcc y 2/3 Vcc a través de R1 y R2.'
      }
    },
    'cap-ceramic': {
      badge: 'C · nF',
      en: {
        title: 'Ceramic Disc Capacitor (10 nF / 100 nF)',
        summary: 'Compact non-polarized capacitor ideal for filtering Pin 5 (CTRL) noise or generating audio-frequency oscillations.',
        package: 'Orange ceramic disc (0.1" lead spacing)',
        ratings: '10 nF / 100 nF · 50 V rated',
        polarity: 'Non-polarized — insert in either orientation.',
        role: 'Stabilizes the 2/3 Vcc reference on Pin 5 or sets audio pitch in Step 8.'
      },
      es: {
        title: 'Condensador Cerámico (10 nF / 100 nF)',
        summary: 'Condensador compacto sin polaridad ideal para filtrar ruido en Pin 5 (CTRL) u oscilar en frecuencias de audio.',
        package: 'Disco cerámico naranja (paso 2.54 mm)',
        ratings: '10 nF / 100 nF · 50 V nominal',
        polarity: 'Sin polaridad — puede conectarse en cualquier sentido.',
        role: 'Estabiliza la referencia de 2/3 Vcc en Pin 5 o fija el tono en el Paso 8.'
      }
    },
    'diode': {
      badge: '1N4148',
      en: {
        title: '1N4148 Fast Switching Diode',
        summary: 'Small-signal silicon diode allowing current to pass in one direction only, separating charge and discharge resistance paths.',
        package: 'DO-35 glass axial package with black cathode band',
        ratings: 'Up to 200 mA forward current, 4 ns reverse recovery, Vf ≈ 0.7 V',
        polarity: 'Black stripe marks the Cathode (−); current flows toward the stripe.',
        role: 'D1 & D2 steer charging vs discharging across the potentiometer wiper for 5%–95% PWM.'
      },
      es: {
        title: 'Diodo Rápido 1N4148',
        summary: 'Diodo de señal de silicio que conduce en un solo sentido, separando las rutas de carga y descarga.',
        package: 'Encapsulado axial de vidrio DO-35 con banda negra en el cátodo',
        ratings: 'Hasta 200 mA continuos, recuperación 4 ns, Vf ≈ 0.7 V',
        polarity: 'La banda negra marca el Cátodo (−); la corriente fluye hacia la banda.',
        role: 'D1 y D2 dirigen carga y descarga a través del potenciómetro para lograr PWM de 5% a 95%.'
      }
    },
    'pot': {
      badge: 'POT · 50 kΩ',
      en: {
        title: '50 kΩ Rotary Potentiometer',
        summary: 'Three-terminal variable resistor whose middle wiper splits total resistance smoothly as you turn the dial.',
        package: 'Breadboard-friendly trimmer with rotary knob',
        ratings: '50 kΩ linear taper · 0.25 W',
        polarity: 'Non-polarized outer legs; middle terminal is the adjustable wiper.',
        role: 'Varies the charge-to-discharge ratio continuously to dim LEDs or control motor speed.'
      },
      es: {
        title: 'Potenciómetro Rotatorio 50 kΩ',
        summary: 'Resistencia variable de tres terminales cuyo cursor central divide la resistencia total al girar la perilla.',
        package: 'Trimmer vertical con perilla para protoboard',
        ratings: '50 kΩ lineal · 0.25 W',
        polarity: 'Extremos intercambiables; el pin central es el cursor variable.',
        role: 'Modifica continuamente la proporción carga/descarga para atenuar LEDs o motores PWM.'
      }
    },
    'buzzer': {
      badge: 'PIEZO · 5V',
      en: {
        title: '5 V Piezo Buzzer / Transducer',
        summary: 'Piezoelectric acoustic element that converts the 555 square-wave pulses directly into audible sound waves.',
        package: 'Round black resonator housing (12 mm diameter)',
        ratings: '3 V–12 V peak-to-peak · Best resonance 400 Hz–4 kHz',
        polarity: 'Positive (+) lead connects via 100 Ω resistor to Pin 3 OUT; − goes to GND.',
        role: 'Turns Pin 3 oscillation into a live audible square-wave tone in Step 8.'
      },
      es: {
        title: 'Zumbador Piezoeléctrico 5 V',
        summary: 'Transductor acústico piezoeléctrico que convierte los pulsos cuadrados del 555 directamente en sonido audible.',
        package: 'Cápsula resonante circular negra (12 mm)',
        ratings: '3 V–12 V pico a pico · Mejor respuesta entre 400 Hz y 4 kHz',
        polarity: 'Terminal positivo (+) hacia Pin 3 mediante resistencia de 100 Ω; (−) a GND.',
        role: 'Convierte la oscilación del Pin 3 en un tono audible en el Paso 8.'
      }
    },
    'ldr': {
      badge: 'CdS · LDR',
      en: {
        title: 'CdS Photoresistor (LDR)',
        summary: 'Light-dependent resistor whose electrical resistance drops sharply under bright light and rises above 150 kΩ in darkness.',
        package: 'Epoxy-coated ceramic disc with serpentine CdS cell',
        ratings: '~1 kΩ (bright daylight) to >150 kΩ (darkness)',
        polarity: 'Non-polarized — insert in either orientation.',
        role: 'Forms a light-sensitive divider with R_pull to gate Pin 4 RESET on/off in Step 9.'
      },
      es: {
        title: 'Fotorresistencia CdS (LDR)',
        summary: 'Resistencia dependiente de la luz cuyo valor cae con luz intensa y supera 150 kΩ en la oscuridad.',
        package: 'Disco cerámico transparente con pista serpentina CdS',
        ratings: '~1 kΩ (luz directa) hasta >150 kΩ (oscuridad)',
        polarity: 'Sin polaridad — funciona igual en ambos sentidos.',
        role: 'Forma un divisor sensible a la luz con R_pull para activar o silenciar el Pin 4 RESET en el Paso 9.'
      }
    },
    'button': {
      badge: 'SW · TACT',
      en: {
        title: 'Momentary Tactile Pushbutton',
        summary: 'Normally-open mechanical switch that shorts its input pin directly to GND only while pressed.',
        package: '4-pin through-hole 6×6 mm tactile switch with yellow/blue cap',
        ratings: '50 mA at 12 V DC · Paired with 10 kΩ pull-up resistor',
        polarity: 'Non-polarized — pressing connects Pin 2 (TRIG) or Pin 4 (RESET) to 0 V.',
        role: 'Triggers One-Shot timing pulses (Step 4) or toggles Set/Reset latch memory (Step 5).'
      },
      es: {
        title: 'Pulsador Táctil Momentáneo',
        summary: 'Interruptor normalmente abierto que conecta la entrada a GND brevemente mientras se mantiene presionado.',
        package: 'Pulsador de 6×6 mm con resistencia pull-up de 10 kΩ',
        ratings: '50 mA a 12 V DC',
        polarity: 'Sin polaridad — al pulsar lleva el Pin 2 (TRIG) o Pin 4 (RESET) a 0 V.',
        role: 'Dispara pulsos únicos en Monoestable (Paso 4) o conmuta la memoria Biestable (Paso 5).'
      }
    }
  };

  var PINS_ES = [
    { num: 1, name: 'GND', full: 'Tierra (0 V)', desc: 'Retorno negativo común conectado al polo negativo de la batería / riel 0 V.' },
    { num: 2, name: 'TRIG', full: 'Disparo (Trigger)', desc: 'Entrada activa en bajo. Si cae bajo 1/3 Vcc, activa la salida en ALTO y apaga Descarga.' },
    { num: 3, name: 'OUT', full: 'Salida (Output)', desc: 'Etapa push-pull capaz de entregar o absorber hasta 200 mA para LEDs, zumbadores o MOSFETs.' },
    { num: 4, name: 'RESET', full: 'Reinicio (Activo en Bajo)', desc: 'Anula todas las entradas si baja de 0.7 V, forzando la salida a BAJO. Conectar a Vcc si no se usa.' },
    { num: 5, name: 'CTRL', full: 'Voltaje de Control', desc: 'Acceso directo al divisor de 2/3 Vcc. Conecta a GND con un condensador de 10 nF para evitar ruido.' },
    { num: 6, name: 'THRES', full: 'Umbral (Threshold)', desc: 'Entrada activa en alto. Si supera 2/3 Vcc, reinicia la salida a BAJO y enciende Descarga.' },
    { num: 7, name: 'DISCH', full: 'Descarga (Colector Abierto)', desc: 'Colector del transistor NPN interno a GND. Descarga el condensador cuando la salida está en BAJO.' },
    { num: 8, name: 'VCC', full: 'Alimentación (+4.5 V a +16 V)', desc: 'Riel positivo. El CMOS TLC555 funciona desde 2 V; el bipolar NE555 requiere 4.5 V–16 V.' }
  ];

  var STEPS_ES = {
    pinout: {
      shortTitle: 'Pines y Piezas',
      kicker: 'FUNDAMENTOS · PASO 1 DE 10',
      title: 'Pines y Componentes',
      subtitle: 'Paso 1 · Conoce el integrado 555 y el kit',
      description: 'Todo proyecto 555 empieza con el encapsulado DIP-8 y componentes pasivos básicos. La muesca va a la izquierda: el Pin 1 empieza abajo-izquierda y sube en sentido antihorario hasta el Pin 8. Haz clic en cualquier objeto del tapete para ver sus especificaciones.',
      note: 'Revisa siempre la muesca en U o el punto del Pin 1 antes de dar energía. Invertir Pin 1 (GND) y Pin 8 (VCC) sobrecalienta un NE555 en segundos.',
      bom: [
        'Circuito integrado NE555P o TLC555 (encapsulado DIP-8)',
        'Protoboard de 400 puntos sin soldadura con buses de poder',
        'Resistencias: 220 Ω (LED), 10 kΩ, 47 kΩ, 100 kΩ (1/4 W)',
        'Condensadores: 10 nF cerámico (Pin 5), 10 µF y 47 µF electrolíticos',
        '2 LEDs de 5 mm (Rojo y Azul/Verde) + diodos rápidos 1N4148',
        'Pulsadores, potenciómetro 50 kΩ, fotorresistencia LDR y zumbador 5 V'
      ]
    },
    block: {
      shortTitle: 'Interior 555',
      kicker: 'FUNDAMENTOS · PASO 2 DE 10',
      title: 'Arquitectura Interna',
      subtitle: 'Paso 2 · Divisor, Comparadores y Flip-Flop SR',
      description: 'Dentro del 555 hay tres resistencias iguales de 5 kΩ (de ahí su nombre), dos comparadores analógicos, un flip-flop SR, una etapa de salida y un transistor NPN de descarga. Activa los botones abajo para ver reaccionar el biestable en vivo.',
      note: 'Como ambos umbrales (1/3 Vcc y 2/3 Vcc) escalan proporcionalmente con Vcc, los tiempos en modo astable y monoestable apenas cambian aunque baje la batería.',
      wires: {
        'blk-div': 'Tres resistencias de 5 kΩ dividen Vcc en 2/3 Vcc (Sup.) y 1/3 Vcc (Inf.)',
        'blk-comp-u': 'Comparador Superior: reinicia el latch cuando Pin 6 (THRES) > 2/3 Vcc',
        'blk-comp-l': 'Comparador Inferior: activa el latch cuando Pin 2 (TRIG) < 1/3 Vcc',
        'blk-ff': 'El Flip-Flop SR memoriza el estado de la salida entre cruces de umbral',
        'blk-disch': 'Transistor NPN de Descarga cortocircuita Pin 7 a GND cuando la salida es BAJO',
        'blk-rst': 'Pin 4 RESET fuerza la salida a BAJO al instante cuando se lleva a 0 V'
      }
    },
    astable: {
      shortTitle: 'Astable',
      kicker: 'MODO BASE · PASO 3 DE 10',
      title: 'Destellador LED Astable',
      subtitle: 'Paso 3 · Oscilador de Onda Cuadrada Auto-Disparado',
      description: 'Une TRIG (Pin 2) con THRES (Pin 6) y el 555 oscilará continuamente sin señal externa. C1 se carga a través de R1 + R2 hasta 2/3 Vcc y se descarga por R2 hacia el Pin 7 hasta caer a 1/3 Vcc.',
      note: 'En modo astable estándar, R1 solo participa en la carga mientras R2 carga y descarga, así que el ciclo útil siempre es > 50%. Haz R2 mucho mayor que R1 para acercarte al 50%.',
      controls: { vcc: 'Voltaje Vcc', r1: 'Resistencia R1', r2: 'Resistencia R2', c1: 'Condensador C1' },
      wires: {
        'w-vcc': 'Pin 8 (VCC) → Riel rojo +V',
        'w-gnd': 'Pin 1 (GND) → Riel azul −GND',
        'w-rst': 'Pin 4 (RESET) → Riel rojo +V (habilita el chip)',
        'w-ctrl': 'Condensador 10 nF: Pin 5 (CTRL) → Riel −GND superior',
        'w-r1': 'R1: Riel rojo +V → Pin 7 (DISCH)',
        'w-r2': 'R2: Pin 7 (DISCH) → Nodo de tiempo (Col 18)',
        'w-c1': 'C1 (+): Nodo de tiempo (Col 18) → Riel −GND superior',
        'w-th': 'Pin 6 (THRES) → Nodo de tiempo (Col 18) · puente amarillo',
        'w-bridge': 'Puente Pin 6 (THRES) ↔ Pin 2 (TRIG) cruzando el canal central',
        'w-led': 'Pin 3 (OUT) → Resistencia 220 Ω → LED Rojo → −GND'
      }
    },
    monostable: {
      shortTitle: 'Monoestable',
      kicker: 'MODO BASE · PASO 4 DE 10',
      title: 'Temporizador de Un Pulso',
      subtitle: 'Paso 4 · Pulso Temporizado Anti-Rebote',
      description: 'Pulsa el botón táctil (o el botón abajo) para llevar el Pin 2 brevemente a 0 V. La salida salta a ALTO durante T = 1.1 × R1 × C1 mientras C1 se carga hasta 2/3 Vcc y luego vuelve sola a reposo.',
      note: 'Una vez disparado, el 555 ignora nuevos rebotes del botón hasta finalizar el pulso — ideal como antirrebote de hardware o luz temporizada.',
      controls: { trigger: 'Pulsar Botón TRIG (Pin 2 → GND)', r1: 'Resistencia R1', c1: 'Condensador C1' },
      wires: {
        'w-vcc': 'Pin 8 (VCC) → Riel +V y Pin 4 (RESET) → +V',
        'w-gnd': 'Pin 1 (GND) → Riel −GND',
        'w-rpull': 'Resistencia pull-up 10 kΩ: +V → Pin 2 (TRIG)',
        'w-btn': 'Pulsador táctil: Pin 2 (Col 9) → Riel −GND',
        'w-r1': 'R1: Riel +V → Pin 7 (DISCH)',
        'w-th': 'Puente Pin 7 (DISCH) ↔ Pin 6 (THRES)',
        'w-c1': 'C1 (+): Pin 6 (Col 15) → Riel −GND superior',
        'w-ctrl': 'Condensador 10 nF: Pin 5 (CTRL) → Riel −GND',
        'w-led': 'Pin 3 (OUT) → 220 Ω → LED Verde → −GND'
      }
    },
    bistable: {
      shortTitle: 'Biestable',
      kicker: 'MODO BASE · PASO 5 DE 10',
      title: 'Biestable Latch SR',
      subtitle: 'Paso 5 · Memoria Hardware con Dos Pulsadores',
      description: 'Sin condensador de tiempo, el 555 funciona como un flip-flop SR puro. Pulsa SET (Pin 2 → GND) para enclavar la salida en ALTO indefinidamente; pulsa RESET (Pin 4 → GND) para devolverla a BAJO.',
      note: 'El Pin 7 (DISCH) queda sin conexión en modo biestable. Ata siempre el Pin 6 (THRES) a GND para que el ruido eléctrico no reinicie el latch por error.',
      wires: {
        'w-vcc': 'Pin 8 (VCC) → +V y Pin 1 (GND) → −GND',
        'w-th-gnd': 'Pin 6 (THRES) → −GND superior (desactiva reinicio por umbral)',
        'w-set-r': 'Pull-up 10 kΩ en Pin 2 (TRIG) + pulsador SET a −GND',
        'w-rst-r': 'Pull-up 10 kΩ en Pin 4 (RESET) + pulsador RESET a −GND',
        'w-ctrl': 'Condensador 10 nF: Pin 5 (CTRL) → −GND',
        'w-led': 'Pin 3 (OUT) → 220 Ω → LED Ámbar → −GND'
      }
    },
    pwm: {
      shortTitle: 'Atenuador PWM',
      kicker: 'APLICACIÓN · PASO 6 DE 10',
      title: 'Control PWM para Motor / LED',
      subtitle: 'Paso 6 · Diodos de Dirección y Potenciómetro',
      description: 'Dos diodos 1N4148 dividen el cursor del potenciómetro en rutas separadas de carga y descarga. Al girar el mando, el ciclo de trabajo varía suavemente entre 5% y 95% manteniendo la frecuencia casi constante.',
      note: 'Para controlar un motor DC de mayor potencia en lugar del LED, conecta el Pin 3 mediante una resistencia de 100 Ω a la puerta de un MOSFET canal N (como IRLZ44N) con diodo volante.',
      controls: { potRatio: 'Ciclo Potenciómetro', c1: 'Condensador C1' },
      wires: {
        'w-vcc': 'Pin 8 (VCC) y Pin 4 (RESET) → Riel +V',
        'w-gnd': 'Pin 1 (GND) → Riel −GND',
        'w-r1': 'Resistencia de seguridad 1 kΩ: +V → Pin 7 (DISCH)',
        'w-pot': 'Extremos del potenciómetro 50 kΩ → Diodos D1 y D2',
        'w-diodes': 'Diodos 1N4148 D1 (carga) y D2 (descarga) hacia el cursor',
        'w-c1': 'C1: Nodo del cursor / Pin 6 / Pin 2 → Riel −GND',
        'w-led': 'Pin 3 (OUT) → 330 Ω → LED Cian → −GND'
      }
    },
    fifty: {
      shortTitle: 'Reloj 50%',
      kicker: 'APLICACIÓN · PASO 7 DE 10',
      title: 'Reloj Simétrico al 50%',
      subtitle: 'Paso 7 · Oscilador por Realimentación de Salida',
      description: 'En lugar de cargar desde Vcc por R1, conecta R2 directamente desde el Pin 3 (OUT) hacia C1. Como el condensador se carga y descarga exactamente por la misma resistencia R2, la salida forma una onda cuadrada balanceada 50/50.',
      note: 'Alterna arriba entre NE555 y TLC555: en el NE555 bipolar, la salida alta cae ~1.4 V por debajo de Vcc, desplazando ligeramente la simetría frente al CMOS TLC555.',
      controls: { r2: 'Realimentación R2', c1: 'Condensador C1' },
      wires: {
        'w-vcc': 'Pin 8 (VCC) y Pin 4 (RESET) → Riel +V',
        'w-gnd': 'Pin 1 (GND) → Riel −GND',
        'w-fb': 'Realimentación R2: Pin 3 (OUT) → Nodo de tiempo (Col 19)',
        'w-c1': 'C1 (+): Nodo de tiempo (Col 19) → −GND',
        'w-sense': 'Pin 6 (THRES) y Pin 2 (TRIG) miden C1 (Pin 7 libre)',
        'w-led': 'Pin 3 (OUT) → 220 Ω → LED Reloj → −GND'
      }
    },
    audio: {
      shortTitle: 'Tono Audio',
      kicker: 'APLICACIÓN · PASO 8 DE 10',
      title: 'Oscilador de Tono Piezo',
      subtitle: 'Paso 8 · Sintetizador Audible de Onda Cuadrada',
      description: 'Cambia el condensador electrolítico por uno cerámico de 100 nF y el 555 entra en la banda audible (200 Hz–2 kHz). Activa el altavoz en la barra superior derecha para escuchar el cambio de tono al mover R2.',
      note: 'Encadenar dos osciladores así (conectando el Pin 3 del primero al Pin 5 CTRL del segundo) forma el legendario sintetizador Atari Punk Console.',
      controls: { r2: 'Resistencia de Tono R2', c1: 'Condensador de Tono C1' },
      wires: {
        'w-vcc': 'Pin 8 (VCC) y Pin 4 (RESET) → Riel +V',
        'w-gnd': 'Pin 1 (GND) → Riel −GND',
        'w-r1': 'R1 (4.7 kΩ): Riel +V → Pin 7 (DISCH)',
        'w-r2': 'Tono R2: Pin 7 (DISCH) → Nodo de tiempo (Col 18)',
        'w-c1': 'Condensador 100 nF C1: Col 18 → −GND',
        'w-spkr': 'Pin 3 (OUT) → 100 Ω → Zumbador Piezo → −GND'
      }
    },
    ldr: {
      shortTitle: 'Alarma Luz',
      kicker: 'APLICACIÓN · PASO 9 DE 10',
      title: 'Alarma por Oscuridad',
      subtitle: 'Paso 9 · Circuito Activado por Fotorresistencia (LDR)',
      description: 'Una fotorresistencia CdS (LDR) y una resistencia de 22 kΩ forman un divisor conectado al Pin 4 (RESET). Con luz diurna el voltaje baja de 0.7 V y silencia el chip; al oscurecer, Pin 4 sube y activa la alarma pulsante.',
      note: 'Baja el deslizador de Luz Ambiente por debajo del 45% para activar la alarma. Intercambia la LDR y R_pull para convertirla en detector de luz solar.',
      controls: { lightPercent: 'Luz Ambiente', rPull: 'Sensibilidad R_pull' },
      wires: {
        'w-vcc': 'Pin 8 (VCC) → +V y Pin 1 (GND) → −GND',
        'w-ldr': 'Fotorresistencia LDR: +V → Nodo sensor (Col 19) → Pin 4 (RESET)',
        'w-rpull': 'Resistencia divisora 22 kΩ: Nodo sensor (Col 19) → −GND',
        'w-ast': 'Red astable (R1, R2, C1) genera los pulsos de alerta',
        'w-out': 'Pin 3 (OUT) → 220 Ω → LED Alerta → −GND'
      }
    },
    dual_flasher: {
      shortTitle: 'Doble LED',
      kicker: 'APLICACIÓN · PASO 10 DE 10',
      title: 'Destellador Alterno Dual-LED',
      subtitle: 'Paso 10 · Salida Push-Pull de Fuente y Sumidero',
      description: 'Como el Pin 3 entrega corriente en ALTO y la absorbe en BAJO, conectar un LED del Pin 3 a −GND y otro de +V al Pin 3 hace parpadear Rojo y Azul en oposición alterna, como un paso a nivel.',
      note: 'Cada LED necesita su propia resistencia limitadora de 220 Ω. Compartir una sola resistencia provoca brillo residual tenue según el voltaje de entrada.',
      controls: { r2: 'Velocidad Destello R2', c1: 'Condensador C1' },
      wires: {
        'w-vcc': 'Pin 8 (VCC) y Pin 4 (RESET) → Riel +V',
        'w-gnd': 'Pin 1 (GND) → Riel −GND',
        'w-ast': 'Red astable (R1 4.7 kΩ, R2, C1) genera el ritmo (~1.5 Hz)',
        'w-led1': 'LED Fuente (Rojo): Pin 3 (OUT) → 220 Ω → Ánodo → −GND (enciende en ALTO)',
        'w-led2': 'LED Sumidero (Azul): +V → 220 Ω → Ánodo → Cátodo → Pin 3 (enciende en BAJO)'
      }
    }
  };

  function getDict(lang) {
    return lang === 'es' ? STRINGS.es : STRINGS.en;
  }

  function t(key, lang) {
    var d = getDict(lang);
    return d[key] !== undefined ? d[key] : STRINGS.en[key] || key;
  }

  function translateMetric(labelOrVal, lang) {
    var d = getDict(lang);
    if (d.metrics && d.metrics[labelOrVal] !== undefined) {
      return d.metrics[labelOrVal];
    }
    return labelOrVal;
  }

  function translateLabel3d(text, lang) {
    if (lang !== 'es') return text;
    if (text.indexOf('timer IC') !== -1) {
      return text.replace('timer IC', STRINGS.es.labels3d['timer IC']);
    }
    return STRINGS.es.labels3d[text] || text;
  }

  function getPin(pin, lang) {
    if (lang !== 'es') return pin;
    var esPin = PINS_ES[pin.num - 1];
    if (!esPin) return pin;
    return {
      num: pin.num,
      name: esPin.name,
      full: esPin.full,
      color: pin.color,
      desc: esPin.desc
    };
  }

  function getPartDetail(partId, lang) {
    var entry = PART_CATALOG[partId];
    if (!entry) return null;
    var loc = lang === 'es' ? entry.es : entry.en;
    return {
      id: partId,
      badge: entry.badge,
      title: loc.title,
      summary: loc.summary,
      package: loc.package,
      ratings: loc.ratings,
      polarity: loc.polarity,
      role: loc.role
    };
  }

  function getStep(step, lang) {
    if (lang !== 'es') return step;
    var es = STEPS_ES[step.id];
    if (!es) return step;

    var out = Object.assign({}, step, {
      shortTitle: es.shortTitle || step.shortTitle,
      kicker: es.kicker || step.kicker,
      title: es.title || step.title,
      subtitle: es.subtitle || step.subtitle,
      description: es.description || step.description,
      note: es.note || step.note
    });

    if (step.bom && es.bom) {
      out.bom = step.bom.map(function (item, idx) {
        return Object.assign({}, item, {
          text: es.bom[idx] || item.text
        });
      });
    }

    if (step.controls && es.controls) {
      out.controls = step.controls.map(function (ctrl) {
        if (ctrl.type === 'slider' && es.controls[ctrl.key]) {
          return Object.assign({}, ctrl, { label: es.controls[ctrl.key] });
        }
        if (ctrl.type === 'trigger-button' && es.controls.trigger) {
          return Object.assign({}, ctrl, { label: es.controls.trigger });
        }
        return ctrl;
      });
    }

    if (step.wires) {
      if (step.mode === 'pinout') {
        out.wires = step.wires.map(function (w) {
          var pEs = PINS_ES[w.pin - 1];
          return pEs ? Object.assign({}, w, { label: pEs.full + ' — ' + pEs.desc }) : w;
        });
      } else if (es.wires) {
        out.wires = step.wires.map(function (w) {
          return es.wires[w.id] ? Object.assign({}, w, { label: es.wires[w.id] }) : w;
        });
      }
    }

    if (step.components) {
      out.components = step.components.map(function (c) {
        return c.label ? Object.assign({}, c, { label: translateLabel3d(c.label, lang) }) : c;
      });
    }

    return out;
  }

  root.I18n555 = {
    t: t,
    translateMetric: translateMetric,
    translateLabel3d: translateLabel3d,
    getPin: getPin,
    getPartDetail: getPartDetail,
    getStep: getStep
  };
}(typeof self !== 'undefined' ? self : this));
