# Delta CP2000 VFD Card

A Home Assistant dashboard card for **Delta CP2000** variable frequency drives — by **Hamlet Elektries**.

![preview](preview.png)

**What it looks like**

The card copies the drive's keypad: a backlit LCD with the **F / H / A** lines, F1–F4 soft keys, ERR / COM / RUN lights, and the same key layout:

| | | |
|---|---|---|
| ESC | ▲ | MENU |
| ◀ | ENTER | ▶ |
| HAND | ▼ | AUTO |
| RUN | FWD/REV | STOP/RESET |

**What the keys do**

| Key | Function |
|---|---|
| ▲ / ▼ | Change the speed — **F** blinks on the LCD |
| ENTER | Send the new speed to the drive |
| ESC | Cancel the speed change and go back to the start page |
| ◀ / ▶ | Previous / next LCD page (Main, Power, Motor, Info, All values) |
| RUN | Start (tap twice to confirm) |
| STOP/RESET | Stop when running, reset a trip when faulted (stop never asks) |
| FWD/REV | Change direction (only if `allow_reverse: true`) |
| **F1–F4, MENU, HAND, AUTO** | **Your choice** — see *Assignable keys* below |

The drive's faults show on the LCD in plain words (e.g. `uC — Under-current (possible dry run)`), and "NO COMMS" shows when the RS-485 link drops. Tap a value on the LCD to open its history.

---

## 1. Install the card (HACS)

1. HACS → ⋮ → **Custom repositories**
2. Repository: `https://github.com/wesselswynand2-prog/delta-cp2000-card` — Type: **Dashboard**
3. Find **Delta CP2000 VFD Card** → **Download** → reload the browser

Updates you push to GitHub (as a new release) show up in every client's HACS.

## 2. Connect the drive (Modbus)

Copy [`examples/cp2000_modbus_package.yaml`](examples/cp2000_modbus_package.yaml) to `/config/packages/cp2000_vfd.yaml`, change the port (or gateway IP) and restart Home Assistant.

### Drive parameters

| Parameter | Set to | Why |
|---|---|---|
| 09-00 | 1 | Modbus address (= `slave`) |
| 09-01 | 9.6 | Baud rate (= `baudrate: 9600`) |
| 09-04 | 12 | 8,N,1 RTU |
| 09-03 | 0.0 (or 5.0) | Comm time-out; set >0 if the drive must trip on lost comms |
| 00-20 | 1 = RS-485 | Only if HA sets the speed |
| 00-21 | 2 = RS-485 | Only if HA starts/stops the drive |

**Monitor only?** Leave 00-20 / 00-21 on terminals/keypad and set `show_controls: false`.

### Wiring

RS-485 on the CP2000 control terminals **SG+ / SG-** → USB-RS485 adapter on the HA box (or an RS-485/Ethernet gateway). Twisted pair, 120 Ω termination at both ends of the bus.

## 3. Add the card

Add card → search **Delta CP2000** (visual editor works), or YAML:

```yaml
type: custom:delta-cp2000-card
name: Borehole Pump
max_frequency: 50
entities:
  status: sensor.vfd_status_word
  fault: sensor.vfd_fault_code
  frequency_command: sensor.vfd_frequency_command
  output_frequency: sensor.vfd_output_frequency
  output_current: sensor.vfd_output_current
  output_voltage: sensor.vfd_output_voltage
  dc_bus_voltage: sensor.vfd_dc_bus_voltage
  output_power: sensor.vfd_output_power
  motor_speed: sensor.vfd_motor_speed
  igbt_temperature: sensor.vfd_igbt_temperature
control:
  hub: vfd
  slave: 1
```

### Options

| Option | Default | Description |
|---|---|---|
| `name` | `VFD` | Card title |
| `logo` | Hamlet Elektries logo (built in) | Another image URL, e.g. `/local/client-logo.png`, or `none` to hide |
| `brand` | – | Text shown instead when `logo: none` |
| `min_frequency` / `max_frequency` | 0 / 50 | Speed bar range and setpoint limits (Hz) |
| `step` | 0.5 | Hz per − / + tap |
| `entities.*` | – | Sensors (only `output_frequency` is required; `status` strongly recommended) |
| `control.hub` / `control.slave` | – / 1 | Modbus hub name and drive address — enables control buttons |
| `control.run_entity` / `stop_entity` / `reset_entity` | – | Use your own button/script instead of writing Modbus directly |
| `control.setpoint_entity` | – | Use a `number` / `input_number` for the setpoint instead |
| `show_controls` | `true` | Show buttons |
| `allow_reverse` | `false` | Show FWD/REV button |
| `confirm_actions` | `true` | Tap twice for RUN / RESET / direction |
| `default_page` | `main` | LCD page shown first: main, power, motor, info, all |
| `keys` | see below | What F1–F4, MENU, HAND and AUTO do |

Accent colour follows the theme variable `--hamlet-accent` (default blue).

## Assignable keys (F1–F4, MENU, HAND, AUTO)

Set them in the card editor under **Keys**, or in YAML. The label is what shows on the LCD above the key (keep it to 5 letters).

| `function` | What it does | Needs |
|---|---|---|
| `page_main` / `page_power` / `page_motor` / `page_info` / `page_all` | Show that LCD page | – |
| `preset` | Send a fixed speed | `value` (Hz) |
| `run` / `stop` / `reset` / `fwd` / `rev` | Drive command | Modbus hub |
| `toggle` / `turn_on` / `turn_off` | Switch an entity (pump mode, valve, light…) | `entity` |
| `press` | Press a button or run a script (tap twice) | `entity` |
| `more_info` | Open the entity's details | `entity` |
| `action` | Any Home Assistant action | `tap_action` |
| `none` | Nothing | – |

The label goes dark (selected) when that page is showing, when the preset speed is active, or when the entity is on.

```yaml
keys:
  f1: { label: MAIN, function: page_main }
  f2: { label: 35Hz, function: preset, value: 35 }
  f3: { label: 48Hz, function: preset, value: 48 }
  f4: { label: PRES, function: toggle, entity: input_boolean.pressure_mode }
  menu: { function: page_all }
  hand:
    function: action
    tap_action:
      action: perform-action
      perform_action: script.turn_on
      target: { entity_id: script.pump_hand_mode }
  auto: { function: press, entity: script.pump_auto_mode }
```

Defaults: F1 Main, F2 Power, F3 Motor, F4 Info, MENU = all values, HAND / AUTO = nothing.

## Registers used

| Address | Dec | R/W | Meaning |
|---|---|---|---|
| 2000H | 8192 | W | Command: 1 = STOP, 2 = RUN, 0x10 = FWD, 0x20 = REV |
| 2001H | 8193 | W | Frequency command (Hz × 100) |
| 2002H | 8194 | W | 2 = fault reset |
| 2100H | 8448 | R | Fault code (low byte), warning (high byte) |
| 2101H | 8449 | R | Status word (bits 0-1 run state, 3-4 direction, 8-10 command source) |
| 2102H–2106H | 8450–8454 | R | F cmd, output Hz, current, DC bus, output V |
| 2206H–220EH | 8710–8718 | R | kW, rpm, PID feedback, IGBT temp |

> Check the output current and power scaling against the keypad on first install — on larger frames Delta changes the decimal places.

## Safety

Starting a pump/motor remotely can be dangerous. Make sure site isolation, dry-run protection and local stop are in place before enabling remote control.

MIT licence © Hamlet Elektries
