## 📸 Preview

![Battery Donut Card Preview](https://raw.githubusercontent.com/LodeBo/battery-donut-card/main/marstek.png)

> *Example: dual-tone gradient ring from red → orange → yellow → green → cyan with auto-scaling text.*


## 🛠️ Installation

### Manual

1. Download the latest **`battery-donut-card.js`** from the  
   👉 [GitHub Releases](https://github.com/lodebo/battery-donut-card/releases)
2. Copy it to your Home Assistant `/www/` folder.  
3. In Home Assistant, go to **Settings → Dashboards → Resources** and add:  /local/battery-donut-card.js
with type **JavaScript Module**.
4. Restart your dashboard (or clear browser cache).

---

### HACS (Custom Repository)

1. In **HACS → Integrations → Custom Repositories**, add:  https://github.com/lodebo/battery-donut-card
Type: **Dashboard**
2. Search for **“Battery Donut Card”** in HACS and install.  
3. Restart Home Assistant and refresh your browser.

> 💡 **Tip:** When installed through HACS, you don’t need to copy any files manually — HACS handles this automatically.

---

### Example configuration

```yaml
type: custom:battery-donut-card
entity: sensor.my_batteries_total_soc
cap_kwh: 10.24
segments: 140

# 🎨 Colors & Gradient
background: var(--card-background-color)
border_radius: 12px
border: 1px solid rgba(255,255,255,0.2)
track_color: "#000000"
color_red: "#ff0000"
color_orange: "#fb923c"
color_yellow: "#facc15"
color_green: "#34d399"
color_cyan: "#00bcd4"
stop_red_hold: 0.11
stop_orange: 0.25
stop_yellow: 0.45
stop_green: 0.7

# 🏷️ Labels & Text
top_label_text: Batterijen
top_label_weight: 400
top_label_color: "#ffffff"
text_color_inside: "#ffffff"
font_scale_kwh: 0.3
font_scale_soc: 0.3

# 🟢 Ring Layout
ring_radius: 65
ring_width: 8
ring_offset_y: 0
label_ring_gap: 17

# 📶 Wi-Fi Indicator
wifi_enabled: true
wifi_always_show: true
wifi_entity: 
wifi_size_pct: 10
wifi_offset_x: 150
wifi_offset_y: 120

# ⚡ Power Arrow
power_enabled: true
power_always_show: false
power_entity: 
power_size_pct: 14
power_offset_x: -150
power_offset_y: 120

# 🧩 Grid (optional)
grid_options:
  columns: 6
  rows: 3

```
## ⚙️ Options

| Option | Type | Default | Description |
|:--|:--|:--|:--|
| `entity` | string | **required** | Battery SoC sensor (0–100 %) |
| `cap_kwh` | number | 5.12 | Total battery capacity (kWh) — used to calculate stored energy |
| `segments` | number | 140 | Number of small arcs; higher = smoother ring |
| `track_color` | string | `#000000` | Color of the inactive track (background) |

---

## 🎨 Colors

| Option | Type | Default | Description |
|:--|:--|:--|:--|
| `color_red` | string | `#ff0000` | Gradient start color (0 %) |
| `color_orange` | string | `#fb923c` | Red → yellow transition |
| `color_yellow` | string | `#facc15` | Midpoint color |
| `color_green` | string | `#34d399` | Yellow → cyan transition |
| `color_cyan` | string | `#00bcd4` | Gradient end color (100 %) |
| `text_color_inside` | string | `#ffffff` | Text color inside the donut |

---

## 🌈 Gradient Stops

| Option | Type | Default | Description |
|:--|:--|:--|:--|
| `stop_red_hold` | number | 0.11 | % where red stays solid before transition |
| `stop_orange` | number | 0.25 | Transition point orange |
| `stop_yellow` | number | 0.45 | Transition point yellow |
| `stop_green` | number | 0.70 | Transition point green |

---

## 🏷️ Top Label

| Option | Type | Default | Description |
|:--|:--|:--|:--|
| `top_label_text` | string | `"Battery"` | Text above the ring (leave empty to hide) |
| `top_label_weight` | number | 300 | Font weight for top label |
| `top_label_color` | string | `#ffffff` | Label text color |
| `label_ring_gap` | number | 20 | Gap between label and ring (px) |

---

## 🔢 Inner Text

| Option | Type | Default | Description |
|:--|:--|:--|:--|
| `font_scale_kwh` | number | 0.30 | Font scale for energy (kWh) text |
| `font_scale_soc` | number | 0.30 | Font scale for % SoC text |
| `ring_radius` | number | 80 | Radius of the donut ring |
| `ring_width` | number | 8 | Width of the donut ring |
| `ring_offset_y` | number | 0 | Vertical offset of the ring center |

---

## 📶 Wi-Fi Indicator

| Option | Type | Default | Description |
|:--|:--|:--|:--|
| `wifi_enabled` | bool | true | Enable Wi-Fi indicator |
| `wifi_always_show` | bool | false | Always display, even if unavailable |
| `wifi_entity` | string | `"sensor.lilygo_rs485_wifi_signal_strength"` | Wi-Fi dBm sensor |
| `wifi_size_pct` | number | 9 | Size relative to donut diameter (%) |
| `wifi_offset_x` | number | 0 | Horizontal offset (% of radius) |
| `wifi_offset_y` | number | 0 | Vertical offset (% of radius) |

---

## ⚡ Power Arrow

| Option | Type | Default | Description |
|:--|:--|:--|:--|
| `power_enabled` | bool | true | Show power direction indicator |
| `power_always_show` | bool | false | Always display, even if sensor unknown |
| `power_entity` | string | `"sensor.inverter_active_power"` | Power sensor (W) |
| `power_size_pct` | number | 16 | Size relative to donut diameter (%) |
| `power_offset_x` | number | 0 | Horizontal offset (% of radius) |
| `power_offset_y` | number | 0 | Vertical offset (% of radius) |

---

## 🧱 Card Style

| Option | Type | Default | Description |
|:--|:--|:--|:--|
| `background` | string | `var(--card-background-color)` | Background color (theme-based) |
| `border_radius` | string | `"12px"` | Card corner radius |
| `border` | string | `"1px solid rgba(255,255,255,0.2)"` | Border styling |
| `box_shadow` | string | `"none"` | Drop shadow styling |
| `padding` | string | `"0px"` | Inner padding |

---











