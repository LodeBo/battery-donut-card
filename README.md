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
| Option            | Type    | Default                  | Description                              |
| ----------------- | ------- | ------------------------ | ---------------------------------------- |
| `entity`          | string  | **required**             | Battery SoC sensor (0–100 %)             |
| `cap_kwh`         | number  | 5.12                     | Total battery capacity in kWh            |
| `ring_radius`     | number  | 80                       | Ring radius (size)                       |
| `ring_width`      | number  | 8                        | Ring thickness                           |
| `track_color`     | string  | `#000000`                | Color of the background track            |
| `segments`        | number  | 140                      | Number of small arcs for smoothness      |
| `label_text`      | string  | `"Battery"`              | Text displayed above the ring            |
| `label_gap`       | number  | 20                       | Vertical distance between label and ring |
| `text_scale`      | number  | 1.0                      | Scales all text sizes together           |
| `glow_enabled`    | boolean | true                     | Enables soft ring glow                   |
| `glow_blur`       | number  | 3.5                      | Blur strength of glow                    |
| `glow_opacity`    | number  | 0.35                     | Glow transparency                        |
| `glow_scale`      | number  | 1.6                      | Glow size multiplier                     |
| `outline_enabled` | boolean | true                     | Draws faint outline circle               |
| `outline_color`   | string  | `rgba(255,255,255,0.06)` | Outline color                            |
| `outline_width`   | number  | 1                        | Outline thickness                        |

💡 Tip

If you’re using the new Sections Dashboard layout in Home Assistant,
you can make the donut perfectly centered by tweaking the layout_options
and ring_radius values to fit your section size.
This gives a clean, balanced look in both desktop and mobile views.
