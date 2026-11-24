/*
 * Delta CP2000 VFD Card for Home Assistant
 * Hamlet Elektries — https://github.com/wesselswynand2-prog/delta-cp2000-card
 *
 * Shows live data from a Delta CP2000 variable frequency drive (read over Modbus RTU/TCP)
 * and lets you RUN / STOP / RESET the drive and change its speed (frequency) setpoint.
 *
 * Registers used (Delta CP2000 communication map):
 *   2000H (8192)  write  command word   1=STOP 2=RUN  0x10=FWD 0x20=REV
 *   2001H (8193)  write  frequency cmd  Hz x 100
 *   2002H (8194)  write  bit1 = fault reset (value 2)
 *   2100H (8448)  read   fault code (low byte) / warning (high byte)
 *   2101H (8449)  read   drive status word
 */

const CARD_VERSION = "1.17.0";

// Hamlet Elektries logo (white, transparent background) — built in so no upload is needed.
const HAMLET_LOGO =
  "data:image/png;base64,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";

const FAULTS = {
  1: ["ocA", "Over-current during acceleration"],
  2: ["ocd", "Over-current during deceleration"],
  3: ["ocn", "Over-current at constant speed"],
  4: ["GFF", "Ground fault"],
  5: ["occ", "IGBT short circuit"],
  6: ["ocS", "Over-current at stop"],
  7: ["ovA", "Over-voltage during acceleration"],
  8: ["ovd", "Over-voltage during deceleration"],
  9: ["ovn", "Over-voltage at constant speed"],
  10: ["ovS", "Over-voltage at stop"],
  11: ["LvA", "Low voltage during acceleration"],
  12: ["Lvd", "Low voltage during deceleration"],
  13: ["Lvn", "Low voltage at constant speed"],
  14: ["LvS", "Low voltage at stop"],
  15: ["OrP", "Input phase loss"],
  16: ["oH1", "IGBT over-heat"],
  17: ["oH2", "Capacitor over-heat"],
  18: ["tH1o", "IGBT temperature sensor error"],
  19: ["tH2o", "Capacitor temperature sensor error"],
  21: ["oL", "Drive overload"],
  22: ["EoL1", "Motor 1 overload"],
  23: ["EoL2", "Motor 2 overload"],
  24: ["oH3", "Motor over-heat (PTC)"],
  26: ["ot1", "Over-torque 1"],
  27: ["ot2", "Over-torque 2"],
  28: ["uC", "Under-current (possible dry run)"],
  30: ["cF1", "EEPROM write error"],
  31: ["cF2", "EEPROM read error"],
  33: ["cd1", "U-phase current detection error"],
  34: ["cd2", "V-phase current detection error"],
  35: ["cd3", "W-phase current detection error"],
  36: ["Hd0", "cc hardware error"],
  37: ["Hd1", "oc hardware error"],
  38: ["Hd2", "ov hardware error"],
  39: ["Hd3", "GFF hardware error"],
  40: ["AUE", "Auto-tuning error"],
  41: ["AFE", "PID feedback loss"],
  48: ["ACE", "Analog current input (ACI) loss"],
  49: ["EF", "External fault"],
  50: ["EF1", "Emergency stop"],
  51: ["bb", "External base block"],
  52: ["Pcod", "Password locked"],
  54: ["CE1", "Modbus: illegal function code"],
  55: ["CE2", "Modbus: illegal data address"],
  56: ["CE3", "Modbus: illegal data value"],
  57: ["CE4", "Modbus: slave device failure"],
  58: ["CE10", "Modbus communication time-out"],
  59: ["CP10", "Keypad communication time-out"],
  60: ["bF", "Braking chopper fault"],
  63: ["oSL", "Over-slip"],
  64: ["ryF", "Soft-charge relay error"],
  82: ["OPHL", "Output phase loss (U)"],
  83: ["OPHL", "Output phase loss (V)"],
  84: ["OPHL", "Output phase loss (W)"],
};

const RUN_STATES = ["STOP", "STOPPING", "STANDBY", "RUN"];
const DIRS = ["FWD", "REV→FWD", "FWD→REV", "REV"];

// Settings menu (MENU key): Hamlet Single Pump V9 program (D = PLC register) + drive parameters (P = GG-NN).
// Generated from one list together with examples/cp2000_pump_plc_package.yaml — keep them in step.
const MENU_V9 = [{"t": "SETPOINTS (MULTI)", "i": [{"r": "D31", "l": "SP1", "d": 2, "min": 0, "max": 50, "u": "bar"}, {"r": "D32", "l": "SP2", "d": 2, "min": 0, "max": 50, "u": "bar"}, {"r": "D33", "l": "SP3", "d": 2, "min": 0, "max": 50, "u": "bar"}, {"r": "D34", "l": "SP4", "d": 2, "min": 0, "max": 50, "u": "bar"}, {"r": "D35", "l": "SP5", "d": 2, "min": 0, "max": 50, "u": "bar"}, {"r": "D36", "l": "SP6", "d": 2, "min": 0, "max": 50, "u": "bar"}, {"r": "D37", "l": "SP7", "d": 2, "min": 0, "max": 50, "u": "bar"}, {"r": "D38", "l": "SP8", "d": 2, "min": 0, "max": 50, "u": "bar"}, {"r": "D39", "l": "SP9", "d": 2, "min": 0, "max": 50, "u": "bar"}, {"r": "D40", "l": "SP10", "d": 2, "min": 0, "max": 50, "u": "bar"}, {"r": "D41", "l": "SP11", "d": 2, "min": 0, "max": 50, "u": "bar"}, {"r": "D42", "l": "SP12", "d": 2, "min": 0, "max": 50, "u": "bar"}, {"r": "D43", "l": "SP13", "d": 2, "min": 0, "max": 50, "u": "bar"}, {"r": "D44", "l": "SP14", "d": 2, "min": 0, "max": 50, "u": "bar"}, {"r": "D45", "l": "SP15", "d": 2, "min": 0, "max": 50, "u": "bar"}]}, {"t": "TRANSDUCER", "i": [{"r": "D18", "l": "Max pressure", "d": 2, "min": 0, "max": 50, "u": "bar"}, {"r": "D178", "l": "Feedback det time", "d": 1, "min": 0, "max": 3600, "u": "s"}]}, {"t": "SLEEP & WAKE", "i": [{"r": "D130", "l": "Sleep (% of SP)", "d": 0, "min": 0, "max": 200, "u": "%"}, {"r": "D140", "l": "Wake (% of SP)", "d": 0, "min": 0, "max": 100, "u": "%"}]}, {"t": "PID", "i": [{"r": "D176", "l": "P (default 1.0)", "d": 1, "min": 0, "max": 100}, {"r": "D172", "l": "I (default 1.00)", "d": 2, "min": 0, "max": 100}, {"r": "D174", "l": "D (default 0.00)", "d": 2, "min": 0, "max": 1}]}, {"t": "MOTOR SETUP", "i": [{"r": "D2", "l": "Rated amps", "d": 2, "min": 0, "max": 999, "u": "A"}, {"r": "D272", "l": "Min speed", "d": 2, "min": 0, "max": 50, "u": "Hz"}, {"r": "D250", "l": "No load amps", "d": 2, "min": 0, "max": 999, "u": "A"}, {"r": "D252", "l": "No load delay", "d": 0, "min": 0, "max": 3600, "u": "s"}, {"r": "D249", "l": "Direction", "d": 0, "min": 0, "max": 1, "opts": ["FWD", "REV"]}]}, {"t": "OVER CURRENT STALL", "i": [{"r": "D209", "l": "OC on accel", "d": 1, "min": 0, "max": 999.9, "u": "%"}, {"r": "D205", "l": "OC on normal", "d": 1, "min": 0, "max": 999.9, "u": "%"}]}, {"t": "BOOST", "i": [{"r": "D239", "l": "Boost enable", "d": 0, "min": 0, "max": 1, "opts": ["NO", "YES"]}, {"r": "D270", "l": "Boost on", "d": 0, "min": 0, "max": 2, "opts": ["AMPS", "FREQ", "BOTH"]}, {"r": "D260", "l": "Boost freq", "d": 2, "min": 0, "max": 99.99, "u": "Hz"}, {"r": "D123", "l": "Delay to boost", "d": 1, "min": 0, "max": 99.9, "u": "s"}, {"r": "D110", "l": "Boost amps %", "d": 0, "min": 0, "max": 99, "u": "%"}, {"r": "D122", "l": "Boost acc", "d": 2, "min": 0, "max": 99.99, "u": "s"}, {"r": "D124", "l": "Boost dec", "d": 2, "min": 0, "max": 99.99, "u": "s"}]}, {"t": "DRY RUN / RESTART", "i": [{"r": "D16", "l": "Dry run time", "d": 1, "min": 0, "max": 999.9, "u": "s"}, {"r": "D20", "l": "Auto restart", "d": 0, "min": 0, "max": 1, "opts": ["DISABLED", "ENABLED"]}, {"r": "D127", "l": "Restart hours", "d": 0, "min": 0, "max": 23, "u": "h"}, {"r": "D125", "l": "Restart min", "d": 0, "min": 0, "max": 59, "u": "min"}, {"r": "D129", "l": "Restart sec", "d": 0, "min": 0, "max": 59, "u": "s"}]}, {"t": "NO FLOW", "i": [{"r": "D152", "l": "No flow hertz", "d": 2, "min": 0, "max": 50, "u": "Hz"}, {"r": "D150", "l": "No flow det time", "d": 1, "min": 0, "max": 999.9, "u": "s"}]}, {"t": "BURST PIPE", "i": [{"r": "D322", "l": "Burst det time", "d": 0, "min": 0, "max": 99, "u": "s"}, {"r": "D324", "l": "Burst SP", "d": 0, "min": 0, "max": 100}]}, {"t": "PRIME & FILL", "i": [{"r": "D96", "l": "Prime stay on", "d": 0, "min": 0, "max": 1, "opts": ["NO", "YES"]}, {"r": "D164", "l": "Priming time", "d": 1, "min": 0, "max": 6553.5, "u": "s"}, {"r": "D158", "l": "Fill time", "d": 1, "min": 0, "max": 3200, "u": "s"}, {"r": "D166", "l": "Filling speed", "d": 2, "min": 0, "max": 60, "u": "Hz"}]}, {"t": "AUTO ACC/DEC", "i": [{"r": "D126", "l": "Accel 1", "d": 2, "min": 0, "max": 999.99, "u": "s"}, {"r": "D128", "l": "Decel", "d": 2, "min": 0, "max": 999.99, "u": "s"}, {"r": "D156", "l": "Accel 2", "d": 0, "min": 0, "max": 1, "opts": ["NO", "YES"]}, {"r": "D148", "l": "Accel 2 time", "d": 2, "min": 0, "max": 999.99, "u": "s"}, {"r": "D154", "l": "Acc 2 start", "d": 2, "min": 0, "max": 50, "u": "Hz"}]}, {"t": "MANUAL SPEED", "i": [{"r": "D144", "l": "Manual speed", "d": 2, "min": 3, "max": 650, "u": "Hz"}, {"r": "D266", "l": "Use auto acc/dec", "d": 0, "min": 0, "max": 1, "opts": ["NO", "YES"]}]}, {"t": "SLAVE MODE", "i": [{"r": "D332", "l": "Start hertz", "d": 2, "min": 0, "max": 60, "u": "Hz"}, {"r": "D336", "l": "Start time", "d": 1, "min": 0, "max": 6553.5, "u": "s"}, {"r": "D334", "l": "Stop hertz", "d": 2, "min": 0, "max": 60, "u": "Hz"}, {"r": "D338", "l": "Stop time", "d": 1, "min": 0, "max": 6553.5, "u": "s"}]}, {"t": "BACKFLUSH", "i": [{"r": "D342", "l": "No. of filters", "d": 0, "min": 0, "max": 4}, {"r": "D348", "l": "% setpoint start", "d": 0, "min": 0, "max": 100, "u": "%"}, {"r": "D346", "l": "BF duration", "d": 1, "min": 0, "max": 6553.5, "u": "s"}, {"r": "D344", "l": "BF interval", "d": 0, "min": 0, "max": 65535}, {"r": "D340", "l": "BF cycle time", "d": 1, "min": 0, "max": 6533.9, "u": "s"}]}, {"t": "DX CONTROL", "i": [{"r": "D358", "l": "Run time", "d": 0, "min": 0, "max": 65535}]}, {"t": "VFD FUNCTIONS", "i": [{"r": "D220", "l": "Run on command", "d": 0, "min": 0, "max": 1, "opts": ["NO", "YES"]}, {"r": "D222", "l": "Forced OCSPM", "d": 2, "min": 0, "max": 999.99}, {"r": "D394", "l": "App control", "d": 0, "min": 0, "max": 2, "opts": ["PANEL", "APP AUTO", "APP MAN"]}]}, {"t": "DRIVE: SPEED & RAMPS", "i": [{"r": "P01-00", "l": "01-00 Max output Hz", "d": 2, "min": 0, "max": 599, "u": "Hz"}, {"r": "P01-10", "l": "01-10 Upper limit", "d": 2, "min": 0, "max": 599, "u": "Hz"}, {"r": "P01-11", "l": "01-11 Lower limit", "d": 2, "min": 0, "max": 599, "u": "Hz"}, {"r": "P01-12", "l": "01-12 Accel time 1", "d": 2, "min": 0, "max": 600, "u": "s"}, {"r": "P01-13", "l": "01-13 Decel time 1", "d": 2, "min": 0, "max": 600, "u": "s"}]}, {"t": "DRIVE: MOTOR", "i": [{"r": "P05-01", "l": "05-01 Rated current", "d": 2, "min": 0, "max": 655.35, "u": "A"}, {"r": "P05-02", "l": "05-02 Rated power", "d": 2, "min": 0, "max": 655.35, "u": "kW"}, {"r": "P05-03", "l": "05-03 Rated speed", "d": 0, "min": 0, "max": 65535, "u": "rpm"}, {"r": "P05-04", "l": "05-04 Poles", "d": 0, "min": 2, "max": 20}, {"r": "P06-14", "l": "06-14 Thermal time", "d": 1, "min": 30, "max": 600, "u": "s"}]}, {"t": "DRIVE: PID", "i": [{"r": "P08-00", "l": "08-00 Feedback input", "d": 0, "min": 0, "max": 7}, {"r": "P08-01", "l": "08-01 P gain", "d": 1, "min": 0, "max": 100}, {"r": "P08-02", "l": "08-02 I time", "d": 2, "min": 0, "max": 100, "u": "s"}, {"r": "P08-03", "l": "08-03 D time", "d": 2, "min": 0, "max": 1, "u": "s"}, {"r": "P08-04", "l": "08-04 I upper limit", "d": 1, "min": 0, "max": 100, "u": "%"}, {"r": "P08-05", "l": "08-05 Output limit", "d": 1, "min": 0, "max": 110, "u": "%"}, {"r": "P08-65", "l": "08-65 Target source", "d": 0, "min": 0, "max": 5}]}, {"t": "DRIVE: CONTROL & COMMS", "i": [{"r": "P00-20", "l": "00-20 Freq source", "d": 0, "min": 0, "max": 9}, {"r": "P00-21", "l": "00-21 Run source", "d": 0, "min": 0, "max": 5}, {"r": "P09-00", "l": "09-00 Drive address", "d": 0, "min": 1, "max": 254, "ro": true}, {"r": "P09-01", "l": "09-01 Baud (kbps)", "d": 1, "min": 4.8, "max": 115.2, "ro": true}, {"r": "P09-04", "l": "09-04 Protocol", "d": 0, "min": 0, "max": 17, "ro": true}, {"r": "P09-35", "l": "09-35 PLC address", "d": 0, "min": 1, "max": 254, "ro": true}]}];

const PAGES = ["main", "power", "motor", "info", "all"];
const PAGE_TITLES = { main: "MAIN", power: "POWER", motor: "MOTOR", info: "INFO", all: "ALL VALUES" };

// What each assignable key can do
const FUNCTIONS = [
  ["page_main", "LCD page: Main (F / H / A)"],
  ["page_power", "LCD page: Power (V / kW)"],
  ["page_motor", "LCD page: Motor / pump"],
  ["page_info", "LCD page: Info (kWh / hours)"],
  ["page_all", "LCD page: All values"],
  ["settings", "Settings menu (pump program + drive parameters)"],
  ["timer", "Pump timer (start / stop times per weekday)"],
  ["preset", "Preset speed (Hz in 'Value')"],
  ["run", "Drive RUN"],
  ["stop", "Drive STOP"],
  ["reset", "Drive fault RESET"],
  ["fwd", "Drive direction FWD"],
  ["rev", "Drive direction REV"],
  ["toggle", "Toggle entity"],
  ["turn_on", "Turn entity on"],
  ["turn_off", "Turn entity off"],
  ["press", "Press button / run script"],
  ["more_info", "Show entity details"],
  ["action", "Home Assistant action (below)"],
  ["none", "Nothing"],
];

const KEY_DEFAULTS = {
  f1: { label: "MAIN", function: "page_main" },
  f2: { label: "POWR", function: "page_power" },
  f3: { label: "MOTR", function: "page_motor" },
  f4: { label: "INFO", function: "page_info" },
  menu: { function: "settings" },
  hand: { function: "none" },
  auto: { function: "timer" },
};

const LABELS = {
  name: "Name",
  logo: "Logo URL (empty = Hamlet logo, \"none\" = hide)",
  brand: "Text shown when logo is \"none\"",
  min_frequency: "Min Hz",
  max_frequency: "Max Hz",
  step: "Step Hz (▲ / ▼)",
  setpoint_type: "What do ▲ / ▼ / ENTER set?",
  p_unit: "Pressure unit",
  p_min: "Min set pressure",
  p_max: "Max set pressure",
  p_step: "Pressure step (▲ / ▼)",
  p_sensor_max: "Transducer range (full scale)",
  p_fmax: "Drive max Hz (01-00)",
  pressure_setpoint: "Set pressure read back from drive (optional)",
  pressure_setpoint_entity: "Set pressure — number / input_number",
  box1: "Box 1 (right, middle)",
  box2: "Box 2 (right, bottom)",
  decimals: "Decimals",
  unit: "Unit (empty = from entity)",
  tap: "When tapped",
  status: "Status word (2101H) — required",
  fault: "Fault code (2100H)",
  frequency_command: "Frequency command (2102H)",
  output_frequency: "Output frequency (2103H) — required",
  output_current: "Output current",
  output_voltage: "Output voltage",
  dc_bus_voltage: "DC bus voltage",
  output_power: "Output power (kW)",
  motor_speed: "Motor speed (rpm)",
  igbt_temperature: "IGBT temperature",
  pid_feedback: "Actual pressure / PID feedback",
  energy: "Energy (kWh)",
  run_hours: "Run hours",
  sleep: "Pump program: SLEEP flag",
  boost: "Pump program: BOOSTING flag",
  no_load: "Pump program: NO LOAD flag",
  pump_fault: "Pump program: FAULT flag",
  app_mode: "Pump program: APP CONTROL MODE (0 Panel / 1 App Auto / 2 App Man)",
  run_days: "Runtime days",
  run_minutes: "Runtime minutes",
  plc: "Pump program PLC (Modbus)",
  plc_slave: "PLC Modbus address (09-35)",
  setpoint_register: "Setpoint register (D304 = 4400)",
  setpoint_scale: "Setpoint scale (100 = 0.00 bar)",
  app_mode_register: "App mode register (D394 = 4490)",
  run_register: "App start/stop/reset register (D395 = 4491)",
  entity_prefix: "Menu sensors: program prefix (pump, pump2…)",
  drive_prefix: "Menu sensors: drive prefix (vfd, vfd2…)",
  schedule: "Timer schedule — input_text (empty = input_text.<prefix>_timer)",
  enable: "Timer ON/OFF — input_boolean (empty = input_boolean.<prefix>_timer)",
  mode: "How does Home Assistant talk to the drive?",
  running: "Running (binary sensor / switch — on = running)",
  reverse: "Reverse (binary sensor / switch — on = REV)",
  remote: "Remote / AUTO (binary sensor — on = remote)",
  direction_entity: "Direction switch (on = REV)",
  hub: "Modbus hub name",
  slave: "Drive Modbus address (09-00)",
  run_entity: "START — switch, button or script (switch is turned ON)",
  stop_entity: "STOP — switch, button or script (switch is turned ON; empty = turn START switch OFF)",
  app_control_entity: "APP CONTROL — switch / input_boolean (middle key)",
  pulse_seconds: "Pulse switches (s) — 0 = stay on, e.g. 1 = push-button pulse",
  reset_entity: "RESET — button or script",
  setpoint_entity: "Speed setpoint — number / input_number (Hz)",
  show_controls: "Show RUN / STOP / speed keys",
  allow_reverse: "Allow reverse",
  confirm_actions: "Tap twice to confirm",
  default_page: "Start page",
  pin: "PIN to change settings (empty = no PIN)",
  label: "Label on screen (max 5)",
  function: "Function",
  value: "Value (Hz for preset)",
  entity: "Entity (toggle / press / details)",
  tap_action: "Home Assistant action",
};

