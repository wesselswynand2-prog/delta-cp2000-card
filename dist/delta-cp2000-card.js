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

const CARD_VERSION = "1.0.0";

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

const LABELS = {
  name: "Name",
  logo: "Logo image URL (e.g. /local/hamlet-logo.png)",
  brand: "Brand text (shown when no logo)",
  min_frequency: "Min Hz",
  max_frequency: "Max Hz",
  step: "Step Hz",
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
  pid_feedback: "PID feedback / pressure",
  energy: "Energy (kWh)",
  run_hours: "Run hours",
  hub: "Modbus hub name",
  slave: "Drive Modbus address (09-00)",
  run_entity: "Run button/script (instead of Modbus)",
  stop_entity: "Stop button/script (instead of Modbus)",
  reset_entity: "Reset button/script (instead of Modbus)",
  setpoint_entity: "Setpoint number entity (instead of Modbus)",
  show_controls: "Show controls",
  allow_reverse: "Allow reverse",
  confirm_actions: "Tap twice to confirm",
};

const ENTITY_KEYS = [
  "status", "fault", "frequency_command", "output_frequency", "output_current",
  "output_voltage", "dc_bus_voltage", "output_power", "motor_speed",
  "igbt_temperature", "pid_feedback", "energy", "run_hours",
];

class DeltaCP2000Card extends HTMLElement {
  static getConfigForm() {
    const ent = (name, domain = "sensor") => ({ name, selector: { entity: { domain } } });
    return {
      schema: [
        { name: "name", selector: { text: {} } },
        {
          type: "grid",
          schema: [
            { name: "logo", selector: { text: {} } },
            { name: "brand", selector: { text: {} } },
          ],
        },
        {
          type: "grid",
          schema: [
            { name: "min_frequency", selector: { number: { min: 0, max: 600, step: 0.5, mode: "box", unit_of_measurement: "Hz" } } },
            { name: "max_frequency", selector: { number: { min: 1, max: 600, step: 0.5, mode: "box", unit_of_measurement: "Hz" } } },
            { name: "step", selector: { number: { min: 0.01, max: 10, step: 0.01, mode: "box", unit_of_measurement: "Hz" } } },
          ],
        },
        {
          type: "expandable",
          name: "entities",
          title: "Drive sensors",
          expanded: true,
          schema: ENTITY_KEYS.map((k) => ent(k)),
        },
        {
          type: "expandable",
          name: "control",
          title: "Control",
          schema: [
            {
              type: "grid",
              schema: [
                { name: "hub", selector: { text: {} } },
                { name: "slave", selector: { number: { min: 1, max: 254, mode: "box" } } },
              ],
            },
            ent("run_entity", ["button", "script", "input_button", "switch"]),
            ent("stop_entity", ["button", "script", "input_button", "switch"]),
            ent("reset_entity", ["button", "script", "input_button"]),
            ent("setpoint_entity", ["number", "input_number"]),
          ],
        },
        {
          type: "grid",
          schema: [
            { name: "show_controls", selector: { boolean: {} } },
            { name: "allow_reverse", selector: { boolean: {} } },
            { name: "confirm_actions", selector: { boolean: {} } },
          ],
        },
      ],
      computeLabel: (s) => LABELS[s.name] || s.name,
    };
  }

  static getStubConfig() {
    return {
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
    };
  }

