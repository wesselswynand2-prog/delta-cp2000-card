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

const CARD_VERSION = "1.8.5";

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

const PAGES = ["main", "power", "motor", "info", "all"];
const PAGE_TITLES = { main: "MAIN", power: "POWER", motor: "MOTOR", info: "INFO", all: "ALL VALUES" };

// What each assignable key can do
const FUNCTIONS = [
  ["page_main", "LCD page: Main (F / H / A)"],
  ["page_power", "LCD page: Power (V / kW)"],
  ["page_motor", "LCD page: Motor / pump"],
  ["page_info", "LCD page: Info (kWh / hours)"],
  ["page_all", "LCD page: All values"],
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
  menu: { function: "page_all" },
  hand: { function: "none" },
  auto: { function: "none" },
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
    "output_power", "motor_speed", "igbt_temperature", "pid_feedback", ...(pressure && mode === "entities" ? ["pressure_setpoint"] : []),
    "energy", "run_hours"].map((k) => ent(k));

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
      schema: [...stateSensors, ...readings],
    },
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
    if (kind === "setpoint") return this._isPressure() ? !!c.pressure_setpoint_entity || mb : !!c.setpoint_entity || mb;
    if (kind === "fwd" || kind === "rev") return !!c.direction_entity || mb;
    if (kind === "stop") return !!c.stop_entity || this._switchLike(c.run_entity) || mb;
    return !!c[`${kind}_entity`] || mb;
  }

  async _writeRegister(address, value) {
    const c = this._config.control;
    await this._hass.callService("modbus", "write_register", {
      hub: c.hub,
      slave: Number(c.slave) || 1,
      address,
      value,
    });
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
    const id = this._config.control.app_control_entity;
    const s = id && this._hass ? this._hass.states[id] : null;
    return !!s && s.state === "on";
  }

  // In entities mode with an APP CONTROL switch: only allow RUN / speed / reset while it is on.
  _appBlocked() {
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
        await this._writeRegister(8193, Math.round((pressure ? this._pToHz(hz) : hz) * 100));
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
    if (f.startsWith("page_")) {
      this._page = f.slice(5);
      this._update();
      return;
    }
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
            <button class="bk" data-key="menu" id="k_menu">MENU</button>

            <button class="gk left" id="k_left" title="Previous page">${chev("left")}</button>
            <button class="enter" id="k_enter" title="Send speed to drive">ENTER</button>
            <button class="gk right" id="k_right" title="Next page">${chev("right")}</button>

            <button class="bk" data-key="hand" id="k_hand">HAND</button>
            <button class="gk down" id="k_down" title="Speed down">${chev("down")}</button>
            <button class="bk" data-key="auto" id="k_auto">AUTO</button>
          </div>

          ${showRow ? `
          <div class="minileds"><i id="ml_run"></i><i id="ml_dir"></i><i id="ml_stop"></i></div>
          <div class="runrow">
            <button class="runkey" id="b_run">RUN</button>
            ${entMode || cfg.control.app_control_entity
              ? `<button class="appkey" id="b_app">APP<br>CONTROL</button>`
              : `<button class="fwdrev" id="b_dir"><span class="fw">FWD</span><span class="rv">REV</span></button>`}
            <button class="stopkey" id="b_stop">STOP<br>RESET</button>
          </div>` : ""}
        </div>
      </ha-card>`;

    const root = this.shadowRoot;
    const on = (id, fn) => {
      const el = root.getElementById(id);
      if (el) el.addEventListener("click", () => fn(el));
    };
    root.getElementById("screen").addEventListener("click", (ev) => {
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
    on("k_esc", () => this._esc());
    on("k_up", () => this._nudge(1));
    on("k_down", () => this._nudge(-1));
    on("k_left", () => this._turnPage(-1));
    on("k_right", () => this._turnPage(1));
    on("k_enter", () => {
      if (this._sp !== null && !this._spSentAt) this._sendSetpoint();
      else this._toast("Use ▲ / ▼ to change the speed, then ENTER");
    });
    on("b_run", (b) => this._confirmThen(b, () => this._command("run")));
    on("b_stop", (b) => {
      // Like the real STOP/RESET key: stops when running, resets when tripped.
      if (this._faulted) this._confirmThen(b, () => this._command("reset"));
      else this._command("stop"); // stop never needs confirmation
    });
    on("b_app", (b) => {
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
  }

  _tapBox(b) {
    const cfg = this._config;
    const bc = (cfg.boxes && cfg.boxes[b]) || {};
    const id = bc.entity || (b === "box1" && !cfg.boxes ? cfg.entities.output_power : null);
    if (!id || bc.tap === "none") return;
    if (bc.tap === "toggle") this._hass.callService("homeassistant", "toggle", { entity_id: id });
    else this._moreInfo(id);
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
    $("pill").className = `pill ${cls}`;
    set("pilltxt", state);

    // LEDs
    $("led_err").className = faulted ? "on red" : wcode ? "on amber blinkled" : "";
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
    set("t_run", sw !== null ? RUN_STATES[run] : running ? "RUN" : "STOP");
    set("t_page", faulted ? "FAULT" : commsLost ? "----" : PAGE_TITLES[this._page]);
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
        <div class="pfoot"><div class="pf st">${running ? (reverse ? "REV RUN" : "RUN") : "STOP"}</div>${soft}</div>
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
      html =
        this._line("energy", "E", f(n("energy"), 1), "kWh", { sel: true }) +
        this._line("run_hours", "h", f(n("run_hours"), 0), "Hr") +
        this._line("fault", "Er", wcode ? `W${wcode}` : "none", "");
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
    }

    // keys
    this._dirNext = reverse ? "fwd" : "rev";
    $("k_enter").classList.toggle("ready", editing);
    if ($("b_dir")) $("b_dir").classList.toggle("isrev", reverse);
    if ($("b_app")) $("b_app").classList.toggle("on", this._appOn());
    if ($("b_run")) $("b_run").classList.toggle("lit", running && !faulted);
    if ($("b_stop")) $("b_stop").classList.toggle("attn", faulted);
    for (const k of ["menu", "hand", "auto"]) {
      const b = $(`k_${k}`);
      if (b) b.classList.toggle("lit", this._keyActive(k));
    }
  }

  _esc_(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  _css() {
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

console.info(
  `%c DELTA-CP2000-CARD %c v${CARD_VERSION} `,
  "background:#1e7fd8;color:#fff;font-weight:700;border-radius:3px 0 0 3px",
  "background:#262c35;color:#fff;border-radius:0 3px 3px 0"
);