const ENTITY_KEYS = [
  "status", "fault", "frequency_command", "output_frequency", "output_current",
  "output_voltage", "dc_bus_voltage", "output_power", "motor_speed",
  "igbt_temperature", "pid_feedback", "energy", "run_hours",
];

const CHEVRON = {
  up: "M5 15.5l7-7 7 7",
  down: "M5 8.5l7 7 7-7",
  left: "M15.5 5l-7 7 7 7",
  right: "M8.5 5l7 7-7 7",
};
const chev = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${CHEVRON[d]}"/></svg>`;

const MODES = [
  { value: "modbus", label: "RS-485 Modbus — card talks to the drive directly" },
  { value: "entities", label: "Home Assistant entities — use sensors / switches you already have" },
];

function cardMode(config) {
  if (config.mode === "modbus" || config.mode === "entities") return config.mode;
  return (config.control && config.control.hub) || (config.entities && config.entities.status) ? "modbus" : "entities";
}

function buildSchema(config) {
  const mode = cardMode(config || {});
  const pressure = (config || {}).setpoint_type === "pressure";
  const pUnit = (config || {}).p_unit || "bar";
  const SENS = ["sensor", "number", "input_number"];
  const BIN = ["binary_sensor", "switch", "input_boolean", "sensor"];
  const ent = (name, domain = SENS) => ({ name, selector: { entity: { domain } } });
  const keyForm = (name, title) => ({
    type: "expandable",
    name,
    title,
    schema: [
      {
        type: "grid",
        schema: [
          { name: "label", selector: { text: {} } },
          { name: "function", selector: { select: { mode: "dropdown", options: FUNCTIONS.map(([value, label]) => ({ value, label })) } } },
        ],
      },
      {
        type: "grid",
        schema: [
          { name: "value", selector: { number: { min: 0, max: 600, step: 0.1, mode: "box", unit_of_measurement: "Hz" } } },
          { name: "entity", selector: { entity: {} } },
        ],
      },
      { name: "tap_action", selector: { ui_action: {} } },
    ],
  });

  const stateSensors = mode === "modbus"
    ? [ent("status", ["sensor"]), ent("fault", ["sensor"])]
    : [ent("running", BIN), ent("fault", ["binary_sensor", "sensor"]), ent("reverse", BIN), ent("remote", BIN)];
  const readings = ["frequency_command", "output_frequency", "output_current", "output_voltage", "dc_bus_voltage",
    "output_power", "motor_speed", "igbt_temperature", "pid_feedback",
    "energy", "run_hours", "run_days", "run_minutes"].map((k) => ent(k));
  const program = [
    ent("sleep", ["binary_sensor"]), ent("boost", ["binary_sensor"]), ent("no_load", ["binary_sensor"]),
    ent("pump_fault", ["binary_sensor"]), ent("app_mode", ["sensor", "input_select", "input_number", "number", "select"]),
  ];

  const control = mode === "modbus"
    ? [{
        type: "grid",
        schema: [
          { name: "hub", selector: { text: {} } },
          { name: "slave", selector: { number: { min: 1, max: 254, mode: "box" } } },
        ],
      },
      ent("app_control_entity", ["switch", "input_boolean"]),
      ent("run_entity", ["button", "script", "input_button", "switch", "input_boolean"]),
      ent("stop_entity", ["button", "script", "input_button", "switch", "input_boolean"])]
    : [
        ent("run_entity", ["button", "script", "input_button", "switch", "input_boolean"]),
        ent("stop_entity", ["button", "script", "input_button", "switch", "input_boolean"]),
        ent("reset_entity", ["button", "script", "input_button"]),
        ...(pressure ? [ent("pressure_setpoint_entity", ["number", "input_number"])] : [ent("setpoint_entity", ["number", "input_number"])]),
        ent("app_control_entity", ["switch", "input_boolean"]),
        { name: "pulse_seconds", selector: { number: { min: 0, max: 10, step: 0.5, mode: "box", unit_of_measurement: "s" } } },
        ent("direction_entity", ["switch", "input_boolean"]),
      ];

  return [
    { name: "mode", required: true, selector: { select: { mode: "list", options: MODES } } },
    { name: "name", selector: { text: {} } },
    {
      type: "grid",
      schema: [
        { name: "logo", selector: { text: {} } },
        { name: "brand", selector: { text: {} } },
      ],
    },
    {
      name: "setpoint_type",
      selector: { select: { mode: "list", options: [
        { value: "speed", label: "Speed (Hz) — normal VFD speed control" },
        { value: "pressure", label: "Pressure (PID) — set pressure, drive regulates speed" },
      ] } },
    },
    ...(pressure ? [{
      type: "grid",
      schema: [
        { name: "p_min", selector: { number: { min: 0, max: 1000, step: 0.1, mode: "box", unit_of_measurement: pUnit } } },
        { name: "p_max", selector: { number: { min: 0, max: 1000, step: 0.1, mode: "box", unit_of_measurement: pUnit } } },
        { name: "p_step", selector: { number: { min: 0.01, max: 10, step: 0.01, mode: "box", unit_of_measurement: pUnit } } },
        { name: "p_unit", selector: { select: { mode: "dropdown", options: ["bar", "kPa", "psi", "m", "%"] } } },
        ...(mode === "modbus" ? [
          { name: "p_sensor_max", selector: { number: { min: 0.1, max: 1000, step: 0.1, mode: "box", unit_of_measurement: pUnit } } },
          { name: "p_fmax", selector: { number: { min: 1, max: 600, step: 0.5, mode: "box", unit_of_measurement: "Hz" } } },
        ] : []),
      ],
    }] : []),
    {
      type: "grid",
      schema: [
        { name: "min_frequency", selector: { number: { min: 0, max: 600, step: 0.5, mode: "box", unit_of_measurement: "Hz" } } },
        { name: "max_frequency", selector: { number: { min: 1, max: 600, step: 0.5, mode: "box", unit_of_measurement: "Hz" } } },
        ...(pressure ? [] : [{ name: "step", selector: { number: { min: 0.01, max: 10, step: 0.01, mode: "box", unit_of_measurement: "Hz" } } }]),
      ],
    },
    {
      type: "expandable",
      name: "entities",
      title: mode === "modbus" ? "Drive sensors (from the Modbus package)" : "Drive sensors (any HA entities)",
      expanded: true,
      schema: [...stateSensors, ...readings, ...(pressure ? [ent("pressure_setpoint")] : [])],
    },
    {
      type: "expandable",
      name: "entities",
      title: "Pump program (Single Pump V9): status flags & app mode",
      schema: program,
    },
    ...(mode === "modbus" ? [{
      type: "expandable",
      name: "plc",
      title: "Pump program PLC — where the card writes setpoint / app mode",
      schema: [{
        type: "grid",
        schema: [
          { name: "slave", selector: { number: { min: 1, max: 254, mode: "box" } } },
          { name: "setpoint_register", selector: { number: { min: 0, max: 65535, mode: "box" } } },
          { name: "setpoint_scale", selector: { number: { min: 1, max: 1000, mode: "box" } } },
          { name: "app_mode_register", selector: { number: { min: 0, max: 65535, mode: "box" } } },
          { name: "run_register", selector: { number: { min: 0, max: 65535, mode: "box" } } },
          { name: "entity_prefix", selector: { text: {} } },
          { name: "drive_prefix", selector: { text: {} } },
        ],
      }],
    }, {
      type: "expandable",
      name: "timer",
      title: "Pump timer (TIMER key) — needs the pump timer package",
      schema: [ent("schedule", ["input_text"]), ent("enable", ["input_boolean"])],
    }] : []),
    {
      type: "expandable",
      name: "control",
      title: mode === "modbus" ? "Control — RS-485 Modbus" : "Control — Home Assistant entities",
      expanded: true,
      schema: control,
    },
    ...(pressure ? [{
      type: "expandable",
      name: "boxes",
      title: "Pump screen: boxes on the right",
      schema: ["box1", "box2"].map((b, i) => ({
        type: "expandable",
        name: b,
        title: i === 0 ? "Box 1 (under PRESENT VALUE)" : "Box 2 (bottom right)",
        schema: [
          { name: "entity", selector: { entity: {} } },
          {
            type: "grid",
            schema: [
              { name: "label", selector: { text: {} } },
              { name: "unit", selector: { text: {} } },
              { name: "decimals", selector: { number: { min: 0, max: 3, mode: "box" } } },
              { name: "tap", selector: { select: { mode: "dropdown", options: [
                { value: "more_info", label: "Show details / history" },
                { value: "toggle", label: "Toggle (switches, valves…)" },
                { value: "none", label: "Nothing" },
              ] } } },
            ],
          },
        ],
      })),
    }] : []),
    {
      type: "expandable",
      name: "keys",
      title: "Keys: F1–F4, MENU, HAND, AUTO",
      schema: [
        keyForm("f1", "F1"), keyForm("f2", "F2"), keyForm("f3", "F3"), keyForm("f4", "F4"),
        keyForm("menu", "MENU"), keyForm("hand", "HAND"), keyForm("auto", "AUTO"),
      ],
    },
    {
      type: "grid",
      schema: [
        { name: "show_controls", selector: { boolean: {} } },
        { name: "allow_reverse", selector: { boolean: {} } },
        { name: "confirm_actions", selector: { boolean: {} } },
        { name: "pin", selector: { text: { type: "password" } } },
        { name: "default_page", selector: { select: { mode: "dropdown", options: PAGES.map((p) => ({ value: p, label: PAGE_TITLES[p] })) } } },
      ],
    },
  ];
}

class DeltaCP2000CardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { mode: cardMode(config), ...config };
    this._draw();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  _draw() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => LABELS[s.name] || s.name;
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = ev.detail.value;
        const modeChanged = config.mode !== this._config.mode || config.setpoint_type !== this._config.setpoint_type || config.p_unit !== this._config.p_unit;
        this._config = config;
        if (modeChanged) this._form.schema = buildSchema(config);
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    if (this._hass) this._form.hass = this._hass;
    this._form.data = this._config;
    this._form.schema = buildSchema(this._config);
  }
}

class DeltaCP2000Card extends HTMLElement {
  static getConfigElement() {
    return document.createElement("delta-cp2000-card-editor");
  }

  static getStubConfig() {
    return {
      mode: "modbus",
      name: "Borehole Pump",
      max_frequency: 50,
      entities: {
        status: "sensor.vfd_status_word",
        fault: "sensor.vfd_fault_code",
        frequency_command: "sensor.vfd_frequency_command",
        output_frequency: "sensor.vfd_output_frequency",
        output_current: "sensor.vfd_output_current",
        output_voltage: "sensor.vfd_output_voltage",
        dc_bus_voltage: "sensor.vfd_dc_bus_voltage",
        output_power: "sensor.vfd_output_power",
        motor_speed: "sensor.vfd_motor_speed",
        igbt_temperature: "sensor.vfd_igbt_temperature",
      },
      control: { hub: "vfd", slave: 1 },
      keys: {
        f1: { label: "MAIN", function: "page_main" },
        f2: { label: "POWR", function: "page_power" },
        f3: { label: "MOTR", function: "page_motor" },
        f4: { label: "INFO", function: "page_info" },
      },
    };
  }

  setConfig(config) {
    if (!config || !config.entities || !(config.entities.output_frequency || config.entities.running || config.entities.status)) {
      throw new Error("Pick at least the output frequency sensor (Drive sensors) — see README");
    }
    const keys = {};
    for (const [k, def] of Object.entries(KEY_DEFAULTS)) {
      const user = (config.keys && config.keys[k]) || {};
      const merged = { ...def, ...user };
      // user changed the function but not the label -> don't keep the old default label
      if (!user.label && user.function && user.function !== def.function) delete merged.label;
      keys[k] = merged;
    }
    let dp = config.default_page;
    if (typeof dp === "number") dp = PAGES[dp - 1];
    this._config = {
      name: "VFD",
      brand: "",
      min_frequency: 0,
      max_frequency: 50,
      step: 0.5,
      show_controls: true,
      allow_reverse: false,
      confirm_actions: true,
      ...config,
      setpoint_type: "speed",
      p_unit: "bar",
      p_min: 0,
      p_max: 10,
      p_step: 0.1,
      p_sensor_max: 10,
      ...config,
      mode: cardMode(config),
      default_page: PAGES.includes(dp) ? dp : "main",
      entities: { ...config.entities },
      control: { slave: 1, ...(config.control || {}) },
      keys,
    };
    this._page = this._config.default_page;
    this._sp = null;
    this._built = false;
    this._lastHtml = null;
    if (this._hass) {
      this._render();
      this._update();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._built) this._render();
    this._update();
  }

