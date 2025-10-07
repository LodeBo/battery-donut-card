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
Type: **Lovelace**
2. Search for **“Battery Donut Card”** in HACS and install.  
3. Restart Home Assistant and refresh your browser.

> 💡 **Tip:** When installed through HACS, you don’t need to copy any files manually — HACS handles this automatically.

---

### Example configuration

```yaml
type: custom:battery-donut-card
entity: sensor.battery_soc
name: Battery 1
cap_kwh: 10.24
ring_radius: 80
ring_width: 8
track_color: '#000000'
segments: 120
label_gap: 16
text_color: '#ffffff'
glow_enabled: true
layout_options:
  grid_columns: 1
  grid_rows: 2
```
## ⚙️ Options

| Option | Type | Default | Description |
|--------|------|----------|-------------|
| `entity` | string | **required** | Battery SoC sensor (0–100 %) |
| `cap_kwh` | number | 5.12 | Total battery capacity (kWh) — used to calculate displayed kWh |
| `segments` | number | 140 | Number of small arcs; higher = smoother gradient |
| `track_color` | string | `#000000` | Color of the inactive track (background ring) |

### 🎨 Colors
| Option | Type | Default | Description |
|--------|------|----------|-------------|
| `color_red` | string | `#ff0000` | Gradient start color (0 %) |
| `color_orange` | string | `#fb923c` | Red → yellow transition |
| `color_yellow` | string | `#facc15` | Midpoint color |
| `color_green` | string | `#34d399` | Yellow → cyan transition |
| `color_cyan` | string | `#00bcd4` | Gradient end color (100 %) |
| `text_color_inside` | string | `#ffffff` | Text color inside the donut |

### 🌈 Gradient Stops
| Option | Type | Default | Description |
|--------|------|----------|-------------|
| `stop_red_hold` | number | 0.11 | Position (0–1) to keep pure red before orange starts |
| `stop_orange` | number | 0.25 | Position where orange segment ends |
| `stop_yellow` | number | 0.45 | Position where yellow segment ends |
| `stop_green` | number | 0.70 | Position where green segment ends and cyan begins |

### 🧭 Layout & Position
| Option | Type | Default | Description |
|--------|------|----------|-------------|
| `ring_radius` | number | 80 | Radius (size) of the donut |
| `ring_width` | number | 8 | Thickness of the donut ring |
| `ring_offset_y` | number | 10 | Moves the whole ring up/down |
| `label_ring_gap` | number | 20 | Vertical distance between label and ring (only used when label is visible) |

### 🏷️ Top Label
| Option | Type | Default | Description |
|--------|------|----------|-------------|
| `top_label_text` | string | `"Battery"` | Text above the ring — leave empty (`''`) to hide it and auto-center the ring |
| `top_label_weight` | number | 300 | Font weight of the label |
| `top_label_color` | string | `#ffffff` | Label text color |

### 🔢 Inner Text
| Option | Type | Default | Description |
|--------|------|----------|-------------|
| `soc_decimals` | number | 0 | Number of decimals for % display |
| `font_scale_kwh` | number | 0.30 | Font size of kWh text (relative to ring radius) |
| `font_scale_soc` | number | 0.38 | Font size of % text (relative to ring radius) |

### 🧱 Card Style
| Option | Type | Default | Description |
|--------|------|----------|-------------|
| `background` | string | `'transparent'` | Card background color |
| `border_radius` | string | `'0px'` | Corner radius of the card |
| `box_shadow` | string | `'none'` | Box-shadow styling |
| `border` | string | `'none'` | Border styling |
| `padding` | string | `'0px'` | Inner padding of the card |