  setConfig(config) {
    if (!config || !config.entities || !config.entities.output_frequency) {
      throw new Error("Set entities.output_frequency (and ideally entities.status) — see README");
    }
    this._config = {
      name: "VFD",
      brand: "HAMLET elektries",
      min_frequency: 0,
      max_frequency: 50,
      step: 0.5,
      show_controls: true,
      allow_reverse: false,
      confirm_actions: true,
      ...config,
      entities: { ...config.entities },
      control: { slave: 1, ...(config.control || {}) },
    };
    this._sp = null;
    this._built = false;
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._built) this._render();
    this._update();
  }

  getCardSize() {
    return this._config && this._config.show_controls ? 7 : 5;
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
    return Number.isFinite(v) ? v : null;
  }

  _unit(key, fallback) {
    const s = this._st(key);
    return (s && s.attributes.unit_of_measurement) || fallback;
  }

  _fmt(v, dp) {
    return v === null || v === undefined ? "—" : Number(v).toFixed(dp);
  }

  _moreInfo(key) {
    const id = this._config.entities[key];
    if (!id) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: id } }));
  }

  _toast(message) {
    this.dispatchEvent(new CustomEvent("hass-notification", { bubbles: true, composed: true, detail: { message } }));
  }

  /* ---------------- control ---------------- */

  _canControl(kind) {
    const c = this._config.control;
    if (kind === "setpoint") return !!(c.setpoint_entity || c.hub);
    return !!(c[`${kind}_entity`] || c.hub);
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
    } else {
      await this._hass.callService("homeassistant", on ? "turn_on" : "turn_off", { entity_id: entityId });
    }
  }

  async _command(kind) {
    const c = this._config.control;
    try {
      if (kind === "run") {
        if (c.run_entity) await this._pressEntity(c.run_entity, true);
        else await this._writeRegister(8192, 0x0002);
      } else if (kind === "stop") {
        if (c.stop_entity) await this._pressEntity(c.stop_entity, false);
        else await this._writeRegister(8192, 0x0001);
      } else if (kind === "reset") {
        if (c.reset_entity) await this._pressEntity(c.reset_entity, true);
        else await this._writeRegister(8194, 0x0002);
      } else if (kind === "fwd") {
        await this._writeRegister(8192, 0x0010);
      } else if (kind === "rev") {
        await this._writeRegister(8192, 0x0020);
      }
      this._toast(`${this._config.name}: ${kind.toUpperCase()} sent`);
    } catch (e) {
      this._toast(`${this._config.name}: ${kind.toUpperCase()} failed — ${e.message || e}`);
    }
  }

  async _sendSetpoint() {
    if (this._sp === null) return;
    const c = this._config.control;
    const hz = this._sp;
    try {
      if (c.setpoint_entity) {
        const domain = c.setpoint_entity.split(".")[0];
        await this._hass.callService(domain, "set_value", { entity_id: c.setpoint_entity, value: hz });
      } else {
        await this._writeRegister(8193, Math.round(hz * 100));
      }
      this._toast(`${this._config.name}: speed set to ${hz.toFixed(2)} Hz`);
      this._spSentAt = Date.now();
    } catch (e) {
      this._toast(`${this._config.name}: setpoint failed — ${e.message || e}`);
    }
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

  _currentSetpoint() {
    if (this._sp !== null) return this._sp;
    const c = this._config.control;
    if (c.setpoint_entity && this._hass.states[c.setpoint_entity]) {
      const v = parseFloat(this._hass.states[c.setpoint_entity].state);
      if (Number.isFinite(v)) return v;
    }
    const f = this._num("frequency_command");
    return f === null ? this._config.min_frequency : f;
  }

  _nudge(dir) {
    const { min_frequency: lo, max_frequency: hi, step } = this._config;
    const base = this._currentSetpoint();
    const v = Math.min(hi, Math.max(lo, Math.round((base + dir * step) / step) * step));
    this._sp = Math.round(v * 100) / 100;
    this._spSentAt = null;
    this._update();
  }

  /* ---------------- render ---------------- */

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const cfg = this._config;
    const brand = cfg.logo
      ? `<img class="logo" src="${cfg.logo}" alt="">`
      : `<div class="brand"><span class="mark">H</span><span class="word">${this._esc(cfg.brand || "")}</span></div>`;

    const tile = (key, label) =>
      cfg.entities[key]
        ? `<div class="tile" data-key="${key}"><div class="tl">${label}</div><div class="tv"><span id="v_${key}">—</span><span class="tu" id="u_${key}"></span></div></div>`
        : "";

    const ctl = cfg.show_controls
      ? `
      <div class="controls">
        <div class="btns">
          ${this._canControl("run") ? `<button id="b_run" class="run"><span class="ic">▶</span>RUN</button>` : ""}
          ${this._canControl("stop") ? `<button id="b_stop" class="stop"><span class="ic">■</span>STOP</button>` : ""}
          ${this._canControl("reset") ? `<button id="b_reset" class="reset"><span class="ic">↺</span>RESET</button>` : ""}
          ${cfg.allow_reverse && cfg.control.hub ? `<button id="b_dir" class="dir"><span class="ic">⇄</span><span id="dirlbl">REV</span></button>` : ""}
        </div>
        ${this._canControl("setpoint") ? `
        <div class="sp">
          <span class="spl">SPEED</span>
          <button id="b_minus" class="nudge">−</button>
          <div class="spv"><span id="spval">—</span><span class="spu">Hz</span></div>
          <button id="b_plus" class="nudge">+</button>
          <button id="b_set" class="set" disabled>SET</button>
        </div>` : ""}
      </div>` : "";

    this.shadowRoot.innerHTML = `
      <style>${this._css()}</style>
      <ha-card>
        <div class="head">
          ${brand}
          <div class="title">
            <div class="name">${this._esc(cfg.name)}</div>
            <div class="model">DELTA CP2000 · VFD</div>
          </div>
          <div class="pill" id="pill"><span class="dot"></span><span id="pilltxt">—</span></div>
        </div>

        <div class="lcd" id="lcd">
          <div class="lcd-top">
            <span class="flag" id="f_src">—</span>
            <span class="flag" id="f_dir">FWD</span>
            <span class="flag" id="f_run">STOP</span>
            <span class="spacer"></span>
            <span class="fcmd" data-key="frequency_command">F <span id="v_fcmd">—</span></span>
          </div>
          <div class="lcd-main" data-key="output_frequency">
            <span class="hval" id="v_hz">—</span><span class="hunit">Hz</span>
          </div>
          <div class="bar"><div class="fill" id="bar"></div><div class="mark" id="barmark"></div></div>
          <div class="scale"><span>${cfg.min_frequency}</span><span>${(cfg.min_frequency + cfg.max_frequency) / 2}</span><span>${cfg.max_frequency} Hz</span></div>
          <div class="lcd-row">
            ${cfg.entities.output_current ? `<span data-key="output_current"><b id="r_a">—</b> A</span>` : ""}
            ${cfg.entities.output_voltage ? `<span data-key="output_voltage"><b id="r_v">—</b> V</span>` : ""}
            ${cfg.entities.output_power ? `<span data-key="output_power"><b id="r_kw">—</b> kW</span>` : ""}
            ${cfg.entities.motor_speed ? `<span data-key="motor_speed"><b id="r_rpm">—</b> rpm</span>` : ""}
          </div>
          <div class="commlost" id="commlost">NO COMMS — CHECK RS-485</div>
        </div>

        <div class="fault" id="fault">
          <div class="fic">⚠</div>
          <div class="ftx"><div class="fcode" id="fcode"></div><div class="fdesc" id="fdesc"></div></div>
        </div>

        <div class="tiles">
          ${tile("dc_bus_voltage", "DC BUS")}
          ${tile("igbt_temperature", "IGBT TEMP")}
          ${tile("pid_feedback", "FEEDBACK")}
          ${tile("energy", "ENERGY")}
          ${tile("run_hours", "RUN HOURS")}
        </div>
        ${ctl}
      </ha-card>`;

    const root = this.shadowRoot;
    root.querySelectorAll("[data-key]").forEach((el) =>
      el.addEventListener("click", () => this._moreInfo(el.dataset.key))
    );
    const on = (id, fn) => {
      const el = root.getElementById(id);
      if (el) el.addEventListener("click", (ev) => fn(el, ev));
    };
    on("b_run", (b) => this._confirmThen(b, () => this._command("run")));
    on("b_stop", () => this._command("stop")); // stop never needs confirmation
    on("b_reset", (b) => this._confirmThen(b, () => this._command("reset")));
    on("b_dir", (b) => this._confirmThen(b, () => this._command(this._dirNext || "rev")));
    on("b_minus", () => this._nudge(-1));
    on("b_plus", () => this._nudge(1));
    on("b_set", () => this._sendSetpoint());
    this._built = true;
  }

  _update() {
    if (!this._built || !this._hass) return;
    const r = this.shadowRoot;
    const cfg = this._config;
    const $ = (id) => r.getElementById(id);
    const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };

    // --- comms / availability
    const keyEnt = this._st("status") || this._st("output_frequency");
    const commsLost = !keyEnt || ["unavailable", "unknown"].includes(keyEnt.state);
    $("commlost").classList.toggle("show", commsLost);
    $("lcd").classList.toggle("dim", commsLost);

    // --- status word 2101H
    const sw = this._num("status");
    let run = 0, dir = 0, src = "—";
    if (sw !== null) {
      const s = sw | 0;
      run = s & 0x03;
      dir = (s >> 3) & 0x03;
      const commOp = (s >> 10) & 1;
      const commF = (s >> 8) & 1;
      const anaF = (s >> 9) & 1;
      src = commOp ? "COMM" : "LOCAL";
      src += commF ? " · F:COMM" : anaF ? " · F:AI" : "";
      if ((s >> 2) & 1) src += " · JOG";
    }

    // --- fault 2100H
    const fw = this._num("fault");
    const fcode = fw === null ? 0 : (fw | 0) & 0xff;
    const wcode = fw === null ? 0 : ((fw | 0) >> 8) & 0xff;
    const faulted = fcode > 0;

    const hz = this._num("output_frequency");
    const running = sw !== null ? run === 3 || run === 1 : hz !== null && hz > 0.05;

    let state = "STOPPED", cls = "stopped";
    if (commsLost) { state = "OFFLINE"; cls = "offline"; }
    else if (faulted) { state = "FAULT"; cls = "fault"; }
    else if (sw !== null && run === 1) { state = "STOPPING"; cls = "running"; }
    else if (running) { state = "RUNNING"; cls = "running"; }
    else if (sw !== null && run === 2) { state = "STANDBY"; cls = "standby"; }
    const pill = $("pill");
    pill.className = `pill ${cls}`;
    set("pilltxt", state);

    set("f_src", src);
    set("f_dir", DIRS[dir]);
    set("f_run", sw !== null ? RUN_STATES[run] : running ? "RUN" : "STOP");
    $("f_run").classList.toggle("on", running);
    this._dirNext = dir === 3 ? "fwd" : "rev";
    if ($("dirlbl")) set("dirlbl", this._dirNext === "fwd" ? "FWD" : "REV");

    // --- main readout
    set("v_hz", this._fmt(hz, 2));
    const fcmd = this._num("frequency_command");
    set("v_fcmd", this._fmt(fcmd, 2));
    const span = Math.max(0.01, cfg.max_frequency - cfg.min_frequency);
    const pct = (v) => Math.max(0, Math.min(100, ((v - cfg.min_frequency) / span) * 100));
    $("bar").style.width = `${hz === null ? 0 : pct(hz)}%`;
    const mk = $("barmark");
    if (fcmd !== null) { mk.style.display = "block"; mk.style.left = `${pct(fcmd)}%`; }
    else mk.style.display = "none";

    set("r_a", this._fmt(this._num("output_current"), 1));
    set("r_v", this._fmt(this._num("output_voltage"), 0));
    set("r_kw", this._fmt(this._num("output_power"), 2));
    set("r_rpm", this._fmt(this._num("motor_speed"), 0));

    // --- tiles
    const tiles = { dc_bus_voltage: [0, "V"], igbt_temperature: [1, "°C"], pid_feedback: [1, "%"], energy: [1, "kWh"], run_hours: [0, "h"] };
    for (const [k, [dp, u]] of Object.entries(tiles)) {
      if (!cfg.entities[k]) continue;
      set(`v_${k}`, this._fmt(this._num(k), dp));
      set(`u_${k}`, " " + this._unit(k, u));
    }
    const t = this._num("igbt_temperature");
    const tt = r.querySelector('.tile[data-key="igbt_temperature"]');
    if (tt) tt.classList.toggle("hot", t !== null && t >= 80);

    // --- fault banner
    const fb = $("fault");
    if (faulted && !commsLost) {
      const f = FAULTS[fcode];
      fb.className = "fault show";
      set("fcode", f ? `${f[0]}  (code ${fcode})` : `Fault code ${fcode}`);
      set("fdesc", f ? f[1] : "See CP2000 manual, chapter 14 (fault codes)");
    } else if (wcode > 0 && !commsLost) {
      fb.className = "fault show warn";
      set("fcode", `Warning ${wcode}`);
      set("fdesc", "Drive warning active — check keypad");
    } else {
      fb.className = "fault";
    }

    // --- setpoint
    if (this._sp !== null && this._spSentAt && fcmd !== null && Math.abs(fcmd - this._sp) < 0.011) {
      this._sp = null; // drive confirmed new setpoint
    }
    if (this._sp !== null && this._spSentAt && Date.now() - this._spSentAt > 15000) this._sp = null;
    if ($("spval")) {
      set("spval", this._currentSetpoint().toFixed(2));
      const pending = this._sp !== null && !this._spSentAt;
      $("spval").parentElement.classList.toggle("pending", pending);
      $("b_set").disabled = !pending;
    }
    if ($("b_run")) $("b_run").classList.toggle("active", running && !faulted);
    if ($("b_stop")) $("b_stop").classList.toggle("active", !running && !commsLost);
    if ($("b_reset")) $("b_reset").classList.toggle("attn", faulted);
  }

  _esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  _css() {
    return `
      :host {
        --vfd-accent: var(--hamlet-accent, #1e7fd8);
        --vfd-body: #1c2128;
        --vfd-body2: #262c35;
        --vfd-lcd: #0b2a4a;
        --vfd-lcd2: #0f3a66;
        --vfd-seg: #d9f0ff;
        --vfd-green: #2ecc71;
        --vfd-red: #ff4d4f;
        --vfd-amber: #ffb020;
      }
      ha-card {
        background: linear-gradient(180deg, var(--vfd-body2), var(--vfd-body));
        color: #e8edf3;
        border-radius: var(--ha-card-border-radius, 14px);
        padding: 14px;
        overflow: hidden;
        font-family: var(--paper-font-body1_-_font-family, "Roboto", system-ui, sans-serif);
        border-top: 4px solid var(--vfd-accent);
      }
      .head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
      .logo { height: 32px; max-width: 110px; object-fit: contain; }
      .brand { display: flex; align-items: center; gap: 6px; }
      .brand .mark {
        width: 30px; height: 30px; border-radius: 6px; background: #fff; color: #111;
        display: grid; place-items: center; font-weight: 900; font-size: 20px;
      }
      .brand .word { font-size: 10px; letter-spacing: 1.5px; line-height: 1.1; max-width: 70px; opacity: .85; font-weight: 700; }
      .title { flex: 1; min-width: 0; }
      .name { font-size: 17px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .model { font-size: 10px; letter-spacing: 2px; opacity: .55; }
      .pill {
        display: flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px;
        font-size: 12px; font-weight: 700; letter-spacing: 1px; background: rgba(255,255,255,.08);
      }
      .pill .dot { width: 9px; height: 9px; border-radius: 50%; background: #8a94a3; }
      .pill.running .dot { background: var(--vfd-green); box-shadow: 0 0 8px var(--vfd-green); animation: pulse 1.4s infinite; }
      .pill.running { color: var(--vfd-green); }
      .pill.fault { color: var(--vfd-red); background: rgba(255,77,79,.15); }
      .pill.fault .dot { background: var(--vfd-red); animation: pulse .7s infinite; }
      .pill.standby .dot { background: var(--vfd-amber); }
      .pill.offline { color: #8a94a3; }
      @keyframes pulse { 50% { opacity: .35; } }

      .lcd {
        position: relative; border-radius: 10px; padding: 10px 12px 10px;
        background: radial-gradient(120% 140% at 30% 0%, var(--vfd-lcd2), var(--vfd-lcd));
        box-shadow: inset 0 0 0 2px #05182b, inset 0 6px 18px rgba(0,0,0,.45);
        color: var(--vfd-seg); font-family: "DejaVu Sans Mono", "Consolas", "Menlo", monospace;
        text-shadow: 0 0 6px rgba(150,210,255,.45); transition: opacity .3s;
      }
      .lcd.dim > :not(.commlost) { opacity: .25; }
      .lcd-top { display: flex; align-items: center; gap: 6px; font-size: 11px; }
      .flag { border: 1px solid rgba(217,240,255,.45); border-radius: 3px; padding: 1px 5px; opacity: .85; }
      .flag.on { background: var(--vfd-seg); color: var(--vfd-lcd); text-shadow: none; }
      .spacer { flex: 1; }
      .fcmd { font-size: 12px; cursor: pointer; opacity: .9; }
      .lcd-main { display: flex; align-items: baseline; justify-content: flex-end; gap: 6px; margin: 4px 0 2px; cursor: pointer; }
      .hval { font-size: 52px; font-weight: 700; letter-spacing: 2px; line-height: 1; }
      .hunit { font-size: 18px; opacity: .8; }
      .bar { position: relative; height: 8px; border-radius: 4px; background: rgba(217,240,255,.15); margin-top: 6px; }
      .bar .fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #4fb3ff, var(--vfd-seg)); width: 0; transition: width .6s ease; box-shadow: 0 0 8px rgba(150,210,255,.6); }
      .bar .mark { position: absolute; top: -4px; width: 2px; height: 16px; background: var(--vfd-amber); transform: translateX(-1px); transition: left .6s; }
      .scale { display: flex; justify-content: space-between; font-size: 9px; opacity: .55; margin-top: 2px; }
      .lcd-row { display: flex; justify-content: space-between; gap: 6px; margin-top: 8px; font-size: 12px; flex-wrap: wrap; }
      .lcd-row span { cursor: pointer; }
      .lcd-row b { font-size: 16px; }
      .commlost {
        display: none; position: absolute; inset: 0; place-items: center; text-align: center;
        font-weight: 700; letter-spacing: 1px; color: var(--vfd-amber); font-size: 14px;
      }
      .commlost.show { display: grid; }

      .fault {
        display: none; align-items: center; gap: 10px; margin-top: 10px; padding: 8px 10px; border-radius: 8px;
        background: rgba(255,77,79,.14); border: 1px solid rgba(255,77,79,.5);
      }
      .fault.show { display: flex; }
      .fault.warn { background: rgba(255,176,32,.12); border-color: rgba(255,176,32,.5); }
      .fault .fic { font-size: 22px; color: var(--vfd-red); }
      .fault.warn .fic { color: var(--vfd-amber); }
      .fcode { font-weight: 700; font-family: monospace; font-size: 14px; }
      .fdesc { font-size: 12px; opacity: .85; }

      .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(84px, 1fr)); gap: 8px; margin-top: 10px; }
      .tiles:empty { display: none; }
      .tile { background: rgba(255,255,255,.05); border-radius: 8px; padding: 7px 9px; cursor: pointer; border-left: 3px solid var(--vfd-accent); }
      .tile.hot { border-left-color: var(--vfd-red); }
      .tl { font-size: 9px; letter-spacing: 1.5px; opacity: .6; }
      .tv { font-size: 16px; font-weight: 600; margin-top: 2px; white-space: nowrap; }
      .tu { font-size: 11px; opacity: .65; font-weight: 400; }

      .controls { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
      .btns { display: grid; grid-template-columns: repeat(auto-fit, minmax(70px, 1fr)); gap: 8px; }
      button {
        font: inherit; cursor: pointer; border: none; border-radius: 9px; color: #fff;
        padding: 11px 6px; font-weight: 700; letter-spacing: 1px; font-size: 13px;
        background: #39424f; box-shadow: 0 2px 0 rgba(0,0,0,.4); transition: transform .05s, filter .2s, background .2s;
        display: flex; align-items: center; justify-content: center; gap: 6px; -webkit-tap-highlight-color: transparent;
      }
      button:active { transform: translateY(1px); box-shadow: none; }
      button:disabled { opacity: .35; cursor: default; }
      .ic { font-size: 12px; }
      .run.active { background: #1f8f4e; }
      .stop { background: #a8282a; }
      .stop.active { background: #6b2b2c; }
      .reset.attn { background: #b67a0c; animation: pulse 1.2s infinite; }
      button.armed { background: var(--vfd-amber) !important; color: #111; animation: none; }
      button.armed::after { content: " ?"; }
      .sp { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,.05); border-radius: 10px; padding: 6px 8px; }
      .spl { font-size: 10px; letter-spacing: 1.5px; opacity: .6; }
      .nudge { width: 40px; padding: 8px 0; font-size: 18px; }
      .spv { flex: 1; text-align: center; font-family: monospace; font-size: 20px; font-weight: 700; }
      .spv.pending { color: var(--vfd-amber); }
      .spu { font-size: 11px; opacity: .6; margin-left: 4px; }
      .set { background: var(--vfd-accent); padding: 8px 14px; }
    `;
  }
}

customElements.define("delta-cp2000-card", DeltaCP2000Card);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "delta-cp2000-card",
  name: "Delta CP2000 VFD Card",
  description: "Live status and control for a Delta CP2000 drive over Modbus (Hamlet Elektries)",
  preview: true,
  documentationURL: "https://github.com/wesselswynand2-prog/delta-cp2000-card",
});

console.info(
  `%c DELTA-CP2000-CARD %c v${CARD_VERSION} `,
  "background:#1e7fd8;color:#fff;font-weight:700;border-radius:3px 0 0 3px",
  "background:#262c35;color:#fff;border-radius:0 3px 3px 0"
);