  getCardSize() {
    return 9;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  /* ---------------- helpers ---------------- */

  _st(key) {
    const id = this._config.entities[key];
    return id && this._hass ? this._hass.states[id] : undefined;
  }

  _num(key) {
    const s = this._st(key);
    if (!s) return null;
    const v = parseFloat(s.state);
    if (!Number.isFinite(v)) return null;
    // power / energy sensors in W / Wh are shown in kW / kWh
    const u = s.attributes && s.attributes.unit_of_measurement;
    if ((key === "output_power" && u === "W") || (key === "energy" && u === "Wh")) return v / 1000;
    return v;
  }

  _unit(key, fallback) {
    const s = this._st(key);
    return (s && s.attributes.unit_of_measurement) || fallback;
  }

  _fmt(v, dp) {
    return v === null || v === undefined ? "—" : Number(v).toFixed(dp);
  }

  _moreInfo(key) {
    const id = this._config.entities[key] || (key && key.includes(".") ? key : null);
    if (!id) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: id } }));
  }

  _toast(message) {
    this.dispatchEvent(new CustomEvent("hass-notification", { bubbles: true, composed: true, detail: { message } }));
  }

  /* ---------------- drive control ---------------- */

  _isModbus() {
    return this._config.mode === "modbus" && !!this._config.control.hub;
  }

  _switchLike(id) {
    return !!id && ["switch", "input_boolean", "light", "fan"].includes(id.split(".")[0]);
  }

  _canControl(kind) {
    const c = this._config.control;
    const mb = this._isModbus();
    if (kind === "setpoint") return this._isPressure() ? !!c.pressure_setpoint_entity || mb || !!this._plc() : !!c.setpoint_entity || mb;
    if (kind === "fwd" || kind === "rev") return !!c.direction_entity || mb;
    if (["run", "stop", "reset"].includes(kind) && this._plc() && this._plc().run_register) return true;
    if (kind === "stop") return !!c.stop_entity || this._switchLike(c.run_entity) || mb;
    return !!c[`${kind}_entity`] || mb;
  }

  async _writeRegister(address, value, slave) {
    const c = this._config.control;
    await this._hass.callService("modbus", "write_register", {
      hub: c.hub,
      slave: Number(slave || c.slave) || 1,
      address,
      value,
    });
  }

  /* ---- pump program PLC (Single Pump V9) ---- */
  _plc() {
    const p = this._config.plc;
    return p && this._config.control.hub ? p : null;
  }

  _plcSlave() {
    return Number(this._plc() && this._plc().slave) || 2;
  }

  // 0 = PANEL, 1 = APP AUTO, 2 = APP MAN ; null when not used
  _appMode() {
    const id = this._config.entities.app_mode;
    const st = id && this._hass ? this._hass.states[id] : null;
    if (!st) return null;
    const raw = String(st.state).toLowerCase();
    const v = parseFloat(raw);
    if (Number.isFinite(v)) return Math.round(v);
    if (raw.includes("man")) return 2;
    if (raw.includes("auto") || raw.includes("app")) return 1;
    if (raw.includes("panel")) return 0;
    return null;
  }

  _flag(key) {
    const st = this._st(key);
    return !!st && st.state === "on";
  }

  async _pressEntity(entityId, on = true) {
    const domain = entityId.split(".")[0];
    if (domain === "button" || domain === "input_button") {
      await this._hass.callService(domain, "press", { entity_id: entityId });
    } else if (domain === "script") {
      await this._hass.callService("script", "turn_on", { entity_id: entityId });
    } else if (domain === "scene") {
      await this._hass.callService("scene", "turn_on", { entity_id: entityId });
    } else if (domain === "automation") {
      await this._hass.callService("automation", "trigger", { entity_id: entityId });
    } else {
      await this._hass.callService("homeassistant", on ? "turn_on" : "turn_off", { entity_id: entityId });
    }
  }

  async _command(kind) {
    const c = this._config.control;
    if (!this._canControl(kind)) {
      this._toast(`${this._config.name}: ${kind.toUpperCase()} not set up — add it under Control in the card settings`);
      return;
    }
    if (kind !== "stop" && this._appBlocked()) {
      this._toast(`${this._config.name}: APP CONTROL is off — switch it on first`);
      return;
    }
    const mb = this._isModbus();
    const plc = this._plc();
    // Single Pump V9 program: the app starts / stops / resets through D395 (APP_START_AND_RESET)
    if (plc && plc.run_register !== undefined && plc.run_register !== "" && ["run", "stop", "reset"].includes(kind)) {
      const val = { run: 1, stop: 0, reset: 2 }[kind];
      try {
        await this._writeRegister(Number(plc.run_register), val, this._plcSlave());
        if (kind === "stop" && this._appMode() === 0) this._toast(`${this._config.name}: drive is in PANEL control — stop it on the drive`);
        else this._toast(`${this._config.name}: ${kind.toUpperCase()} sent`);
      } catch (e) {
        this._toast(`${this._config.name}: ${kind.toUpperCase()} failed — ${e.message || e}`);
      }
      return;
    }
    try {
      if (kind === "run") {
        if (this._switchLike(c.run_entity)) await this._switchOn(c.run_entity, c.stop_entity && c.stop_entity !== c.run_entity && this._switchLike(c.stop_entity) && !this._pulse() ? c.stop_entity : null);
        else if (c.run_entity) await this._pressEntity(c.run_entity, true);
        else if (mb) await this._writeRegister(8192, 0x0002);
      } else if (kind === "stop") {
        if (c.stop_entity && c.stop_entity === c.run_entity) await this._hass.callService("homeassistant", "turn_off", { entity_id: c.run_entity });
        else if (this._switchLike(c.stop_entity)) await this._switchOn(c.stop_entity, this._switchLike(c.run_entity) && !this._pulse() ? c.run_entity : null);
        else if (c.stop_entity) await this._pressEntity(c.stop_entity, false);
        else if (this._switchLike(c.run_entity)) await this._hass.callService("homeassistant", "turn_off", { entity_id: c.run_entity });
        else if (mb) await this._writeRegister(8192, 0x0001);
      } else if (kind === "reset") {
        if (c.reset_entity) await this._pressEntity(c.reset_entity, true);
        else if (mb) await this._writeRegister(8194, 0x0002);
      } else if (kind === "fwd" || kind === "rev") {
        if (c.direction_entity) {
          await this._hass.callService("homeassistant", kind === "rev" ? "turn_on" : "turn_off", { entity_id: c.direction_entity });
        } else if (mb) await this._writeRegister(8192, kind === "rev" ? 0x0020 : 0x0010);
      }
      this._toast(`${this._config.name}: ${kind.toUpperCase()} sent`);
    } catch (e) {
      this._toast(`${this._config.name}: ${kind.toUpperCase()} failed — ${e.message || e}`);
    }
  }

  _pulse() {
    const p = Number(this._config.control.pulse_seconds);
    return Number.isFinite(p) && p > 0 ? p : 0;
  }

  // Turn a start/stop switch on. With pulse_seconds it is switched off again after the pulse
  // (like pressing a push button wired to the drive's DI terminals). Without a pulse, the
  // opposite switch is switched off so START and STOP are never both on.
  async _switchOn(entityId, opposite) {
    if (opposite) await this._hass.callService("homeassistant", "turn_off", { entity_id: opposite });
    await this._hass.callService("homeassistant", "turn_on", { entity_id: entityId });
    const p = this._pulse();
    if (p) setTimeout(() => this._hass.callService("homeassistant", "turn_off", { entity_id: entityId }), p * 1000);
  }

  _appOn() {
    const m = this._appMode();
    if (m !== null) return m > 0;
    const id = this._config.control.app_control_entity;
    const s = id && this._hass ? this._hass.states[id] : null;
    return !!s && s.state === "on";
  }

  // In entities mode with an APP CONTROL switch: only allow RUN / speed / reset while it is on.
  _appBlocked() {
    if (this._config.entities.app_mode && this._appMode() !== null) return this._appMode() === 0;
    return !!this._config.control.app_control_entity && !this._appOn();
  }

  /* ---- pressure (PID) helpers ---- */
  _isPressure() {
    return this._config.setpoint_type === "pressure";
  }

  _fmax() {
    const v = Number(this._config.p_fmax);
    return Number.isFinite(v) && v > 0 ? v : this._config.max_frequency;
  }

  // Modbus PID: the CP2000 takes its PID target from the frequency command (08-65 = 0),
  // where 01-00 max Hz = 100 % = transducer full scale.
  _hzToP(hz) {
    return hz === null ? null : (hz / this._fmax()) * Number(this._config.p_sensor_max);
  }

  _pToHz(p) {
    return (p / Number(this._config.p_sensor_max)) * this._fmax();
  }

  _pressureNow() {
    const v = this._num("pid_feedback");
    if (v === null) return null;
    // only a sensor that really reports % (e.g. Modbus 220AH) is scaled with the transducer range
    return this._unit("pid_feedback", "") === "%" && this._config.p_unit !== "%" ? (v * Number(this._config.p_sensor_max)) / 100 : v;
  }

  _spDecimals() {
    if (!this._isPressure()) return 2;
    const st = String(this._config.p_step);
    return Math.min(3, Math.max(1, st.includes(".") ? st.split(".")[1].length : 0));
  }

  // setpoint as the drive / HA currently has it (Hz or pressure)
  _spReading() {
    const c = this._config.control;
    const fromEnt = (id) => {
      const st = id && this._hass.states[id];
      const v = st ? parseFloat(st.state) : NaN;
      return Number.isFinite(v) ? v : null;
    };
    if (this._isPressure()) {
      // prefer the setpoint read back from the drive, so the screen shows what the drive really has
      if (this._config.entities.pressure_setpoint && this._num("pressure_setpoint") !== null) return this._num("pressure_setpoint");
      if (c.pressure_setpoint_entity) return fromEnt(c.pressure_setpoint_entity);
      return this._hzToP(this._num("frequency_command"));
    }
    if (c.setpoint_entity) return fromEnt(c.setpoint_entity);
    return this._num("frequency_command");
  }

  async _sendSetpoint(hz = this._sp) {
    if (hz === null || hz === undefined) return;
    const c = this._config.control;
    const pressure = this._isPressure();
    if (this._appBlocked()) {
      this._toast(`${this._config.name}: APP CONTROL is off — switch it on first`);
      return;
    }
    if (!this._canControl("setpoint")) {
      this._toast(`${this._config.name}: no ${pressure ? "pressure" : "speed"} control set up — see Control in the card settings`);
      return;
    }
    this._sp = hz;
    try {
      const ent = pressure ? c.pressure_setpoint_entity : c.setpoint_entity;
      if (ent) {
        await this._hass.callService(ent.split(".")[0], "set_value", { entity_id: ent, value: hz });
      } else {
        const plc = this._plc();
        if (pressure && plc && plc.setpoint_register !== undefined && plc.setpoint_register !== "") {
          await this._writeRegister(Number(plc.setpoint_register), Math.round(hz * (Number(plc.setpoint_scale) || 100)), this._plcSlave());
        } else {
          await this._writeRegister(8193, Math.round((pressure ? this._pToHz(hz) : hz) * 100));
        }
      }
      this._toast(pressure
        ? `${this._config.name}: pressure set to ${hz.toFixed(this._spDecimals())} ${this._config.p_unit}`
        : `${this._config.name}: speed set to ${hz.toFixed(2)} Hz`);
      this._spSentAt = Date.now();
    } catch (e) {
      this._toast(`${this._config.name}: setpoint failed — ${e.message || e}`);
    }
    this._update();
  }

  _confirmThen(btn, fn) {
    if (!this._config.confirm_actions) return fn();
    if (btn.dataset.armed === "1") {
      btn.dataset.armed = "";
      btn.classList.remove("armed");
      clearTimeout(btn._t);
      return fn();
    }
    btn.dataset.armed = "1";
    btn.classList.add("armed");
    btn._t = setTimeout(() => {
      btn.dataset.armed = "";
      btn.classList.remove("armed");
    }, 3000);
  }

  _clamp(v) {
    const p = this._isPressure();
    const lo = Number(p ? this._config.p_min : this._config.min_frequency);
    const hi = Number(p ? this._config.p_max : this._config.max_frequency);
    return Math.round(Math.min(hi, Math.max(lo, v)) * 1000) / 1000;
  }

  _currentSetpoint() {
    if (this._sp !== null) return this._sp;
    const r = this._spReading();
    return r === null ? Number(this._isPressure() ? this._config.p_min : this._config.min_frequency) : r;
  }

  _nudge(dir) {
    const step = Number(this._isPressure() ? this._config.p_step : this._config.step) || 0.1;
    if (!this._config.show_controls || !this._canControl("setpoint")) {
      this._turnPage(dir > 0 ? -1 : 1);
      return;
    }
    const base = this._currentSetpoint();
    this._sp = this._clamp(Math.round((base + dir * step) / step) * step);
    this._spSentAt = null;
    this._page = "main"; // show the blinking F line
    this._update();
  }

  _turnPage(dir) {
    const i = PAGES.indexOf(this._page);
    this._page = PAGES[(i + dir + PAGES.length) % PAGES.length];
    this._update();
  }

  _esc() {
    if (this._sp !== null && !this._spSentAt) this._sp = null; // cancel speed edit
    this._page = this._config.default_page;
    this._update();
  }

  /* ---------------- assignable keys ---------------- */

  _keyLabel(name) {
    const k = this._config.keys[name];
    if (k.label) return String(k.label);
    const f = k.function;
    if (f && f.startsWith("page_")) return { page_main: "MAIN", page_power: "POWR", page_motor: "MOTR", page_info: "INFO", page_all: "ALL" }[f];
    if (f === "preset") return k.value !== undefined ? (this._isPressure() ? `${k.value}` : `${k.value}Hz`) : "PRSET";
    if (["run", "stop", "fwd", "rev"].includes(f)) return f.toUpperCase();
    if (f === "reset") return "RST";
    if (f === "timer") return "TIMER";
    if (k.entity && this._hass && this._hass.states[k.entity]) {
      const n = this._hass.states[k.entity].attributes.friendly_name || k.entity.split(".")[1];
      return n.toUpperCase();
    }
    if (f === "action") return "ACT";
    return "—";
  }

  _keyActive(name) {
    const k = this._config.keys[name];
    const f = k.function || "none";
    if (f.startsWith("page_")) return this._page === f.slice(5);
    if (f === "timer") { const t = this._timerIds(); const s = this._hass && this._hass.states[t.enable]; return !!s && s.state === "on"; }
    if (["toggle", "turn_on", "turn_off", "more_info"].includes(f) && k.entity && this._hass) {
      const s = this._hass.states[k.entity];
      return !!s && ["on", "open", "home", "heat", "playing", "active"].includes(s.state);
    }
    if (f === "preset") {
      const r = this._spReading();
      return r !== null && Math.abs(r - Number(k.value)) < (this._isPressure() ? Number(this._config.p_step) / 2 : 0.011);
    }
    return false;
  }

  _doKey(name, btn) {
    const k = this._config.keys[name];
    const f = k.function || "none";
    const label = this._keyLabel(name);
    const needEntity = () => {
      if (k.entity) return true;
      this._toast(`${label}: pick an entity for this key in the card settings`);
      return false;
    };
    if (f === "settings") {
      if (!this._menuAvailable()) { this._page = "all"; this._update(); return; }
      this._page = "menu";
      this._m = { lvl: "g", g: (this._m && this._m.g) || 0, i: 0 };
      this._update();
      return;
    }
    if (f.startsWith("page_")) {
      this._page = f.slice(5);
      this._update();
      return;
    }
    if (f === "timer") return this._timerToggle();
    switch (f) {
      case "preset": {
        const v = Number(k.value);
        if (!Number.isFinite(v)) return this._toast(`${label}: set a Hz value for this key`);
        this._sendSetpoint(this._clamp(v));
        return;
      }
      case "run":
      case "reset":
      case "fwd":
      case "rev":
        return this._confirmThen(btn, () => this._command(f));
      case "stop":
        return this._command("stop");
      case "toggle":
        if (needEntity()) this._hass.callService("homeassistant", "toggle", { entity_id: k.entity });
        return;
      case "turn_on":
      case "turn_off":
        if (needEntity()) this._hass.callService("homeassistant", f, { entity_id: k.entity });
        return;
      case "press":
        if (needEntity()) this._confirmThen(btn, () => this._pressEntity(k.entity, true));
        return;
      case "more_info":
        if (needEntity()) this._moreInfo(k.entity);
        return;
      case "action":
        if (!k.tap_action) return this._toast(`${label}: choose a Home Assistant action in the card settings`);
        this.dispatchEvent(new CustomEvent("hass-action", {
          bubbles: true,
          composed: true,
          detail: { config: { entity: k.entity, tap_action: k.tap_action }, action: "tap" },
        }));
        return;
      default:
        this._toast(`${name.toUpperCase()} key has no function yet — set it in the card settings`);
    }
  }

  /* ---------------- render ---------------- */

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const cfg = this._config;
    const hideLogo = cfg.logo === false || cfg.logo === "none";
    const brand = hideLogo
      ? `<div class="brand">${this._esc_(cfg.brand || "")}</div>`
      : `<img class="logo" src="${cfg.logo ? this._esc_(cfg.logo) : HAMLET_LOGO}" alt="Hamlet Elektries">`;
    const entMode = cfg.mode === "entities";
    const showRow = cfg.show_controls && (entMode || ["run", "stop", "reset"].some((k) => this._canControl(k)));
    const bkTxt = (k, dflt) => (cfg.keys[k] && cfg.keys[k].function === "timer" ? "TIMER" : dflt);

    this.shadowRoot.innerHTML = `
      <style>${this._css()}</style>
      <ha-card>
        <div class="head">
          ${brand}
          <div class="pill" id="pill"><span class="dot"></span><span id="pilltxt">—</span></div>
        </div>
        <div class="title">
          <div class="name">${this._esc_(cfg.name)}</div>
          <div class="model">CP2000 · VFD</div>
        </div>

        <div class="keypad">
          <div class="bezel">
            <div class="lcd" id="lcd">
              <div class="inv top">
                <span id="t_mode">—</span>
                <span id="t_dir">FWD</span>
                <span id="t_run">STOP</span>
                <span class="grow"></span>
                <span id="t_page">MAIN</span>
              </div>
              <div class="screen" id="screen"></div>
              <div class="softbar">
                <span id="sb_f1"></span><span id="sb_f2"></span><span id="sb_f3"></span><span id="sb_f4"></span>
              </div>
            </div>
            <div class="fkeys">
              <button class="fk" data-key="f1">F1</button>
              <button class="fk" data-key="f2">F2</button>
              <button class="fk" data-key="f3">F3</button>
              <button class="fk" data-key="f4">F4</button>
            </div>
          </div>

          <div class="leds">
            <span class="led">ERR<i id="led_err"></i></span>
            <span class="led can"><span class="canl">COM</span><i id="led_com"></i></span>
            <span class="led"><i id="led_run"></i>RUN</span>
          </div>

          <div class="pad">
            <button class="bk" id="k_esc">ESC</button>
            <button class="gk up" id="k_up" title="Speed up">${chev("up")}</button>
            <button class="bk" data-key="menu" id="k_menu">${bkTxt("menu", "MENU")}</button>

            <button class="gk left" id="k_left" title="Previous page">${chev("left")}</button>
            <button class="enter" id="k_enter" title="Send speed to drive">ENTER</button>
            <button class="gk right" id="k_right" title="Next page">${chev("right")}</button>

            <button class="bk" data-key="hand" id="k_hand">${bkTxt("hand", "HAND")}</button>
            <button class="gk down" id="k_down" title="Speed down">${chev("down")}</button>
            <button class="bk" data-key="auto" id="k_auto">${bkTxt("auto", "AUTO")}</button>
          </div>

          ${showRow ? `
          <div class="minileds"><i id="ml_run"></i><i id="ml_dir"></i><i id="ml_stop"></i></div>
          <div class="runrow">
            <button class="runkey" id="b_run">RUN</button>
            ${entMode || cfg.control.app_control_entity || cfg.entities.app_mode
              ? `<button class="appkey" id="b_app"><span id="app_l1">APP</span><br><span id="app_l2">CONTROL</span></button>`
              : `<button class="fwdrev" id="b_dir"><span class="fw">FWD</span><span class="rv">REV</span></button>`}
            <button class="stopkey" id="b_stop">STOP<br>RESET</button>
          </div>` : ""}
        </div>
        <div class="tpanel" id="tpanel" hidden></div>
      </ha-card>`;

    const root = this.shadowRoot;
    const on = (id, fn) => {
      const el = root.getElementById(id);
      if (el) el.addEventListener("click", () => fn(el));
    };
    root.getElementById("screen").addEventListener("click", (ev) => {
      if (ev.target.closest("input")) return;
      const mr = ev.target.closest("[data-mi]");
      if (mr && this._m) {
        const idx = Number(mr.dataset.mi);
        if (this._m.lvl === "g") this._m.g = idx; else this._m.i = idx;
        this._menuKey("enter");
        return;
      }
      const bx = ev.target.closest("[data-box]");
      if (bx) return this._tapBox(bx.dataset.box);
      const sk = ev.target.closest("[data-soft]");
      if (sk) return this._doKey(sk.dataset.soft, root.querySelector(`.fk[data-key="${sk.dataset.soft}"]`));
      const k = ev.target.closest("[data-ent]");
      if (k) this._moreInfo(k.dataset.ent);
    });
    root.querySelectorAll("button[data-key]").forEach((b) =>
      b.addEventListener("click", () => this._doKey(b.dataset.key, b))
    );
    ["f1", "f2", "f3", "f4"].forEach((k) =>
      on(`sb_${k}`, () => this._doKey(k, root.querySelector(`.fk[data-key="${k}"]`)))
    );
    const inMenu = (k) => (this._page === "menu" ? (this._menuKey(k), true) : false);
    on("k_esc", () => inMenu("esc") || this._esc());
    on("k_up", () => inMenu("up") || this._nudge(1));
    on("k_down", () => inMenu("down") || this._nudge(-1));
    on("k_left", () => inMenu("left") || this._turnPage(-1));
    on("k_right", () => inMenu("right") || this._turnPage(1));
    on("k_enter", () => {
      if (inMenu("enter")) return;
      if (this._sp !== null && !this._spSentAt) this._sendSetpoint();
      else this._toast("Use ▲ / ▼ to change the speed, then ENTER");
    });
    on("b_run", (b) => this._confirmThen(b, () => this._command("run")));
    on("b_stop", (b) => {
      // Like the real STOP/RESET key: stops when running, resets when tripped.
      if (this._faulted || this._pFault) this._confirmThen(b, () => this._command("reset"));
      else this._command("stop"); // stop never needs confirmation
    });
    on("b_app", (b) => {
      const mode = this._appMode();
      const plc = this._plc();
      if (this._config.entities.app_mode && mode !== null) {
        const names = ["PANEL", "APP AUTO", "APP MAN"];
        const next = (mode + 1) % 3;
        const id = this._config.entities.app_mode;
        const dom = id.split(".")[0];
        this._confirmThen(b, () => {
          let call;
          if (plc && plc.app_mode_register !== undefined && plc.app_mode_register !== "") {
            call = this._writeRegister(Number(plc.app_mode_register), next, this._plcSlave());
          } else if (["input_number", "number"].includes(dom)) {
            call = this._hass.callService(dom, "set_value", { entity_id: id, value: next });
          } else if (["input_select", "select"].includes(dom)) {
            call = this._hass.callService(dom, "select_next", { entity_id: id, cycle: true });
          } else {
            this._toast("APP CONTROL: set the PLC app mode register in the card settings");
            return;
          }
          return call.then(() => this._toast(`${this._config.name}: control mode → ${names[next]}`))
            .catch((e) => this._toast(`APP CONTROL failed — ${e.message || e}`));
        });
        return;
      }
      const id = this._config.control.app_control_entity;
      if (!id) {
        this._toast("APP CONTROL: pick a switch for it under Control in the card settings");
        return;
      }
      this._confirmThen(b, () => {
        const wasOn = this._appOn();
        return this._hass.callService("homeassistant", "toggle", { entity_id: id })
          .then(() => this._toast(`${this._config.name}: APP CONTROL ${wasOn ? "OFF" : "ON"}`))
          .catch((e) => this._toast(`APP CONTROL failed — ${e.message || e}`));
      });
    });
    on("b_dir", (b) => {
      if (!this._config.allow_reverse) {
        this._toast("Reverse is switched off for this drive (allow_reverse)");
        return;
      }
      this._confirmThen(b, () => this._command(this._dirNext || "rev"));
    });
    this._built = true;
    if (this._tm) this._timerRender();
  }

  _tapBox(b) {
    const cfg = this._config;
    const bc = (cfg.boxes && cfg.boxes[b]) || {};
    const id = bc.entity || (b === "box1" && !cfg.boxes ? cfg.entities.output_power : null);
    if (!id || bc.tap === "none") return;
    if (bc.tap === "toggle") this._hass.callService("homeassistant", "toggle", { entity_id: id });
    else this._moreInfo(id);
  }


  /* ---------------- pump timer (TIMER key) ---------------- */
  // schedule text: 7 days Mon..Sun separated by "|", each day up to 3 periods "HHMM-HHMM" separated by ","

  _timerIds() {
    const t = this._config.timer || {};
    const pre = (this._config.plc && this._config.plc.entity_prefix) || "pump";
    return { schedule: t.schedule || `input_text.${pre}_timer`, enable: t.enable || `input_boolean.${pre}_timer` };
  }

  _timerExists() {
    const t = this._timerIds();
    return !!(this._hass && this._hass.states[t.schedule] && this._hass.states[t.enable]);
  }

  _timerEnabled() {
    const s = this._hass && this._hass.states[this._timerIds().enable];
    return !!s && s.state === "on";
  }

  _timerParse(txt) {
    const days = String(txt || "").split("|");
    const out = [];
    for (let d = 0; d < 7; d++) {
      const per = String(days[d] || "").split(",").filter((p) => /^\d{4}-\d{4}$/.test(p))
        .map((p) => [`${p.slice(0, 2)}:${p.slice(2, 4)}`, `${p.slice(5, 7)}:${p.slice(7, 9)}`]);
      while (per.length < 3) per.push(["", ""]);
      out.push(per.slice(0, 3));
    }
    return out;
  }

  _timerSerialize(data) {
    return data.map((day) => day.filter(([a, b]) => a && b).map(([a, b]) => a.replace(":", "") + "-" + b.replace(":", "")).join(",")).join("|");
  }

  // { active, next: {start|stop, minutes from now, label} } from the SAVED schedule
  _timerCalc() {
    const st = this._hass && this._hass.states[this._timerIds().schedule];
    const data = this._timerParse(st ? st.state : "");
    const now = new Date();
    const today = (now.getDay() + 6) % 7;            // 0 = Monday
    const t = now.getHours() * 60 + now.getMinutes();
    const m = (hm) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
    let active = false, next = null;
    for (let o = -1; o <= 7; o++) {
      const day = data[(today + o + 7) % 7];
      for (const [a, b] of day) {
        if (!a || !b || a === b) continue;
        const s = o * 1440 + m(a), e = o * 1440 + m(b) + (m(b) <= m(a) ? 1440 : 0);
        if (s <= t && t < e) active = true;
        for (const [kind, at] of [["start", s], ["stop", e]]) {
          if (at > t && (!next || at < next.at)) next = { kind, at };
        }
      }
    }
    if (next) {
      const dd = Math.floor(next.at / 1440), hm = ((next.at % 1440) + 1440) % 1440;
      const hhmm = `${String(Math.floor(hm / 60)).padStart(2, "0")}:${String(hm % 60).padStart(2, "0")}`;
      const dayName = dd === 0 ? "" : dd === 1 ? "tomorrow " : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][(today + dd) % 7] + " ";
      next.label = `${dayName}${hhmm}`;
    }
    return { active, next };
  }

  _timerSummary(short) {
    if (!this._timerExists()) return short ? "—" : "Timer not set up";
    if (!this._timerEnabled()) return short ? "OFF" : "Timer is OFF — the pump is not started by the timer";
    const c = this._timerCalc();
    if (!c.next) return short ? "no times" : "Timer ON — no times set yet";
    if (short) return c.active ? `to ${c.next.label}` : `${c.next.label}`;
    return c.active ? `Run period now — stops ${c.next.label}` : `Next start ${c.next.label}`;
  }

  _timerToggle() {
    if (this._tm) { this._tm = null; this._timerRender(); return; }
    if (!this._timerExists()) {
      const t = this._timerIds();
      this._toast(`Timer not set up — install the pump timer package (${t.schedule} / ${t.enable})`);
      return;
    }
    const st = this._hass.states[this._timerIds().schedule];
    this._tm = { day: (new Date().getDay() + 6) % 7, data: this._timerParse(st.state), dirty: false, pin: null };
    this._timerRender();
  }

  _timerUnlocked() {
    return !this._config.pin || (this._pinUntil && Date.now() < this._pinUntil);
  }

  _timerGuard(fn, what = "save") {
    if (this._timerUnlocked()) return fn();
    this._tm.pin = fn;
    this._tm.pinFor = what;
    this._timerRender();
    this._toast(`Enter the card PIN to ${what}`);
  }

  _timerRender() {
    const el = this.shadowRoot && this.shadowRoot.getElementById("tpanel");
    if (!el) return;
    const tm = this._tm;
    if (!tm) { el.hidden = true; el.innerHTML = ""; return; }
    const D = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const en = this._timerEnabled();
    const has = (d) => tm.data[d].some(([a, b]) => a && b);
    el.hidden = false;
    el.innerHTML = `
      <div class="th"><span class="tt">PUMP TIMER</span>
        <button class="tbtn tog ${en ? "on" : ""}" id="t_en">${en ? "TIMER ON" : "TIMER OFF"}</button>
        <button class="tbtn tx" id="t_close" title="Close">✕</button></div>
      <div class="tstat" id="t_stat">${this._esc_(this._timerSummary(false))}</div>
      <div class="tdays">${D.map((n, i) => `<button class="tday ${i === tm.day ? "sel" : ""} ${has(i) ? "has" : ""}" data-day="${i}">${n}</button>`).join("")}</div>
      <div class="trows">${tm.data[tm.day].map(([a, b], r) => `
        <div class="trow"><span class="tn">${r + 1}</span>
          <input type="time" class="ttime" data-r="${r}" data-c="0" value="${a}">
          <span class="tdash">–</span>
          <input type="time" class="ttime" data-r="${r}" data-c="1" value="${b}">
          <button class="tbtn tclr" data-clr="${r}" title="Clear">✕</button></div>`).join("")}
      </div>
      <div class="thint">START – STOP · a stop before the start runs past midnight</div>
      <div class="tact">
        <button class="tbtn" id="t_copywk">Copy to Mon–Fri</button>
        <button class="tbtn" id="t_copyall">Copy to all days</button>
      </div>
      ${tm.pin
        ? `<div class="tpinlbl">Enter the card PIN to ${this._esc_(tm.pinFor || "save")}</div>
           <div class="tpin"><input type="password" id="t_pin" class="ttime" inputmode="numeric" placeholder="PIN" autocomplete="off"><button class="tbtn save dirty" id="t_pinok">OK</button><button class="tbtn" id="t_pincancel">Cancel</button></div>`
        : `<div class="tact"><button class="tbtn save ${tm.dirty ? "dirty" : ""}" id="t_save">${tm.dirty ? "SAVE CHANGES" : "SAVE"}</button></div>`}`;
    const $ = (id) => el.querySelector(`#${id}`);
    $("t_close").onclick = () => {
      if (tm.dirty && !tm.closeWarned) { tm.closeWarned = true; this._toast("Changes not saved — press ✕ again to close without saving"); return; }
      this._tm = null; this._timerRender();
    };
    el.querySelectorAll("[data-day]").forEach((b) => (b.onclick = () => { tm.day = Number(b.dataset.day); this._timerRender(); }));
    el.querySelectorAll("input[data-r]").forEach((inp) => (inp.oninput = inp.onchange = () => {
      tm.data[tm.day][Number(inp.dataset.r)][Number(inp.dataset.c)] = inp.value || "";
      tm.dirty = true; tm.closeWarned = false;
      const sv = $("t_save"); if (sv) { sv.classList.add("dirty"); sv.textContent = "SAVE CHANGES"; }
      el.querySelectorAll("[data-day]")[tm.day].classList.toggle("has", has(tm.day));
    }));
    el.querySelectorAll("[data-clr]").forEach((b) => (b.onclick = () => {
      tm.data[tm.day][Number(b.dataset.clr)] = ["", ""]; tm.dirty = true; this._timerRender();
    }));
    const copy = (days) => { days.forEach((d) => { tm.data[d] = tm.data[tm.day].map((p) => [...p]); }); tm.dirty = true; this._timerRender(); };
    $("t_copywk").onclick = () => copy([0, 1, 2, 3, 4]);
    $("t_copyall").onclick = () => copy([0, 1, 2, 3, 4, 5, 6]);
    $("t_en").onclick = () => this._timerGuard(() => {
      const id = this._timerIds().enable;
      return this._hass.callService("input_boolean", "toggle", { entity_id: id })
        .then(() => this._toast(`${this._config.name}: timer ${this._timerEnabled() ? "OFF" : "ON"}`))
        .catch((e) => this._toast(`Timer: ${e.message || e}`));
    }, "switch the timer on / off");
    if ($("t_save")) $("t_save").onclick = () => {
      for (const [d, day] of tm.data.entries()) {
        for (const [a, b] of day) {
          if ((a && !b) || (!a && b)) { tm.day = d; this._timerRender(); this._toast(`${D[d]}: fill in both START and STOP (or clear the row)`); return; }
          if (a && a === b) { tm.day = d; this._timerRender(); this._toast(`${D[d]}: START and STOP are the same`); return; }
        }
      }
      const txt = this._timerSerialize(tm.data);
      const id = this._timerIds().schedule;
      this._timerGuard(() => this._hass.callService("input_text", "set_value", { entity_id: id, value: txt })
        .then(() => new Promise((res) => setTimeout(res, 1500)))
        .then(() => {
          const now = this._hass.states[id];
          if (!now || now.state !== txt) { this._toast(`Timer NOT stored in Home Assistant (${id}) — check the timer package`); return; }
          tm.dirty = false; this._toast(`${this._config.name}: timer saved`); this._timerRender();
        })
        .catch((e) => this._toast(`Timer save failed — ${e.message || e}`)));
    };
    if (tm.pin) {
      const pin = $("t_pin");
      const ok = () => {
        if (String(pin.value) === String(this._config.pin)) {
          this._pinUntil = Date.now() + 10 * 60 * 1000;
          const fn = tm.pin; tm.pin = null; this._timerRender(); fn();
        } else { this._toast("Wrong PIN"); pin.value = ""; pin.focus(); }
      };
      $("t_pinok").onclick = ok;
      $("t_pincancel").onclick = () => { tm.pin = null; this._timerRender(); };
      pin.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { ev.preventDefault(); ok(); } });
      setTimeout(() => pin.focus(), 50);
    }
  }

  /* ---------------- settings menu (MENU key) ---------------- */

  _menuAvailable() {
    return !!this._config.control.hub;
  }

  _menuGroups() {
    // drive-parameter groups only need the hub; program groups need the PLC settings
    return MENU_V9.filter((g) => !g.i[0].r.startsWith("D") || this._plc());
  }

  _menuTarget(it) {
    if (it.r.startsWith("D")) return { address: 4096 + Number(it.r.slice(1)), slave: this._plcSlave() };
    const [g, n] = it.r.slice(1).split("-").map(Number);
    return { address: g * 256 + n, slave: Number(this._config.control.slave) || 1 };
  }

  _menuEntity(it) {
    // pump 1 uses sensor.pump_d130 / sensor.vfd_p01_00; a second pump e.g. sensor.pump2_d130 / sensor.vfd2_p01_00
    const p = this._config.plc || {};
    const plcPre = p.entity_prefix || "pump", drvPre = p.drive_prefix || "vfd";
    return it.r.startsWith("D") ? `sensor.${plcPre}_d${it.r.slice(1)}` : `sensor.${drvPre}_p${it.r.slice(1).replace("-", "_")}`;
  }

  _menuValue(it) {
    const st = this._hass.states[this._menuEntity(it)];
    if (!st) return { missing: true };
    const raw = parseFloat(st.state);
    if (!Number.isFinite(raw)) return { na: true };
    return { v: raw / Math.pow(10, it.d) };
  }

  _menuFmt(it, v) {
    if (v === null || v === undefined) return "—";
    if (it.opts) return it.opts[Math.round(v)] !== undefined ? it.opts[Math.round(v)] : String(v);
    return Number(v).toFixed(it.d);
  }

  _menuKey(k) {
    const m = this._m;
    const groups = this._menuGroups();
    if (!m || !groups.length) { this._page = this._config.default_page; this._update(); return; }
    const g = groups[Math.min(m.g, groups.length - 1)];
    const it = g.i[Math.min(m.i, g.i.length - 1)];
    const wrap = (x, n) => (x + n) % n;
    if (m.lvl === "g") {
      if (k === "up") m.g = wrap(m.g - 1, groups.length);
      else if (k === "down") m.g = wrap(m.g + 1, groups.length);
      else if (k === "enter" || k === "right") { m.lvl = "i"; m.i = 0; }
      else if (k === "esc" || k === "left") { this._page = this._config.default_page; this._m = null; }
    } else if (m.lvl === "i") {
      if (k === "up") m.i = wrap(m.i - 1, g.i.length);
      else if (k === "down") m.i = wrap(m.i + 1, g.i.length);
      else if (k === "left") { m.g = wrap(m.g - 1, groups.length); m.i = 0; }
      else if (k === "right") { m.g = wrap(m.g + 1, groups.length); m.i = 0; }
      else if (k === "esc") m.lvl = "g";
      else if (k === "enter") {
        if (it.ro) { this._toast(`${it.l}: read-only here (changing it could cut off communication)`); return; }
        const cur = this._menuValue(it);
        m.val = cur.v !== undefined ? cur.v : Number(it.min);
        m.step = it.opts ? 1 : Math.pow(10, -it.d);
        m.lvl = "e";
      }
    } else if (m.lvl === "e") {
      const clamp = (v) => Math.min(Number(it.max), Math.max(Number(it.min), v));
      if (k === "up" || k === "down") {
        const dir = k === "up" ? 1 : -1;
        if (it.opts) m.val = wrap(Math.round(m.val) + dir, it.opts.length);
        else m.val = clamp(Math.round((m.val + dir * m.step) / m.step) * m.step);
        const inp = this.shadowRoot.getElementById("m_in");
        if (inp) inp.value = this._menuFmt(it, m.val);
      } else if (!it.opts && (k === "left" || k === "right")) {
        const minStep = Math.pow(10, -it.d);
        m.step = k === "left" ? Math.min(m.step * 10, 1000) : Math.max(m.step / 10, minStep);
        const st = this.shadowRoot.getElementById("m_step");
        if (st) st.textContent = this._menuFmt(it, m.step);
        return;
      } else if (k === "esc") m.lvl = "i";
      else if (k === "enter") {
        const inp = this.shadowRoot.getElementById("m_in");
        if (inp && !it.opts) {
          const typed = parseFloat(String(inp.value).replace(",", "."));
          if (!Number.isFinite(typed)) { this._toast("Not a number"); return; }
          if (typed < Number(it.min) || typed > Number(it.max)) { this._toast(`Allowed: ${it.min} – ${it.max} ${it.u || ""}`); return; }
          m.val = typed;
        }
        if (this._config.pin && !(this._pinUntil && Date.now() < this._pinUntil)) { m.lvl = "pin"; }
        else { this._menuWrite(it, m.val); return; }
      }
    } else if (m.lvl === "pin") {
      if (k === "esc") m.lvl = "e";
      else if (k === "enter") {
        const inp = this.shadowRoot.getElementById("m_pin");
        if (inp && String(inp.value) === String(this._config.pin)) {
          this._pinUntil = Date.now() + 10 * 60 * 1000; // stays unlocked for 10 minutes
          this._menuWrite(it, m.val);
          return;
        }
        this._toast("Wrong PIN");
        if (inp) { inp.value = ""; inp.focus(); }
        return;
      }
    }
    this._update();
  }

  async _menuWrite(it, val) {
    const t = this._menuTarget(it);
    const raw = Math.round(val * Math.pow(10, it.d));
    try {
      await this._writeRegister(t.address, raw, t.slave);
      this._toast(`${it.l} set to ${this._menuFmt(it, val)} ${it.u || ""}`);
      const ent = this._menuEntity(it);
      if (this._hass.states[ent]) this._hass.callService("homeassistant", "update_entity", { entity_id: ent }).catch(() => {});
    } catch (e) {
      this._toast(`${it.l}: write failed — ${e.message || e}`);
    }
    this._m.lvl = "i";
    this._update();
  }

  _menuHtml() {
    const m = this._m;
    const groups = this._menuGroups();
    if (!groups.length) return `<div class="msg"><div>No settings menu</div><div class="small">Add the PLC settings (plc:) to the card</div></div>`;
    m.g = Math.min(m.g, groups.length - 1);
    const g = groups[m.g];
    m.i = Math.min(m.i, g.i.length - 1);
    const it = g.i[m.i];
    const win = (sel, n, size) => { const top = Math.max(0, Math.min(sel - Math.floor(size / 2), n - size)); return [top, Math.min(n, top + size)]; };
    if (m.lvl === "g") {
      const [a, b] = win(m.g, groups.length, 6);
      return `<div class="mn">${groups.slice(a, b).map((x, j) =>
        `<div class="mr ${a + j === m.g ? "sel" : ""}" data-mi="${a + j}"><span>${this._esc_(x.t)}</span><span>›</span></div>`).join("")}
        <div class="mh">▲▼ choose · ENTER open · ESC back</div></div>`;
    }
    if (m.lvl === "i") {
      const [a, b] = win(m.i, g.i.length, 5);
      return `<div class="mn"><div class="mt">${this._esc_(g.t)}</div>${g.i.slice(a, b).map((x, j) => {
        const cv = this._menuValue(x);
        const val = cv.missing ? "n/a" : cv.na ? "—" : this._menuFmt(x, cv.v);
        return `<div class="mr ${a + j === m.i ? "sel" : ""}" data-mi="${a + j}"><span>${this._esc_(x.l)}</span><span>${this._esc_(val)}${x.u && !x.opts ? " " + this._esc_(x.u) : ""}${x.ro ? " 🔒" : ""}</span></div>`;
      }).join("")}</div>`;
    }
    if (m.lvl === "e") {
      const cv = this._menuValue(it);
      const now = cv.v !== undefined ? this._menuFmt(it, cv.v) : "—";
      return `<div class="mn me"><div class="mt">${this._esc_(it.l)}</div>
        ${it.opts
          ? `<div class="mbigv">${this._esc_(this._menuFmt(it, m.val))}</div>`
          : `<div class="mrow"><input id="m_in" class="min" inputmode="decimal" autocomplete="off"><span>${this._esc_(it.u || "")}</span></div>
             <div class="mh">range ${it.min} – ${it.max} · step <b id="m_step">${this._menuFmt(it, m.step)}</b> (◀▶)</div>`}
        <div class="mh">now ${this._esc_(now)} · ENTER save · ESC cancel</div></div>`;
    }
    return `<div class="mn me"><div class="mt">ENTER PIN</div>
      <div class="mrow"><input id="m_pin" class="min" type="password" inputmode="numeric" autocomplete="off"></div>
      <div class="mh">to save ${this._esc_(it.l)} = ${this._esc_(this._menuFmt(it, m.val))} ${this._esc_(it.u || "")}</div></div>`;
  }

  _menuAfterRender() {
    const m = this._m;
    if (!m) return;
    const groups = this._menuGroups();
    const it = groups[m.g] && groups[m.g].i[m.i];
    const inp = this.shadowRoot.getElementById(m.lvl === "pin" ? "m_pin" : "m_in");
    if (!inp || !it) return;
    if (m.lvl === "e") inp.value = this._menuFmt(it, m.val);
    inp.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") { ev.preventDefault(); this._menuKey("enter"); }
      else if (ev.key === "Escape") { ev.preventDefault(); this._menuKey("esc"); }
    });
    if (m.lvl === "pin") setTimeout(() => inp.focus(), 50);
  }

  _line(key, label, value, unit, opts = {}) {
    const cls = ["ln"];
    if (opts.big) cls.push("big");
    if (opts.blink) cls.push("blink");
    if (opts.sel) cls.push("sel");
    const ent = key && this._config.entities[key] ? `data-ent="${key}"` : "";
    return `<div class="${cls.join(" ")}" ${ent}><span class="lb">${label}</span><span class="val">${value}</span><span class="un">${unit}</span></div>`;
  }

  _update() {
    if (!this._built || !this._hass) return;
    const r = this.shadowRoot;
    const cfg = this._config;
    const $ = (id) => r.getElementById(id);
    const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
    const n = (k) => this._num(k);
    const f = (v, dp) => this._fmt(v, dp);

    const bad = (e) => !e || ["unavailable", "unknown"].includes(e.state);
    const isOn = (key) => {
      const e = this._st(key);
      if (bad(e)) return null;
      const v = String(e.state).toLowerCase();
      if (["on", "true", "run", "running", "open", "reverse", "rev", "remote", "auto", "home"].includes(v)) return true;
      const num = parseFloat(v);
      if (Number.isFinite(num)) return num > 0;
      return false;
    };
    const keyEnt = this._st("status") || this._st("output_frequency") || this._st("running");
    const commsLost = bad(keyEnt);
    const modbus = cfg.mode === "modbus";
    const hz = n("output_frequency");
    const fcmd = n("frequency_command");

    // run state / direction / control source
    const sw = n("status");
    let run = 0, dir = 0, mode = "—";
    if (sw !== null) {
      const s = sw | 0;
      run = s & 0x03;
      dir = (s >> 3) & 0x03;
      mode = (s >> 10) & 1 ? "COMM" : "LOCAL";
      if ((s >> 2) & 1) mode += " JOG";
    } else {
      const r = isOn("running");
      if (r !== null) { run = r ? 3 : 0; }
      else if (hz !== null) { run = hz > 0.05 ? 3 : 0; }
      if (isOn("reverse")) dir = 3;
      else if (cfg.control.direction_entity) {
        const d = this._hass.states[cfg.control.direction_entity];
        if (d && d.state === "on") dir = 3;
      }
      const rm = isOn("remote");
      mode = rm === null ? (modbus ? "—" : "HA") : rm ? "REMOTE" : "LOCAL";
    }

    // fault: raw Delta word (Modbus), a fault code number, an on/off fault, or fault text
    let fcode = 0, wcode = 0, faultText = null;
    const fe = this._st("fault");
    if (fe && !bad(fe)) {
      const raw = String(fe.state).trim();
      const num = parseFloat(raw);
      if (Number.isFinite(num)) {
        const v = num | 0;
        if (modbus || v > 255) { fcode = v & 0xff; wcode = (v >> 8) & 0xff; }
        else fcode = v;
      } else if (["on", "true", "problem", "fault"].includes(raw.toLowerCase())) {
        fcode = -1; faultText = (fe.attributes && fe.attributes.friendly_name) || "Drive fault";
      } else if (!["off", "false", "ok", "none", "normal", "no fault", "no_fault", ""].includes(raw.toLowerCase())) {
        fcode = -1; faultText = raw;
      }
    }
    const faulted = fcode !== 0 && !commsLost;
    this._faulted = faulted;

    const running = !commsLost && (run === 3 || run === 1);
    const reverse = dir === 3 || dir === 2;

    let state = "STOPPED", cls = "stopped";
    if (commsLost) { state = "OFFLINE"; cls = "offline"; }
    else if (faulted) { state = "FAULT"; cls = "fault"; }
    else if (sw !== null && run === 1) { state = "STOPPING"; cls = "running"; }
    else if (running) { state = "RUNNING"; cls = "running"; }
    else if (sw !== null && run === 2) { state = "STANDBY"; cls = "standby"; }
    // pump program flags (Single Pump V9)
    const pFault = this._flag("pump_fault"), pSleep = this._flag("sleep"), pBoost = this._flag("boost"), pNoLoad = this._flag("no_load");
    this._pFault = pFault && !commsLost;
    const progStatus = commsLost ? null : pFault ? "FAULT!!!" : pSleep ? "SLEEP..." : pBoost ? "BOOSTING" : pNoLoad ? "NO LOAD" : null;
    if (!commsLost && !faulted) {
      if (pFault) { state = "PUMP FAULT"; cls = "fault"; }
      else if (pSleep) { state = "SLEEP"; cls = "standby"; }
      else if (pBoost) { state = "BOOSTING"; cls = "running"; }
      else if (pNoLoad) { state = "NO LOAD"; cls = "standby"; }
    }
    $("pill").className = `pill ${cls}`;
    set("pilltxt", state);

    // LEDs
    $("led_err").className = faulted || pFault ? "on red" : wcode ? "on amber blinkled" : "";
    $("led_com").className = commsLost ? "" : "on green";
    $("led_run").className = running ? (run === 1 ? "on green blinkled" : "on green") : "";
    if ($("ml_run")) {
      $("ml_run").className = running ? "on green" : "";
      $("ml_dir").className = $("b_app") ? (this._appOn() ? "on green" : "") : !commsLost && reverse ? "on amber" : "";
      $("ml_stop").className = !commsLost && !running ? "on red" : "";
    }

    // setpoint state
    const pressure = this._isPressure();
    const spRead = this._spReading();
    const tol = pressure ? Math.max(0.005, Number(cfg.p_step) / 2) : 0.011;
    if (this._sp !== null && this._spSentAt && spRead !== null && Math.abs(spRead - this._sp) < tol) this._sp = null;
    if (this._sp !== null && this._spSentAt && Date.now() - this._spSentAt > 15000) this._sp = null;
    const editing = this._sp !== null && !this._spSentAt;
    const spShown = this._sp !== null ? this._sp : spRead;
    const pNow = pressure ? this._pressureNow() : null;
    if (pressure && sw === null && mode === "HA") mode = "PID";
    else if (pressure) mode += " PID";

    // LCD title + softkeys
    set("t_mode", mode);
    set("t_dir", DIRS[dir]);
    set("t_run", progStatus || (sw !== null ? RUN_STATES[run] : running ? "RUN" : "STOP"));
    set("t_page", this._page === "menu" && !commsLost ? "MENU" : faulted ? "FAULT" : commsLost ? "----" : PAGE_TITLES[this._page] || "");
    for (const k of ["f1", "f2", "f3", "f4"]) {
      const el = $(`sb_${k}`);
      el.textContent = this._keyLabel(k);
      el.classList.toggle("act", this._keyActive(k));
    }
    $("lcd").classList.toggle("off", commsLost);
    $("lcd").classList.toggle("full", !commsLost && !faulted && this._page === "main" && pressure);

    // LCD body
    let html = "";
    if (commsLost) {
      const keyId = cfg.entities.status || cfg.entities.output_frequency || cfg.entities.running || "";
      const missing = keyId && !this._hass.states[keyId];
      html = missing
        ? `<div class="msg"><div class="mbig">NO DATA</div><div>Entity not found:</div><div class="small">${this._esc_(keyId)}</div><div class="small">Check the sensor names in the card settings</div></div>`
        : modbus
          ? `<div class="msg"><div class="mbig">NO COMMS</div><div>Check RS-485 link</div><div>SG+ / SG- / power</div></div>`
          : `<div class="msg"><div class="mbig">NO DATA</div><div>Sensor unavailable:</div><div class="small">${this._esc_(keyId)}</div></div>`;
    } else if (this._page === "menu" && this._m) {
      html = this._menuHtml();
    } else if (faulted) {
      const fl = fcode > 0 ? FAULTS[fcode] : null;
      const desc = faultText ? this._esc_(faultText) : fl ? this._esc_(fl[1]) : `Fault code ${fcode}`;
      html = `<div class="msg fault"><div class="mbig">${fl ? fl[0] : "FAULT"}</div>
        <div>${desc}</div>
        <div class="small">${fcode > 0 ? `Code ${fcode} · ` : ""}press STOP/RESET</div></div>`;
    } else if (this._page === "main" && pressure) {
      // Pump / PID screen: SETPOINT | PRESENT VALUE boxes like the drive's own pump display
      const dp = this._spDecimals();
      const u = this._esc_(cfg.p_unit.charAt(0).toUpperCase() + cfg.p_unit.slice(1));
      const spKey = cfg.entities.pressure_setpoint ? "pressure_setpoint" : cfg.control.pressure_setpoint_entity ? "" : "frequency_command";
      const de = (k) => (k && cfg.entities[k] ? `data-ent="${k}"` : "");
      const box = (b, area) => {
        const bc = (cfg.boxes && cfg.boxes[b]) || {};
        // default: Box 1 shows output power when nothing is chosen
        const id = bc.entity || (b === "box1" && !cfg.boxes ? cfg.entities.output_power : null);
        if (!id) return `<div class="pc box ${area}"></div>`;
        const st = this._hass.states[id];
        let val = "—", unit = bc.unit || "";
        if (st && !["unavailable", "unknown"].includes(st.state)) {
          const num = parseFloat(st.state);
          if (Number.isFinite(num) && /^-?[\d.]+(e-?\d+)?$/i.test(String(st.state).trim())) {
            const d = bc.decimals !== undefined && bc.decimals !== null && bc.decimals !== "" ? Number(bc.decimals) : Math.abs(num) >= 100 ? 0 : 1;
            val = num.toFixed(d);
            if (!bc.unit) unit = st.attributes.unit_of_measurement || "";
          } else {
            val = String(st.state).toUpperCase();
          }
        }
        if (!st) {   // a wrong entity id: say so on the screen instead of a bare dash
          return `<div class="pc box ${area}" data-box="${b}" title="${this._esc_(id)} not found">
            <span class="bl">${this._esc_(bc.label || b.toUpperCase())}</span><span class="bv"><span class="v" style="font-size:12px">NOT FOUND</span></span></div>`;
        }
        const label = bc.label !== undefined ? bc.label : (st && st.attributes.friendly_name) || "";
        const on = st && ["on", "open", "running"].includes(st.state);
        return `<div class="pc box ${area} ${on ? "on" : ""}" data-box="${b}">
          ${label ? `<span class="bl">${this._esc_(label)}</span>` : ""}
          <span class="bv"><span class="v">${this._esc_(val)}</span><span class="u">${this._esc_(unit)}</span></span></div>`;
      };
      const soft = ["f2", "f3", "f4"].map((k) =>
        `<div class="pf ${this._keyActive(k) ? "act" : ""}" data-soft="${k}">${this._esc_(this._keyLabel(k))}</div>`).join("");
      html = `<div class="pidlcd">
        <div class="ph l">SETPOINT</div><div class="ph tag">F1</div><div class="ph r">PRESENT VALUE</div>
        <div class="pc sp ${editing ? "blink" : ""}" ${de(spKey)}><span class="v">${f(spShown, 2 > dp ? 2 : dp)}</span><span class="u">${u}</span></div>
        <div class="pc pv" ${de("pid_feedback")}><span class="v">${f(pNow, 2 > dp ? 2 : dp)}</span><span class="u">${u}</span></div>
        <div class="pc hz" ${de("output_frequency")}><span class="v">${f(hz, 2)}</span><span class="u">Hz</span></div>
        ${box("box1", "small")}
        <div class="pc amp" ${de("output_current")}><span class="v">${f(n("output_current"), 1)}</span><span class="u">A</span></div>
        ${box("box2", "blank")}
        <div class="pfoot"><div class="pf st ${progStatus ? "act" : ""}">${progStatus || (running ? (reverse ? "REV RUN" : "RUN") : "STOP")}</div>${soft}</div>
      </div>`;
    } else if (this._page === "main") {
      const span = Math.max(0.01, cfg.max_frequency - cfg.min_frequency);
      const pct = (v) => Math.max(0, Math.min(100, ((v - cfg.min_frequency) / span) * 100));
      html =
        this._line("frequency_command", "F", f(spShown, 2), "Hz", { blink: editing }) +
        this._line("output_frequency", "H", f(hz, 2), "Hz", { big: true, sel: true }) +
        this._line("output_current", "A", f(n("output_current"), 2), "Amp") +
        `<div class="pbar"><div class="pfill" style="width:${hz === null ? 0 : pct(hz)}%"></div>
           ${spShown !== null ? `<div class="pmark" style="left:${pct(spShown)}%"></div>` : ""}</div>`;
    } else if (this._page === "power") {
      html =
        this._line("output_voltage", "U", f(n("output_voltage"), 1), "V") +
        this._line("dc_bus_voltage", "d", f(n("dc_bus_voltage"), 1), "Vdc") +
        this._line("output_power", "P", f(n("output_power"), 2), "kW", { sel: true });
    } else if (this._page === "motor") {
      html =
        this._line("motor_speed", "r", f(n("motor_speed"), 0), "rpm", { sel: true }) +
        this._line("pid_feedback", "b", f(n("pid_feedback"), 1), this._unit("pid_feedback", "%")) +
        this._line("igbt_temperature", "t", f(n("igbt_temperature"), 1), "°C");
    } else if (this._page === "info") {
      const days = n("run_days"), mins = n("run_minutes"), hrs = cfg.entities.run_days ? null : n("run_hours");
      const am = this._appMode();
      html =
        (cfg.entities.output_power ? this._line("output_power", "P", f(n("output_power"), 1), "kW") : "") +
        this._line("energy", "E", f(n("energy"), 1), "kWh", { sel: true }) +
        (days !== null || (mins !== null && hrs === null)
          ? this._line("run_days", "T", `${days === null ? "—" : days.toFixed(0)}d ${mins === null ? "—" : mins.toFixed(0)}m`, "")
          : hrs !== null && mins !== null
          ? this._line("run_hours", "T", `${hrs.toFixed(0)}h ${mins.toFixed(0)}m`, "")
          : this._line("run_hours", "h", f(n("run_hours"), 0), "Hr")) +
        (am !== null
          ? this._line("app_mode", "C", ["PANEL", "APP AUTO", "APP MAN"][am] || String(am), "")
          : this._line("fault", "Er", wcode ? `W${wcode}` : "none", "")) +
        (this._timerExists() ? this._line("", "Tm", this._esc_(this._timerSummary(true)), "") : "");
    } else {
      const rows = [
        ["frequency_command", "F cmd", 2, "Hz"], ["output_frequency", "Out", 2, "Hz"],
        ["output_current", "Amps", 2, "A"], ["output_voltage", "Volts", 0, "V"],
        ["dc_bus_voltage", "DC bus", 0, "V"], ["output_power", "Power", 2, "kW"],
        ["motor_speed", "Speed", 0, "rpm"], ["pid_feedback", "PID fb", 1, "%"],
        ["igbt_temperature", "IGBT", 1, "°C"], ["energy", "Energy", 0, "kWh"],
        ["run_hours", "Hours", 0, "h"],
      ].filter(([k]) => cfg.entities[k]);
      html = `<div class="all">${rows.map(([k, l, dp, u]) =>
        `<div data-ent="${k}"><span>${l}</span><b>${f(n(k), dp)}</b><i>${k === "pid_feedback" ? this._unit(k, u) : u}</i></div>`).join("")}</div>`;
    }
    if (html !== this._lastHtml) {
      $("screen").innerHTML = html;
      this._lastHtml = html;
      this._textZoomFix();
      if (this._page === "menu") this._menuAfterRender();
      else this._fitScreen();
    }
    if (!this._fitRO && window.ResizeObserver) {   // phone turned / card resized: fit the numbers again
      this._fitRO = new ResizeObserver(() => { this._textZoomFix(); this._fitScreen(); });
      this._fitRO.observe($("lcd"));
    }

    // keys
    this._dirNext = reverse ? "fwd" : "rev";
    $("k_enter").classList.toggle("ready", editing);
    if ($("b_dir")) $("b_dir").classList.toggle("isrev", reverse);
    if ($("b_app")) {
      $("b_app").classList.toggle("on", this._appOn());
      const am = this._appMode();
      if (am !== null) {
        set("app_l1", am === 0 ? "PANEL" : "APP");
        set("app_l2", am === 0 ? "CONTROL" : am === 1 ? "AUTO" : "MANUAL");
      }
    }
    if ($("b_run")) $("b_run").classList.toggle("lit", running && !faulted);
    if ($("b_stop")) $("b_stop").classList.toggle("attn", faulted || this._pFault);
    for (const k of ["menu", "hand", "auto"]) {
      const b = $(`k_${k}`);
      if (b) b.classList.toggle("lit", this._keyActive(k));
    }
    if (this._tm && $("t_stat")) {
      set("t_stat", this._timerSummary(false));
      const en = this._timerEnabled();
      $("t_en").classList.toggle("on", en);
      set("t_en", en ? "TIMER ON" : "TIMER OFF");
    }
  }

  // Shrink the text in any LCD cell that is too narrow for it (phones, large text settings), so numbers are never cut off.
  _fitScreen() {
    const root = this.shadowRoot; if (!root) return;
    const cells = root.querySelectorAll("#screen .pidlcd > div:not(.pfoot), #screen .pidlcd .pfoot > div, #screen .ln, #screen .all > div");
    const rng = document.createRange();
    cells.forEach((cell) => {
      // Scale with a multiplier (--fit) instead of writing px sizes: a phone that enlarges text would
      // otherwise enlarge our "smaller" size again and the text would grow instead of shrink.
      let fit = 1;
      cell.style.setProperty("--fit", "1");
      const cs = getComputedStyle(cell);
      const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const roomW = cell.clientWidth - 2, roomH = cell.clientHeight - 1;
      if (roomW <= 0 || roomH <= 0) return;
      for (let i = 0; i < 6; i++) {
        rng.selectNodeContents(cell);
        const r = rng.getBoundingClientRect();
        const needW = r.width + padX;
        const needH = Math.max(r.height, cell.scrollHeight > cell.clientHeight + 1 ? cell.scrollHeight : 0);
        const k = Math.min(roomW / needW, needH > roomH + 0.5 ? roomH / needH : 1);
        if (!(k < 0.995)) break;
        fit = Math.max(0.3, fit * k * 0.97);
        cell.style.setProperty("--fit", fit.toFixed(3));
      }
    });
  }

  _esc_(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  _css() {
    // every px font size follows --tz (phone text zoom fix) and --fit (per-cell shrink-to-fit)
    return this._cssRaw()
      .replace(/font-size:\s*([\d.]+)px/g, "font-size: calc($1px * var(--tz, 1) * var(--fit, 1))")
      .replace(/letter-spacing:\s*([\d.]+)px/g, "letter-spacing: calc($1px * var(--fit, 1))");
  }

  // Phones with a big system font size (or the HA app's text zoom) blow up all text but not the boxes
  // around it. Measure how much bigger text is drawn than asked, and scale the card's text back by that.
  _textZoomFix() {
    const root = this.shadowRoot;
    if (!root) return;
    const opt = this._config.text_zoom_fix;
    let z = 1;
    if (typeof opt === "number" && opt > 0) z = 1 / opt;          // manual: text_zoom_fix: 0.8 = 80 % text
    else if (opt !== false && opt !== "off") {
      const probe = document.createElement("span");
      probe.textContent = "0000000000";
      probe.style.cssText = "position:absolute;visibility:hidden;left:-9999px;top:0;white-space:nowrap;" +
        "font:400 100px 'DejaVu Sans Mono','Droid Sans Mono','Roboto Mono','Consolas',monospace;letter-spacing:0;line-height:1";
      root.appendChild(probe);
      const cs = parseFloat(getComputedStyle(probe).fontSize) / 100;      // some engines report the boosted size
      const w = probe.getBoundingClientRect().width / 602;                  // monospace digits are ~0.6 em wide
      probe.remove();
      z = Math.max(cs || 1, w || 1);
      if (!(z > 1.08 && z < 4)) z = 1;                                      // ignore small font differences
    }
    if (z !== this._tz) {
      this._tz = z;
      this.style.setProperty("--tz", (1 / z).toFixed(3));
    }
  }

  _cssRaw() {
    return `
      :host {
        --vfd-accent: var(--hamlet-accent, #1e7fd8);
        --vfd-housing: #3b3f45;
        --vfd-housing2: #2f3236;
        --vfd-panel: #1b1c1f;
        --lcd-back1: #c3c6f2;
        --lcd-back2: #dfe1fb;
        --lcd-ink: #1b1e46;
        --vfd-amber: #ffb020;
      }
      ha-card {
        background: linear-gradient(180deg, var(--vfd-housing), var(--vfd-housing2));
        color: #e8edf3; border-radius: var(--ha-card-border-radius, 14px);
        padding: 14px; overflow: hidden;
        font-family: var(--paper-font-body1_-_font-family, "Roboto", system-ui, sans-serif);
      }
      /* keep the dark keypad housing when a theme (card-mod / glass themes) makes cards transparent */
      :host ha-card { background: linear-gradient(180deg, var(--vfd-housing), var(--vfd-housing2)) !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; color: #e8edf3 !important; }
      :host ha-card::before, :host ha-card::after { content: none !important; display: none !important; }
      .head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,.12); }
      .logo { height: 44px; max-width: 65%; object-fit: contain; object-position: left center; }
      .brand { font-size: 16px; font-weight: 800; letter-spacing: 2px; }
      .title { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin: 10px 0 12px; min-width: 0; }
      .name { font-size: 18px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .model { font-size: 10px; letter-spacing: 2px; opacity: .55; white-space: nowrap; }
      .pill { display: flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; letter-spacing: 1px; background: rgba(0,0,0,.25); }
      .pill .dot { width: 9px; height: 9px; border-radius: 50%; background: #8a94a3; }
      .pill.running { color: #3fbf6a; }
      .pill.running .dot { background: #3fbf6a; box-shadow: 0 0 8px #3fbf6a; animation: pulse 1.4s infinite; }
      .pill.fault { color: #ff6b66; background: rgba(226,69,63,.18); }
      .pill.fault .dot { background: #e2453f; animation: pulse .7s infinite; }
      .pill.standby .dot { background: var(--vfd-amber); }
      .pill.offline { color: #9aa3ae; }
      @keyframes pulse { 50% { opacity: .35; } }

      .tpanel { margin-top: 12px; padding: 12px; border-radius: 12px; background: #1b1c1f; border: 1px solid rgba(255,255,255,.08); }
      .tpanel[hidden] { display: none; }
      .tpanel .th { display: flex; align-items: center; gap: 8px; }
      .tpanel .tt { font-weight: 800; letter-spacing: 2px; font-size: 13px; flex: 1; }
      .tpanel .tbtn { font: inherit; font-size: 12px; font-weight: 700; color: #e8edf3; background: #3b3f45; border: 0; border-radius: 8px; padding: 8px 10px; cursor: pointer; }
      .tpanel .tbtn:active { transform: translateY(1px); }
      .tpanel .tog.on { background: #2e9e57; }
      .tpanel .tx { padding: 8px 11px; }
      .tpanel .tstat { margin: 8px 0 10px; font-size: 12px; color: #aeb6c2; }
      .tpanel .tdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
      .tpanel .tday { font: inherit; font-size: 11px; font-weight: 700; padding: 8px 0; border-radius: 7px; border: 0; background: #2a2d32; color: #c8cfd8; cursor: pointer; position: relative; }
      .tpanel .tday.has::after { content: ""; position: absolute; left: 50%; bottom: 3px; width: 5px; height: 5px; margin-left: -2.5px; border-radius: 50%; background: #3fbf6a; }
      .tpanel .tday.sel { background: var(--vfd-accent); color: #fff; }
      .tpanel .trows { margin-top: 10px; display: grid; gap: 6px; }
      .tpanel .trow { display: grid; grid-template-columns: 16px 1fr 10px 1fr auto; align-items: center; gap: 6px; }
      .tpanel .tn { font-size: 12px; color: #8a94a3; text-align: center; }
      .tpanel .tdash { text-align: center; color: #8a94a3; }
      .tpanel .ttime { font: inherit; font-size: 14px; min-width: 0; width: 100%; box-sizing: border-box; padding: 7px 6px; border-radius: 7px; border: 1px solid rgba(255,255,255,.12); background: #dfe1fb; color: #1b1e46; color-scheme: light; }
      .tpanel .tclr { padding: 7px 9px; background: #2a2d32; }
      .tpanel .thint { margin-top: 6px; font-size: 10px; color: #8a94a3; }
      .tpanel .tact { display: flex; gap: 6px; margin-top: 10px; }
      .tpanel .tact .tbtn { flex: 1; }
      .tpanel .tpin { display: flex; gap: 6px; margin-top: 6px; }
      .tpanel .tpin .ttime { flex: 1; }
      .tpanel .tpinlbl { margin-top: 10px; font-size: 12px; font-weight: 700; color: #ffb020; }
      .tpanel .save { background: #2a2d32; color: #8a94a3; }
      .tpanel .save.dirty { background: var(--vfd-accent); color: #fff; }

      /* ---------- keypad body ---------- */
      .keypad {
        background: var(--vfd-panel); border-radius: 12px; padding: 0 14px 16px;
        border-top: 9px solid #2b8fd6;
        box-shadow: inset 0 0 0 2px #0f1012, 0 0 0 3px #4a4e55, 0 3px 8px rgba(0,0,0,.4);
      }
      .bezel { margin: 14px 0 0; padding: 12px 12px 12px; border-radius: 14px; border: 2px solid #5b5f66; }

      /* ---------- LCD ---------- */
      .lcd {
        position: relative; border-radius: 3px; overflow: hidden;
        background: linear-gradient(180deg, var(--lcd-back1), var(--lcd-back2) 70%, #eceefd);
        box-shadow: inset 0 0 0 2px #0e0f12, inset 0 3px 10px rgba(0,0,0,.35);
        color: var(--lcd-ink);
        font-family: "DejaVu Sans Mono", "Consolas", "Lucida Console", "Menlo", monospace;
        font-weight: 700; user-select: none;
        min-height: 168px; display: flex; flex-direction: column; transition: filter .4s;
      }
      .lcd::after {
        content: ""; position: absolute; inset: 0; pointer-events: none;
        background:
          repeating-linear-gradient(0deg, rgba(195,198,242,.22) 0 1px, transparent 1px 3px),
          repeating-linear-gradient(90deg, rgba(195,198,242,.18) 0 1px, transparent 1px 3px);
        mix-blend-mode: lighten;
      }
      .lcd.off { filter: grayscale(.7) brightness(.72); }
      .inv { background: var(--lcd-ink); color: var(--lcd-back2); }
      .top { display: flex; gap: 8px; font-size: 11px; padding: 3px 6px; letter-spacing: .5px; }
      .grow { flex: 1; }
      .screen { flex: 1; padding: 4px 8px 2px; display: flex; flex-direction: column; justify-content: center; gap: 1px; }
      .ln { display: grid; grid-template-columns: 28px 1fr 46px; align-items: baseline; font-size: 20px; line-height: 1.25; cursor: pointer; }
      .ln .lb { font-size: 18px; }
      .ln .val { text-align: right; letter-spacing: 1px; }
      .ln .un { font-size: 13px; padding-left: 6px; }
      .ln.big { font-size: 30px; }
      .ln.sel .lb { background: var(--lcd-ink); color: var(--lcd-back2); text-align: center; border-radius: 2px; margin-right: 4px; }
      .ln.blink .val { animation: lcdblink 1s steps(1) infinite; }
      @keyframes lcdblink { 50% { opacity: 0; } }
      .pbar { position: relative; height: 7px; border: 2px solid var(--lcd-ink); margin: 5px 2px 2px; }
      .pfill { height: 100%; background: var(--lcd-ink); transition: width .6s; }
      .pmark { position: absolute; top: -5px; width: 2px; height: 13px; background: var(--lcd-ink); transform: translateX(-1px); }
      .all { display: grid; grid-template-columns: 1fr 1fr; gap: 1px 12px; font-size: 12px; }
      .all div { display: grid; grid-template-columns: 1fr auto 30px; gap: 4px; cursor: pointer; align-items: baseline; }
      .all b { text-align: right; font-size: 13px; }
      .all i { font-style: normal; font-size: 10px; }
      .msg { text-align: center; font-size: 13px; line-height: 1.5; }
      .msg .mbig { font-size: 26px; letter-spacing: 2px; }
      .msg.fault .mbig { background: var(--lcd-ink); color: var(--lcd-back2); display: inline-block; padding: 0 10px; animation: pulse 1.2s infinite; }
      .msg .small { font-size: 11px; opacity: .8; }
      .softbar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; padding: 0 3px 3px; font-size: 11px; }
      .softbar span { text-align: center; border: 1.5px solid var(--lcd-ink); border-radius: 2px; padding: 1px 2px; cursor: pointer; overflow: hidden; white-space: nowrap; text-overflow: clip; max-width: 100%; }
      .softbar span.act { background: var(--lcd-ink); color: var(--lcd-back2); }

      /* ---------- settings menu ---------- */
      .mn { display: flex; flex-direction: column; gap: 1px; font-size: 13px; }
      .mn .mt { background: var(--lcd-ink); color: var(--lcd-back2); padding: 1px 4px; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mn .mr { display: flex; justify-content: space-between; gap: 8px; padding: 1px 4px; cursor: pointer; white-space: nowrap; }
      .mn .mr span:first-child { overflow: hidden; text-overflow: ellipsis; }
      .mn .mr.sel { background: var(--lcd-ink); color: var(--lcd-back2); }
      .mn .mh { font-size: 10px; opacity: .8; padding: 1px 4px; }
      .mn.me { gap: 4px; }
      .mn .mrow { display: flex; align-items: baseline; justify-content: center; gap: 6px; font-size: 16px; }
      .mn .min {
        width: 9ch; font: inherit; font-size: 26px; font-weight: 700; text-align: right; color: var(--lcd-ink);
        background: transparent; border: none; border-bottom: 2px solid var(--lcd-ink); outline: none; padding: 0 2px;
        animation: lcdblink 1s steps(1) infinite;
      }
      .mn .min:focus { animation: none; }
      .mn .mbigv { text-align: center; font-size: 26px; animation: lcdblink 1s steps(1) infinite; }

      /* ---------- pump / PID screen ---------- */
      .lcd.full .top, .lcd.full .softbar { display: none; }
      .lcd.full .screen { padding: 0; }
      .pidlcd {
        display: grid; grid-template-columns: 1fr 26px 1.08fr; height: 100%; min-height: 168px;
        grid-template-rows: 22px 1fr 1fr 1fr 22px;
        grid-template-areas: "hl tag hr" "sp sp pv" "hz hz sm" "am am bl" "ft ft ft";
        border: 2px solid var(--lcd-ink); font-weight: 400; line-height: 1;
      }
      .pidlcd > div { border: 1.5px solid var(--lcd-ink); margin: -1px 0 0 -1px; min-width: 0; overflow: hidden; }
      .pidlcd .ph { font-size: 15px; font-weight: 700; display: flex; align-items: center; padding: 0 4px; letter-spacing: .5px; white-space: nowrap; }
      .pidlcd .ph.l { grid-area: hl; }
      .pidlcd .ph.tag { grid-area: tag; justify-content: center; font-size: 11px; }
      .pidlcd .ph.r { grid-area: hr; border-left-width: 3px; }
      .pidlcd .pc { display: flex; align-items: center; justify-content: flex-end; gap: 4px; padding: 0 6px; cursor: pointer; }
      .pidlcd .pc .v { font-size: 30px; letter-spacing: 2px; white-space: nowrap; }
      .pidlcd .pc .u { font-size: 18px; min-width: 22px; }
      .pidlcd .sp { grid-area: sp; }
      .pidlcd .sp .u { font-size: 13px; font-weight: 700; }
      .pidlcd .pv { grid-area: pv; border-left-width: 3px; }
      .pidlcd .pv .v { font-size: 32px; }
      .pidlcd .pv .u { font-size: 24px; }
      .pidlcd .hz { grid-area: hz; }
      .pidlcd .hz .v, .pidlcd .amp .v { font-size: 32px; }
      .pidlcd .hz .u, .pidlcd .amp .u { font-size: 26px; }
      .pidlcd .amp { grid-area: am; }
      .pidlcd .small { grid-area: sm; border-left-width: 3px; }
      .pidlcd .blank { grid-area: bl; border-left-width: 3px; }
      .pidlcd .box { position: relative; justify-content: flex-end; align-items: flex-end; padding: 0 6px 4px; }
      .pidlcd .box .bl { position: absolute; top: 3px; left: 5px; font-size: 11px; font-weight: 700; letter-spacing: .3px; white-space: nowrap; max-width: calc(100% - 10px); overflow: hidden; text-overflow: ellipsis; }
      .pidlcd .box .bv { display: flex; align-items: baseline; gap: 4px; }
      .pidlcd .box .v { font-size: 24px; }
      .pidlcd .box .u { font-size: 14px; min-width: 0; }
      .pidlcd .box.on { background: var(--lcd-ink); color: var(--lcd-back2); }
      .pidlcd .pf { font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; white-space: nowrap; cursor: pointer; padding: 0 2px; }
      .pidlcd .pfoot { grid-area: ft; display: grid; grid-template-columns: repeat(4, 1fr); padding: 0; }
      .pidlcd .pfoot > .pf { border-left: 1.5px solid var(--lcd-ink); }
      .pidlcd .pfoot > .pf:first-child { border-left: none; }
      .pidlcd .pf.st { justify-content: flex-start; padding-left: 4px; cursor: default; }
      .pidlcd .pf.act { background: var(--lcd-ink); color: var(--lcd-back2); }
      .pidlcd .blink .v { animation: lcdblink 1s steps(1) infinite; }

      /* ---------- keys (general) ---------- */
      button { font: inherit; cursor: pointer; border: none; padding: 0; -webkit-tap-highlight-color: transparent; transition: transform .05s, filter .2s; }
      button:active { transform: translateY(2px); filter: brightness(.92); }
      button.armed { filter: brightness(1.2) saturate(1.3); outline: 3px solid var(--vfd-amber); outline-offset: 2px; }
      .kf { font-family: "Arial Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif; }

      /* F1–F4: small white keys */
      .fkeys { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 12px; padding: 0 6px; }
      .fk {
        background: linear-gradient(180deg, #ffffff, #d9d9d9); color: #1a1a1a; font-size: 17px; font-weight: 600;
        border-radius: 7px; height: 34px; font-family: "Arial Narrow", "Roboto Condensed", Arial, sans-serif;
        box-shadow: 0 0 0 4px #2a2b2e, 0 3px 0 4px #111, inset 0 -2px 0 rgba(0,0,0,.15);
      }

      /* LED row: ERR ▬  COM  ▬ RUN */
      .leds { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 12px 10px 6px; font-size: 11px; font-weight: 700; letter-spacing: .5px; color: #d8dde3; }
      .led { display: flex; align-items: center; gap: 8px; }
      .led:last-child { justify-content: flex-end; }
      .led.can { flex-direction: column; gap: 3px; }
      .canl { border-bottom: 1px solid #d8dde3; padding: 0 22px 1px; }
      .led i, .minileds i { display: inline-block; width: 34px; height: 7px; border-radius: 4px; background: #3a3d42; box-shadow: inset 0 1px 2px rgba(0,0,0,.7); }
      .led.can i { width: 26px; height: 5px; }
      i.on.red { background: #ff4b44 !important; box-shadow: 0 0 9px #ff4b44 !important; }
      i.on.green { background: #4cff86 !important; box-shadow: 0 0 9px #4cff86 !important; }
      i.on.amber { background: var(--vfd-amber) !important; box-shadow: 0 0 9px var(--vfd-amber) !important; }
      i.blinkled { animation: pulse .8s infinite; }

      /* 3 x 3 navigation pad */
      .pad { display: grid; grid-template-columns: 1fr 1.15fr 1fr; grid-template-rows: 52px 56px 52px; gap: 10px 10px; align-items: center; margin-top: 4px; }
      .bk {
        height: 48px; border-radius: 10px; color: #fff; font-size: 20px; font-weight: 700; letter-spacing: -.3px;
        font-family: "Arial Narrow", "Roboto Condensed", Arial, sans-serif;
        background: linear-gradient(180deg, #6dd6fa 0%, #33b2e6 55%, #1f9ad3 100%);
        text-shadow: 0 1px 1px rgba(0,0,0,.25);
        box-shadow: inset 0 2px 0 rgba(255,255,255,.35), inset 0 -3px 0 rgba(0,0,0,.18), 0 4px 6px rgba(0,0,0,.55);
      }
      .bk.lit { box-shadow: 0 0 0 3px #e9f8ff, 0 0 14px #6dd6fa; }
      .gk {
        height: 100%; display: grid; place-items: center;
        background: radial-gradient(120% 120% at 50% 30%, #ffffff, #e2e2e2 55%, #b9b9b9);
        box-shadow: inset 0 -3px 0 rgba(0,0,0,.15), 0 4px 6px rgba(0,0,0,.55);
      }
      .gk svg { width: 30px; height: 30px; }
      .gk path { fill: none; stroke: #111; stroke-width: 3.2; stroke-linecap: square; stroke-linejoin: miter; }
      .gk.up   { border-radius: 26px 26px 10px 10px / 30px 30px 10px 10px; height: 52px; align-self: end;
                 -webkit-mask: radial-gradient(ellipse 62% 34% at 50% 128%, transparent 97%, #000 100%); mask: radial-gradient(ellipse 62% 34% at 50% 128%, transparent 97%, #000 100%); }
      .gk.down { border-radius: 10px 10px 26px 26px / 10px 10px 30px 30px; height: 52px; align-self: start;
                 -webkit-mask: radial-gradient(ellipse 62% 34% at 50% -28%, transparent 97%, #000 100%); mask: radial-gradient(ellipse 62% 34% at 50% -28%, transparent 97%, #000 100%); }
      .gk.left { border-radius: 22px 10px 10px 22px; height: 52px;
                 -webkit-mask: radial-gradient(ellipse 24% 58% at 112% 50%, transparent 97%, #000 100%); mask: radial-gradient(ellipse 24% 58% at 112% 50%, transparent 97%, #000 100%); }
      .gk.right { border-radius: 10px 22px 22px 10px; height: 52px;
                 -webkit-mask: radial-gradient(ellipse 24% 58% at -12% 50%, transparent 97%, #000 100%); mask: radial-gradient(ellipse 24% 58% at -12% 50%, transparent 97%, #000 100%); }
      .enter {
        height: 56px; border-radius: 50%; color: #fff; font-size: 21px; font-weight: 700; letter-spacing: .3px;
        font-family: "Arial Narrow", "Roboto Condensed", Arial, sans-serif;
        background: radial-gradient(90% 90% at 50% 25%, #5fcaf5, #2f9fdc 60%, #1b7fbf);
        text-shadow: 0 1px 1px rgba(0,0,0,.3);
        box-shadow: inset 0 2px 0 rgba(255,255,255,.35), 0 4px 6px rgba(0,0,0,.55);
      }
      .enter.ready { box-shadow: 0 0 0 3px var(--vfd-amber), 0 0 16px var(--vfd-amber); animation: pulse 1.2s infinite; }

      /* RUN / FWD-REV / STOP-RESET */
      .minileds { display: grid; grid-template-columns: repeat(3, 1fr); justify-items: center; margin: 14px 0 6px; }
      .minileds i { width: 22px; height: 5px; }
      .runrow { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; align-items: center; }
      .runkey, .stopkey {
        height: 52px; border-radius: 999px / 999px; color: #fff; font-weight: 700;
        font-family: "Arial Narrow", "Roboto Condensed", Arial, sans-serif; text-shadow: 0 1px 1px rgba(0,0,0,.3);
        box-shadow: inset 0 2px 0 rgba(255,255,255,.3), inset 0 -3px 0 rgba(0,0,0,.18), 0 4px 6px rgba(0,0,0,.55);
      }
      .runkey { background: linear-gradient(180deg, #6fd39a, #3fae72 60%, #2f9560); font-size: 22px; color: #e8fff1; }
      .runkey.lit { box-shadow: 0 0 0 3px #b9ffd2, 0 0 16px #4cff86; }
      .stopkey { background: linear-gradient(180deg, #ff5d61, #e2283a 60%, #c51d2f); font-size: 16px; line-height: 1.05; }
      .stopkey.attn { animation: pulse 1s infinite; }
      .fwdrev {
        height: 48px; border-radius: 6px; color: #fff; font-size: 17px; font-weight: 700;
        font-family: "Arial Narrow", "Roboto Condensed", Arial, sans-serif; text-shadow: 0 1px 1px rgba(0,0,0,.3);
        background: linear-gradient(152deg, #3fae72 0 52%, #e2283a 52% 100%);
        display: grid; grid-template-rows: 1fr 1fr; padding: 2px 8px;
        box-shadow: inset 0 2px 0 rgba(255,255,255,.25), 0 4px 6px rgba(0,0,0,.55);
      }
      .fwdrev .fw { justify-self: start; align-self: center; }
      .appkey {
        height: 48px; border-radius: 6px; color: #e6e9ee; font-size: 14px; font-weight: 700; line-height: 1.05; letter-spacing: .3px;
        font-family: "Arial Narrow", "Roboto Condensed", Arial, sans-serif; text-shadow: 0 1px 1px rgba(0,0,0,.4);
        background: linear-gradient(180deg, #6b7079, #4b5058 60%, #3d4148);
        box-shadow: inset 0 2px 0 rgba(255,255,255,.2), inset 0 -3px 0 rgba(0,0,0,.2), 0 4px 6px rgba(0,0,0,.55);
      }
      .appkey.on {
        color: #fff; background: linear-gradient(180deg, #6dd6fa 0%, #33b2e6 55%, #1f9ad3 100%);
        box-shadow: 0 0 0 3px #e9f8ff, 0 0 14px #6dd6fa;
      }
      .fwdrev .rv { justify-self: end; align-self: center; }
    `;
  }
}

customElements.define("delta-cp2000-card", DeltaCP2000Card);
if (!customElements.get("delta-cp2000-card-editor")) customElements.define("delta-cp2000-card-editor", DeltaCP2000CardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "delta-cp2000-card",
  name: "Delta CP2000 VFD Card",
  description: "Keypad-style status and control for a Delta CP2000 drive over Modbus (Hamlet Elektries)",
  preview: true,
  documentationURL: "https://github.com/wesselswynand2-prog/delta-cp2000-card",
});

/* =====================================================================================
 * Pump House card — master / slave (assist) controller for two pumps
 * type: custom:hamlet-pump-house-card
 * Works with examples/pump_house_controller.yaml (helpers + automation).
 * ===================================================================================== */

const PH_DEFAULTS = {
  name: "Pump House",
  pumps: [
    { name: "Pump 1", hz: "sensor.vfd_output_frequency", amps: "sensor.vfd_output_current", pressure: "sensor.pump_pressure",
      setpoint: "sensor.pump_setpoint", fault: "binary_sensor.pump_fault", sleep: "binary_sensor.pump_sleep", app_mode: "sensor.pump_app_control_mode" },
    { name: "Pump 2", hz: "sensor.vfd2_output_frequency", amps: "sensor.vfd2_output_current", pressure: "sensor.pump2_pressure",
      setpoint: "sensor.pump2_setpoint", fault: "binary_sensor.pump2_fault", sleep: "binary_sensor.pump2_sleep", app_mode: "sensor.pump2_app_control_mode" },
  ],
  controller: {
    mode: "input_select.pump_house_mode",
    start_hz: "input_number.pump_house_start_hz",
    start_delay: "input_number.pump_house_start_delay",
    stop_hz: "input_number.pump_house_stop_hz",
    stop_delay: "input_number.pump_house_stop_delay",
    status: "sensor.pump_house_status",
    method: "input_select.pump_house_assist_method",
    min_hz: "input_number.pump_house_min_hz",
    start_timer: "binary_sensor.pump_house_assist_start",
    stop_timer: "binary_sensor.pump_house_assist_stop",
  },
  max_frequency: 50,
};

class HamletPumpHouseCard extends HTMLElement {
  static getStubConfig() {
    return { name: "Pump House" };
  }

  setConfig(config) {
    const pumps = (config.pumps || []).length ? config.pumps : PH_DEFAULTS.pumps;
    this._config = {
      ...PH_DEFAULTS,
      ...config,
      pumps: [0, 1].map((i) => ({ ...PH_DEFAULTS.pumps[i], ...(pumps[i] || {}) })),
      controller: { ...PH_DEFAULTS.controller, ...(config.controller || {}) },
    };
    this._built = false;
    if (this._hass) { this._render(); this._update(); }
  }

  set hass(h) {
    this._hass = h;
    if (!this._config) return;
    if (!this._built) this._render();
    this._update();
  }

  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }
  disconnectedCallback() { if (this._tick) { clearInterval(this._tick); this._tick = null; } }

  _st(id) { return id && this._hass ? this._hass.states[id] : undefined; }
  _n(id) { const s = this._st(id); const v = s ? parseFloat(s.state) : NaN; return Number.isFinite(v) ? v : null; }
  _on(id) { const s = this._st(id); return !!s && s.state === "on"; }
  _toast(message) { this.dispatchEvent(new CustomEvent("hass-notification", { bubbles: true, composed: true, detail: { message } })); }
  _esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  _modes() {
    const p = this._config.pumps;
    return [
      { v: "Independent", l1: "EACH ON", l2: "ITS OWN" },
      { v: "Pump 1 master", l1: `${p[0].name.toUpperCase()}`, l2: "MASTER" },
      { v: "Pump 2 master", l1: `${p[1].name.toUpperCase()}`, l2: "MASTER" },
    ];
  }

  _unlocked() {
    return !this._config.pin || (this._pinUntil && Date.now() < this._pinUntil);
  }

  _guard(fn) {
    if (this._unlocked()) return fn();
    this._pending = fn;
    const row = this.shadowRoot.getElementById("pinrow");
    row.classList.add("show");
    const inp = this.shadowRoot.getElementById("pin");
    inp.value = "";
    setTimeout(() => inp.focus(), 50);
  }

  _checkPin() {
    const inp = this.shadowRoot.getElementById("pin");
    if (String(inp.value) === String(this._config.pin)) {
      this._pinUntil = Date.now() + 10 * 60 * 1000;
      this.shadowRoot.getElementById("pinrow").classList.remove("show");
      const fn = this._pending; this._pending = null;
      if (fn) fn();
    } else {
      this._toast("Wrong PIN");
      inp.value = "";
    }
  }

  _confirm(btn, fn) {
    if (btn.dataset.armed === "1") {
      btn.dataset.armed = ""; btn.classList.remove("armed"); clearTimeout(btn._t);
      return fn();
    }
    this.shadowRoot.querySelectorAll(".armed").forEach((b) => { b.dataset.armed = ""; b.classList.remove("armed"); });
    btn.dataset.armed = "1"; btn.classList.add("armed");
    btn._t = setTimeout(() => { btn.dataset.armed = ""; btn.classList.remove("armed"); }, 3000);
  }

  _setMode(v) {
    const id = this._config.controller.mode;
    if (!this._st(id)) return this._toast(`${id} not found — add pump_house_controller.yaml`);
    this._hass.callService("input_select", "select_option", { entity_id: id, option: v })
      .then(() => this._toast(`Pump house: ${v}`))
      .catch((e) => this._toast(`Mode change failed — ${e.message || e}`));
  }

  _setSelect(id, v, what) {
    if (!this._st(id)) return this._toast(`${id} not found — update pump_house_controller.yaml`);
    this._hass.callService("input_select", "select_option", { entity_id: id, option: v })
      .then(() => this._toast(`${what}: ${v}`))
      .catch((e) => this._toast(`Change failed — ${e.message || e}`));
  }

  _nudge(key, dir) {
    const id = this._config.controller[key];
    const st = this._st(id);
    if (!st) return this._toast(`${id} not found — add pump_house_controller.yaml`);
    const a = st.attributes, step = Number(a.step) || 1;
    const v = Math.min(Number(a.max), Math.max(Number(a.min), (parseFloat(st.state) || 0) + dir * step));
    this._hass.callService("input_number", "set_value", { entity_id: id, value: Math.round(v / step) * step });
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const cfg = this._config;
    const pumpTile = (i) => `
      <div class="pump" id="p${i}">
        <div class="ptop"><span class="pname">${this._esc(cfg.pumps[i].name)}</span><span class="role" id="role${i}">—</span></div>
        <div class="lcd">
          <div class="big"><span id="hz${i}">—</span><small>Hz</small></div>
          <div class="bar"><i id="bar${i}"></i></div>
          <div class="row"><span>PR <b id="pr${i}">—</b></span><span>SP <b id="sp${i}">—</b></span></div>
          <div class="row"><span><b id="a${i}">—</b> A</span><span id="st${i}">—</span></div>
        </div>
      </div>`;
    const setting = (key, label, unit) => `
      <div class="set"><span class="sl">${label}</span>
        <button class="nb" data-k="${key}" data-d="-1">−</button>
        <span class="sv"><b id="v_${key}">—</b> ${unit}</span>
        <button class="nb" data-k="${key}" data-d="1">+</button></div>`;
    this.shadowRoot.innerHTML = `
      <style>${this._css()}</style>
      <ha-card>
        <div class="head">
          <img class="logo" src="${HAMLET_LOGO}" alt="Hamlet Elektries">
          <div class="title">${this._esc(cfg.name)}</div>
        </div>
        <div class="pumps">${pumpTile(0)}<div class="arrow" id="arrow">⇄</div>${pumpTile(1)}</div>
        <div class="status" id="status">—</div>
        <div class="timing" id="timing" hidden><div class="tline" id="tline">—</div><div class="tbar"><i id="tbar"></i></div></div>
        <div class="modes">${this._modes().map((m, j) =>
          `<button class="mode" data-mode="${this._esc(m.v)}" id="m${j}">${this._esc(m.l1)}<br>${this._esc(m.l2)}</button>`).join("")}</div>
        <div class="assist" id="assist">
          <div class="ah">THE SLAVE RUNS ON…</div>
          <div class="meth">
            <button class="mb" data-method="Own pressure" id="mt0">OWN PRESSURE</button>
            <button class="mb" data-method="Follow master" id="mt1">FOLLOW MASTER</button>
          </div>
          <div class="mhint" id="mhint">—</div>
          <div class="ah">SLAVE HELPS WHEN THE MASTER…</div>
          ${setting("start_hz", "runs above", "Hz")}
          ${setting("start_delay", "for", "s")}
          <div class="ah">SLAVE STOPS WHEN THE MASTER…</div>
          ${setting("stop_hz", "drops below", "Hz")}
          ${setting("stop_delay", "for", "s")}
          <div class="warn" id="warn" hidden></div>
        </div>
        <div class="assist minbox" id="minbox">
          <div class="ah">BOTH PUMPS</div>
          ${setting("min_hz", "min speed", "Hz")}
          <div class="mhint">Written to both pumps' program min speed (D272). 0 = leave as is.</div>
        </div>
        <div class="pinrow" id="pinrow"><span>PIN</span><input id="pin" type="password" inputmode="numeric" autocomplete="off"><button id="pinok">OK</button></div>
      </ha-card>`;
    const r = this.shadowRoot;
    r.querySelectorAll(".mode").forEach((b) => b.addEventListener("click", () =>
      this._guard(() => this._confirm(b, () => this._setMode(b.dataset.mode)))));
    r.querySelectorAll(".mb").forEach((b) => b.addEventListener("click", () =>
      this._guard(() => this._setSelect(cfg.controller.method, b.dataset.method, "Slave runs on"))));
    r.querySelectorAll(".nb").forEach((b) => b.addEventListener("click", () =>
      this._guard(() => this._nudge(b.dataset.k, Number(b.dataset.d)))));
    r.getElementById("pinok").addEventListener("click", () => this._checkPin());
    r.getElementById("pin").addEventListener("keydown", (e) => { if (e.key === "Enter") this._checkPin(); });
    [0, 1].forEach((i) => r.getElementById(`p${i}`).addEventListener("click", () => {
      const id = cfg.pumps[i].hz;
      if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: id } }));
    }));
    this._built = true;
  }

  _update() {
    if (!this._built || !this._hass) return;
    const r = this.shadowRoot, cfg = this._config, c = cfg.controller;
    const $ = (id) => r.getElementById(id);
    const set = (id, t) => { const el = $(id); if (el) el.textContent = t; };
    const mode = this._st(c.mode) ? this._st(c.mode).state : null;
    const masterIdx = mode === "Pump 1 master" ? 0 : mode === "Pump 2 master" ? 1 : -1;
    [0, 1].forEach((i) => {
      const p = cfg.pumps[i];
      const hz = this._n(p.hz), pr = this._n(p.pressure), sp = this._n(p.setpoint), a = this._n(p.amps);
      const running = hz !== null && hz > 0.5, fault = this._on(p.fault), sleep = this._on(p.sleep);
      const hzSt = this._st(p.hz);
      const offline = !hzSt || ["unavailable", "unknown"].includes(hzSt.state);
      set(`hz${i}`, hz === null ? "—" : hz.toFixed(1));
      set(`pr${i}`, pr === null ? "—" : pr.toFixed(2));
      set(`sp${i}`, sp === null ? "—" : sp.toFixed(2));
      set(`a${i}`, a === null ? "—" : a.toFixed(1));
      set(`st${i}`, offline ? "OFFLINE" : fault ? "FAULT" : sleep ? "SLEEP" : running ? "RUN" : "STOP");
      $(`bar${i}`).style.width = `${hz === null ? 0 : Math.min(100, (hz / (cfg.max_frequency || 50)) * 100)}%`;
      const role = masterIdx < 0 ? "SOLO" : masterIdx === i ? "MASTER" : "SLAVE";
      set(`role${i}`, role);
      $(`role${i}`).className = `role ${role.toLowerCase()}`;
      $(`p${i}`).className = `pump ${running ? "run" : ""} ${fault ? "fault" : ""} ${offline ? "off" : ""}`;
    });
    set("arrow", masterIdx === 0 ? "→" : masterIdx === 1 ? "←" : "⇄");
    const status = this._st(c.status);
    set("status", status ? status.state : mode ? mode : "Controller not installed — add pump_house_controller.yaml");
    this._modes().forEach((m, j) => $(`m${j}`).classList.toggle("on", mode === m.v));
    $("assist").classList.toggle("dim", masterIdx < 0);
    // ---- countdown while the slave's start / stop delay is running ----
    let timing = null;
    if (masterIdx >= 0) {
      const si = 1 - masterIdx, sHz = this._n(cfg.pumps[si].hz), slaveRun = sHz !== null && sHz > 0.5;
      const pick = (sensor, delayKey, verb) => {
        const st = this._st(sensor);
        if (!st || st.state !== "on") return null;
        const total = this._n(c[delayKey]) || 0;
        const left = Math.max(0, total - (Date.now() - new Date(st.last_changed).getTime()) / 1000);
        return { verb, left, total, name: cfg.pumps[si].name };
      };
      timing = !slaveRun ? pick(c.start_timer, "start_delay", "starts") : pick(c.stop_timer, "stop_delay", "stops");
    }
    const tEl = $("timing");
    tEl.hidden = !timing;
    if (timing) {
      const l = Math.ceil(timing.left);
      const txt = l <= 0 ? `${timing.name} ${timing.verb === "starts" ? "starting" : "stopping"}…`
        : `${timing.name} ${timing.verb} in ${l >= 60 ? `${Math.floor(l / 60)}:${String(l % 60).padStart(2, "0")}` : `${l} s`}`;
      set("tline", `⏱ ${txt}`);
      tEl.classList.toggle("stop", timing.verb === "stops");
      $("tbar").style.width = `${timing.total > 0 ? Math.min(100, ((timing.total - timing.left) / timing.total) * 100) : 100}%`;
    }
    if (timing && !this._tick) this._tick = setInterval(() => this._update(), 1000);
    if (!timing && this._tick) { clearInterval(this._tick); this._tick = null; }
    const meth = this._st(c.method) ? this._st(c.method).state : null;
    $("mt0").classList.toggle("on", meth === "Own pressure");
    $("mt1").classList.toggle("on", meth === "Follow master");
    set("mhint", !meth ? "Update pump_house_controller.yaml for this option"
      : meth === "Follow master" ? "Slave runs at the master's speed (APP MAN), never below min speed. Master holds the setpoint."
      : "Slave uses its own pressure control on the master's setpoint (may sleep near the setpoint).");
    const minHz = this._n(c.min_hz), stopHz = this._n(c.stop_hz);
    const warn = minHz && stopHz !== null && stopHz <= minHz
      ? `"Drops below" (${stopHz.toFixed(1)} Hz) must be above min speed (${minHz.toFixed(1)} Hz) — otherwise the slave never stops.` : "";
    $("warn").hidden = !warn; set("warn", warn);
    ["start_hz", "start_delay", "stop_hz", "stop_delay", "min_hz"].forEach((k) => {
      const v = this._n(c[k]);
      set(`v_${k}`, v === null ? "—" : (k.endsWith("hz") ? v.toFixed(1) : v.toFixed(0)));
    });
  }

  _css() {
    return `
      ha-card { background: linear-gradient(180deg, #3b3f45, #2f3236); color: #e8edf3; border-radius: var(--ha-card-border-radius, 14px);
        padding: 14px; font-family: var(--paper-font-body1_-_font-family, "Roboto", system-ui, sans-serif); }
      :host ha-card { background: linear-gradient(180deg, #3b3f45, #2f3236) !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; color: #e8edf3 !important; }
      :host ha-card::before, :host ha-card::after { content: none !important; display: none !important; }
      .head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,.12); }
      .logo { height: 40px; max-width: 55%; object-fit: contain; object-position: left center; }
      .title { font-size: 18px; font-weight: 600; text-align: right; }
      .pumps { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; margin-top: 12px; }
      .arrow { font-size: 26px; color: #6dd6fa; font-weight: 700; }
      .pump { background: #1b1c1f; border-radius: 12px; padding: 8px; border-top: 5px solid #2b8fd6; cursor: pointer; min-width: 0; }
      .pump.run { box-shadow: 0 0 0 2px #3fbf6a inset; }
      .pump.fault { box-shadow: 0 0 0 2px #e2453f inset; }
      .pump.off { opacity: .6; }
      .ptop { display: flex; justify-content: space-between; align-items: center; gap: 6px; margin-bottom: 6px; }
      .pname { font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .role { font-size: 10px; font-weight: 800; letter-spacing: 1px; padding: 2px 6px; border-radius: 999px; background: #4b5058; }
      .role.master { background: #1f9ad3; }
      .role.slave { background: #b67a0c; }
      .lcd { background: linear-gradient(180deg, #c3c6f2, #dfe1fb); color: #1b1e46; border-radius: 4px; padding: 6px;
        font-family: "DejaVu Sans Mono", "Consolas", "Menlo", monospace; font-weight: 700; box-shadow: inset 0 0 0 2px #0e0f12; }
      .big { font-size: 28px; text-align: right; line-height: 1.1; white-space: nowrap; }
      .big small { font-size: 13px; margin-left: 4px; }
      .bar { height: 6px; border: 2px solid #1b1e46; margin: 4px 0; }
      .bar i { display: block; height: 100%; width: 0; background: #1b1e46; transition: width .6s; }
      .row { display: flex; justify-content: space-between; font-size: 12px; gap: 4px; white-space: nowrap; }
      .status { text-align: center; margin: 12px 0 8px; font-size: 14px; font-weight: 600; color: #cfe8ff; }
      .timing { margin: -2px 0 10px; padding: 8px 10px; border-radius: 10px; background: rgba(255,176,32,.12); border: 1px solid rgba(255,176,32,.5); }
      .timing[hidden] { display: none; }
      .timing .tline { text-align: center; font-weight: 800; font-size: 15px; color: #ffb020; font-variant-numeric: tabular-nums; }
      .timing .tbar { height: 5px; margin-top: 6px; border-radius: 3px; background: rgba(255,255,255,.12); overflow: hidden; }
      .timing .tbar i { display: block; height: 100%; width: 0; background: #ffb020; transition: width 1s linear; }
      .timing.stop { background: rgba(109,214,250,.10); border-color: rgba(109,214,250,.5); }
      .timing.stop .tline { color: #6dd6fa; }
      .timing.stop .tbar i { background: #6dd6fa; }
      button { font: inherit; cursor: pointer; border: none; color: #fff; -webkit-tap-highlight-color: transparent; }
      .modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .mode { border-radius: 10px; padding: 10px 4px; font-size: 13px; font-weight: 800; line-height: 1.15;
        background: linear-gradient(180deg, #6b7079, #4b5058 60%, #3d4148); box-shadow: 0 3px 0 rgba(0,0,0,.5); }
      .mode.on { background: linear-gradient(180deg, #6dd6fa 0%, #33b2e6 55%, #1f9ad3 100%); box-shadow: 0 0 0 3px #e9f8ff, 0 0 14px #6dd6fa; }
      .mode.armed, .nb.armed { outline: 3px solid #ffb020; outline-offset: 2px; }
      .assist { margin-top: 12px; background: rgba(0,0,0,.2); border-radius: 10px; padding: 8px 10px; transition: opacity .3s; }
      .assist.dim { opacity: .45; }
      .ah { font-size: 10px; letter-spacing: 1.2px; opacity: .65; margin: 4px 0; }
      .meth { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 4px 0; }
      .mb { border-radius: 8px; padding: 8px 4px; font-size: 12px; font-weight: 800; background: linear-gradient(180deg, #6b7079, #4b5058 60%, #3d4148); box-shadow: 0 2px 0 rgba(0,0,0,.5); }
      .mb.on { background: linear-gradient(180deg, #6dd6fa 0%, #33b2e6 55%, #1f9ad3 100%); box-shadow: 0 0 0 2px #e9f8ff; }
      .mhint { font-size: 11px; opacity: .7; margin: 2px 0 6px; line-height: 1.3; }
      .warn { margin-top: 6px; font-size: 12px; font-weight: 700; color: #ffb020; }
      .warn[hidden] { display: none; }
      .minbox { margin-top: 8px; }
      .set { display: grid; grid-template-columns: 1fr 36px 84px 36px; align-items: center; gap: 6px; margin: 4px 0; }
      .sl { font-size: 13px; }
      .sv { text-align: center; font-family: monospace; font-size: 15px; }
      .nb { height: 32px; border-radius: 8px; font-size: 18px; font-weight: 700; color: #111;
        background: linear-gradient(180deg, #fafafa, #d4d4d4); box-shadow: 0 2px 0 rgba(0,0,0,.5); }
      .pinrow { display: none; align-items: center; gap: 8px; margin-top: 10px; }
      .pinrow.show { display: flex; }
      .pinrow input { flex: 1; font-size: 18px; padding: 6px 8px; border-radius: 8px; border: none; }
      .pinrow button { background: #1f9ad3; padding: 8px 14px; border-radius: 8px; font-weight: 700; }
    `;
  }
}

customElements.define("hamlet-pump-house-card", HamletPumpHouseCard);

/* ===================================================================== */
/*  Hamlet history card — several values over time, each on its own scale */
/* ===================================================================== */

const HH_COLORS = ["#ff4d5e", "#3b8beb", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#e84393"];
const HH_PUMP = (n) => {
  const d = n === 2 ? "vfd2" : "vfd", p = n === 2 ? "pump2" : "pump";
  return [
    { entity: `sensor.${p}_power`, name: "Power" },
    { entity: `sensor.${p}_pressure`, name: "Pressure" },
    { entity: `sensor.${d}_output_current`, name: "Amps" },
    { entity: `sensor.${d}_output_frequency`, name: "Hz" },
    { entity: `sensor.${d}_igbt_temperature`, name: "IGBT temp" },
  ];
};
const HH_RANGES = [6, 24, 72, 168];

class HamletHistoryCard extends HTMLElement {
  static getStubConfig() { return { title: "Pump history", pump: 1, hours: 24 }; }
  static getConfigElement() { return document.createElement("hamlet-history-card-editor"); }

  setConfig(config) {
    const pump = Number(config.pump) === 2 ? 2 : 1;
    let ents = config.entities && config.entities.length ? config.entities : HH_PUMP(pump);
    ents = ents.map((e, i) => (typeof e === "string" ? { entity: e } : { ...e }))
      .filter((e) => e.entity)
      .map((e, i) => ({ ...e, color: e.color || HH_COLORS[i % HH_COLORS.length] }));
    this._config = { title: "Pump history", hours: 24, height: 220, logo: true, ...config, entities: ents };
    this._hours = Number(this._config.hours) || 24;
    this._hidden = this._hidden || new Set();
    this._built = false;
    this._data = null;
    if (this._hass) { this._render(); this._load(); }
  }

  set hass(h) {
    const first = !this._hass;
    this._hass = h;
    if (!this._config) return;
    if (!this._built) this._render();
    if (first || !this._data) this._load();
    this._legend();
  }

  connectedCallback() {
    this._timer = setInterval(() => this._load(), 5 * 60 * 1000);
    if (!this._ro && window.ResizeObserver) {
      this._ro = new ResizeObserver(() => this._draw());
      this._ro.observe(this);
    }
  }
  disconnectedCallback() { clearInterval(this._timer); if (this._ro) { this._ro.disconnect(); this._ro = null; } }
  getCardSize() { return 5; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }

  _esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  _name(e) {
    const st = this._hass && this._hass.states[e.entity];
    return e.name || (st && st.attributes.friendly_name) || e.entity;
  }
  _unit(e) {
    const st = this._hass && this._hass.states[e.entity];
    return e.unit ?? (st && st.attributes.unit_of_measurement) ?? "";
  }
  _fmt(v, e) {
    if (v === null || v === undefined || !Number.isFinite(v)) return "—";
    const u = String(this._unit(e)).toLowerCase();
    const d = e.decimals ?? (["bar", "psi", "kpa"].includes(u) ? 2 : Math.abs(v) >= 100 ? 0 : 1);
    return v.toFixed(d);
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const cfg = this._config;
    this.shadowRoot.innerHTML = `
      <style>${this._css()}</style>
      <ha-card>
        <div class="head">
          ${cfg.logo ? `<img class="logo" src="${HAMLET_LOGO}" alt="Hamlet Elektries">` : ""}
          <div class="title">${this._esc(cfg.title)}</div>
          <div class="ranges">${HH_RANGES.map((h) => `<button class="rb" data-h="${h}">${h < 24 ? h + "h" : h / 24 + "d"}</button>`).join("")}</div>
        </div>
        <div class="legend" id="legend"></div>
        <div class="plot" id="plot"><div class="msg" id="msg">Loading history…</div></div>
      </ha-card>`;
    this.shadowRoot.querySelectorAll(".rb").forEach((b) => b.addEventListener("click", () => {
      this._hours = Number(b.dataset.h); this._data = null; this._load(); this._ranges();
    }));
    this._built = true;
    this._ranges();
    this._legend();
  }

  _ranges() {
    this.shadowRoot.querySelectorAll(".rb").forEach((b) => b.classList.toggle("on", Number(b.dataset.h) === this._hours));
  }

  async _load() {
    if (!this._hass || !this._config || this._loading) return;
    this._loading = true;
    const end = new Date(), start = new Date(end.getTime() - this._hours * 3600 * 1000);
    const ids = this._config.entities.map((e) => e.entity);
    try {
      const res = await this._hass.callWS({
        type: "history/history_during_period", start_time: start.toISOString(), end_time: end.toISOString(),
        entity_ids: ids, minimal_response: true, no_attributes: true, significant_changes_only: false,
      });
      const data = {};
      for (const id of ids) {
        const rows = res[id] || [];
        const pts = [];
        for (const r of rows) {
          const t = r.lu !== undefined ? r.lu * 1000 : r.lc !== undefined ? r.lc * 1000 : Date.parse(r.last_updated || r.last_changed);
          const v = parseFloat(r.s !== undefined ? r.s : r.state);
          pts.push([t, Number.isFinite(v) ? v : null]);
        }
        data[id] = pts;
      }
      this._data = { start: start.getTime(), end: end.getTime(), series: data };
      this._draw();
    } catch (e) {
      const m = this.shadowRoot.getElementById("msg");
      if (m) { m.hidden = false; m.textContent = `History not available — ${e.message || e.code || e}`; }
    } finally {
      this._loading = false;
    }
  }

  // average per time bucket; a gap keeps the last value (states only change when the value changes)
  _bucket(pts, t0, t1, n) {
    const out = new Array(n).fill(null), sum = new Array(n).fill(0), cnt = new Array(n).fill(0);
    const w = (t1 - t0) / n;
    let last = null, i = 0;
    while (i < pts.length && pts[i][0] < t0) { last = pts[i][1]; i++; }
    for (let b = 0; b < n; b++) {
      const be = t0 + (b + 1) * w;
      while (i < pts.length && pts[i][0] < be) { if (pts[i][1] !== null) { sum[b] += pts[i][1]; cnt[b]++; } last = pts[i][1]; i++; }
      out[b] = cnt[b] ? sum[b] / cnt[b] : last;
    }
    return out;
  }

  _draw() {
    const plot = this.shadowRoot && this.shadowRoot.getElementById("plot");
    if (!plot || !this._data) return;
    const W = Math.max(280, plot.clientWidth || 600), H = Number(this._config.height) || 220;
    const padL = 44, padR = 10, padT = 8, padB = 22, iw = W - padL - padR, ih = H - padT - padB;
    const N = Math.min(400, Math.max(60, Math.floor(iw / 2)));
    const { start, end, series } = this._data;
    const vis = this._config.entities.filter((e) => !this._hidden.has(e.entity));
    const lines = vis.map((e) => {
      const vals = this._bucket(series[e.entity] || [], start, end, N);
      const nums = vals.filter((v) => v !== null);
      let lo = nums.length ? Math.min(...nums) : 0, hi = nums.length ? Math.max(...nums) : 1;
      if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
      const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
      if (nums.length && Math.min(...nums) >= 0 && lo < 0) lo = 0;
      return { e, vals, lo, hi };
    });
    const x = (b) => padL + (b / (N - 1)) * iw;
    const y = (v, l) => padT + ih - ((v - l.lo) / (l.hi - l.lo)) * ih;
    const path = (l) => {
      let d = "", pen = false;
      l.vals.forEach((v, b) => { if (v === null) { pen = false; return; } d += `${pen ? "L" : "M"}${x(b).toFixed(1)},${y(v, l).toFixed(1)}`; pen = true; });
      return d;
    };
    // axis of the first visible line
    const ax = lines[0];
    let yTicks = "";
    if (ax) {
      for (let k = 0; k <= 4; k++) {
        const v = ax.lo + ((ax.hi - ax.lo) * k) / 4, yy = y(v, ax);
        yTicks += `<line x1="${padL}" x2="${W - padR}" y1="${yy}" y2="${yy}" class="grid"/><text x="${padL - 6}" y="${yy + 4}" class="yl" fill="${ax.e.color}">${this._fmt(v, ax.e)}</text>`;
      }
    }
    // time labels
    const span = end - start, step = this._hours <= 6 ? 3600e3 : this._hours <= 24 ? 4 * 3600e3 : this._hours <= 72 ? 12 * 3600e3 : 24 * 3600e3;
    let xTicks = "";
    const first = Math.ceil(start / step) * step;
    for (let t = first; t < end; t += step) {
      const xx = padL + ((t - start) / span) * iw, d = new Date(t);
      const lbl = step >= 24 * 3600e3 || (d.getHours() === 0 && this._hours > 24)
        ? d.toLocaleDateString(undefined, { day: "numeric", month: "short" })
        : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
      xTicks += `<line x1="${xx}" x2="${xx}" y1="${padT}" y2="${padT + ih}" class="grid v"/><text x="${xx}" y="${H - 6}" class="xl">${lbl}</text>`;
    }
    const svg = `
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" id="svg">
        <defs>${lines.map((l, i) => `<linearGradient id="g${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${l.e.color}" stop-opacity=".28"/><stop offset="1" stop-color="${l.e.color}" stop-opacity="0"/></linearGradient>`).join("")}</defs>
        ${yTicks}${xTicks}
        ${lines.map((l, i) => { const d = path(l); return d ? `${i === 0 ? `<path d="${d}L${x(N - 1)},${padT + ih}L${padL},${padT + ih}Z" fill="url(#g${i})" stroke="none"/>` : ""}<path d="${d}" class="ln" stroke="${l.e.color}"/>` : ""; }).join("")}
        <line id="cur" x1="0" x2="0" y1="${padT}" y2="${padT + ih}" class="cur" visibility="hidden"/>
        <rect x="${padL}" y="${padT}" width="${iw}" height="${ih}" fill="transparent" id="hit"/>
      </svg>
      <div class="tip" id="tip" hidden></div>
      <div class="msg" id="msg" ${lines.some((l) => l.vals.some((v) => v !== null)) || !lines.length ? "hidden" : ""}>No history for this period</div>`;
    plot.innerHTML = svg;
    this._lines = lines;
    const hit = plot.querySelector("#hit"), cur = plot.querySelector("#cur"), tip = plot.querySelector("#tip");
    const move = (ev) => {
      const r = plot.querySelector("#svg").getBoundingClientRect();
      const px = ((ev.clientX - r.left) / r.width) * W;
      const b = Math.max(0, Math.min(N - 1, Math.round(((px - padL) / iw) * (N - 1))));
      const xx = x(b);
      cur.setAttribute("x1", xx); cur.setAttribute("x2", xx); cur.setAttribute("visibility", "visible");
      const t = new Date(start + (b / (N - 1)) * span);
      tip.innerHTML = `<div class="tt">${t.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })}</div>` +
        lines.map((l) => `<div><i style="background:${l.e.color}"></i>${this._esc(this._name(l.e))} <b>${this._fmt(l.vals[b], l.e)}</b> ${this._esc(this._unit(l.e))}</div>`).join("");
      tip.hidden = false;
      const left = (xx / W) * r.width;
      tip.style.left = `${left > r.width / 2 ? left - tip.offsetWidth - 10 : left + 10}px`;
    };
    hit.addEventListener("mousemove", move);
    hit.addEventListener("touchstart", (ev) => move(ev.touches[0]), { passive: true });
    hit.addEventListener("touchmove", (ev) => move(ev.touches[0]), { passive: true });
    const hide = () => { cur.setAttribute("visibility", "hidden"); tip.hidden = true; };
    hit.addEventListener("mouseleave", hide);
    hit.addEventListener("touchend", () => setTimeout(hide, 1500));
    this._legend();
  }

  _legend() {
    const el = this.shadowRoot && this.shadowRoot.getElementById("legend");
    if (!el || !this._hass) return;
    el.innerHTML = this._config.entities.map((e) => {
      const st = this._hass.states[e.entity];
      const v = st ? parseFloat(st.state) : NaN;
      const line = (this._lines || []).find((l) => l.e.entity === e.entity);
      const nums = line ? line.vals.filter((x) => x !== null) : [];
      const mm = nums.length ? `<span class="mm">▲ ${this._fmt(Math.max(...nums), e)} ▼ ${this._fmt(Math.min(...nums), e)}</span>` : "";
      return `<button class="li ${this._hidden.has(e.entity) ? "off" : ""}" data-e="${this._esc(e.entity)}">
        <i style="background:${e.color}"></i><span class="ln2">${this._esc(this._name(e))}</span>
        <b>${st ? this._fmt(v, e) : "—"}</b><small>${this._esc(this._unit(e))}</small>${mm}</button>`;
    }).join("");
    el.querySelectorAll(".li").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.e;
      if (this._hidden.has(id)) this._hidden.delete(id); else this._hidden.add(id);
      this._draw();
    }));
  }

  _css() {
    return `
      ha-card, :host ha-card { background: linear-gradient(180deg, #2b2e33, #1e2024) !important; color: #e8edf3 !important; border-radius: var(--ha-card-border-radius, 14px);
        padding: 14px; overflow: hidden; backdrop-filter: none !important; font-family: var(--paper-font-body1_-_font-family, "Roboto", system-ui, sans-serif); }
      :host ha-card::before, :host ha-card::after { content: none !important; display: none !important; }
      .head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,.1); }
      .logo { height: 34px; }
      .title { font-size: 17px; font-weight: 600; flex: 1; }
      .ranges { display: flex; gap: 4px; }
      .rb { font: inherit; font-size: 12px; font-weight: 700; color: #c8cfd8; background: #33373d; border: 0; border-radius: 7px; padding: 6px 9px; cursor: pointer; }
      .rb.on { background: #1f9ad3; color: #fff; }
      .legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 10px 0 6px; }
      .li { font: inherit; display: flex; align-items: baseline; gap: 6px; background: none; border: 0; color: #e8edf3; cursor: pointer; padding: 2px 0; }
      .li i { width: 10px; height: 10px; border-radius: 50%; display: inline-block; align-self: center; }
      .li .ln2 { font-size: 13px; font-weight: 600; }
      .li b { font-size: 14px; font-variant-numeric: tabular-nums; }
      .li small { font-size: 10px; opacity: .7; }
      .li .mm { font-size: 10px; opacity: .55; font-variant-numeric: tabular-nums; }
      .li.off { opacity: .35; }
      .li.off .ln2 { text-decoration: line-through; }
      .plot { position: relative; min-height: 120px; }
      .msg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; opacity: .7; }
      .msg[hidden] { display: none; }
      svg { display: block; overflow: visible; }
      .grid { stroke: rgba(255,255,255,.07); stroke-dasharray: 3 4; }
      .grid.v { stroke: rgba(255,255,255,.05); }
      .yl { font-size: 10px; text-anchor: end; font-variant-numeric: tabular-nums; }
      .xl { font-size: 10px; fill: #8a94a3; text-anchor: middle; }
      .ln { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
      .cur { stroke: rgba(255,255,255,.5); stroke-width: 1; }
      .tip { position: absolute; top: 6px; background: rgba(15,16,19,.95); border: 1px solid rgba(255,255,255,.12); border-radius: 8px; padding: 8px 10px;
        font-size: 12px; pointer-events: none; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,.4); }
      .tip[hidden] { display: none; }
      .tip .tt { font-weight: 700; margin-bottom: 4px; opacity: .8; }
      .tip i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
    `;
  }
}

class HamletHistoryCardEditor extends HTMLElement {
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(h) { this._hass = h; if (this._form) this._form.hass = h; else this._render(); }
  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => ({ title: "Title", pump: "Pump (default values)", hours: "Default period",
        entities: "Values to show (empty = the pump's power, pressure, amps, Hz, IGBT temp)", height: "Chart height (px)", logo: "Show Hamlet logo" }[s.name] || s.name);
      this._form.addEventListener("value-changed", (ev) => {
        const c = { ...ev.detail.value };
        if (Array.isArray(c.entities) && !c.entities.length) delete c.entities;
        this._config = c;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: c }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = [
      { name: "title", selector: { text: {} } },
      { name: "pump", selector: { select: { mode: "dropdown", options: [{ value: 1, label: "Pump 1 (vfd_ / pump_)" }, { value: 2, label: "Pump 2 (vfd2_ / pump2_)" }] } } },
      { name: "hours", selector: { select: { mode: "dropdown", options: HH_RANGES.map((h) => ({ value: h, label: h < 24 ? `${h} hours` : `${h / 24} day${h > 24 ? "s" : ""}` })) } } },
      { name: "entities", selector: { entity: { multiple: true, domain: "sensor" } } },
      { name: "height", selector: { number: { min: 120, max: 600, step: 10, mode: "box" } } },
      { name: "logo", selector: { boolean: {} } },
    ];
    const data = { ...this._config };
    if (Array.isArray(data.entities)) data.entities = data.entities.map((e) => (typeof e === "string" ? e : e.entity));
    this._form.data = data;
  }
}

customElements.define("hamlet-history-card", HamletHistoryCard);
customElements.define("hamlet-history-card-editor", HamletHistoryCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "hamlet-history-card",
  name: "Hamlet history (pump values over time)",
  description: "Power, pressure, amps, Hz, temperature over 6 h – 7 days, each line on its own scale",
  preview: true,
});

window.customCards = window.customCards || [];
window.customCards.push({
  type: "hamlet-pump-house-card",
  name: "Hamlet Pump House (master / slave)",
  description: "Two pumps: independent, or Pump 1 / Pump 2 as master with the other assisting",
  preview: true,
});

console.info(
  `%c DELTA-CP2000-CARD %c v${CARD_VERSION} `,
  "background:#1e7fd8;color:#fff;font-weight:700;border-radius:3px 0 0 3px",
  "background:#262c35;color:#fff;border-radius:0 3px 3px 0"
);
