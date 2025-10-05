# 🌀 Battery Donut Card

A minimalist Home Assistant custom card that renders a smooth, multi-color donut ring showing battery SoC and kWh.  
Fully SVG-based, scales perfectly with any layout, and supports dynamic color gradients (red → orange → yellow → green → cyan).

---

## ✨ Features

- Smooth gradient from red → cyan with natural transitions  
- Adjustable ring radius and thickness  
- Optional glowing effect  
- Optional top label with adjustable gap  
- Auto-scaling text inside the ring  
- Compact design, fully responsive
- By adjusting the layoutoptions and the ring radius you can make it fit perfect in the

## 💡 **Tip:**  
If you’re using the new *Sections Dashboard* layout in Home Assistant,  
you can make the donut perfectly centered by tweaking the `layout_options`  
and `ring_radius` values to fit your section size.  
This gives a clean, balanced look in both desktop and mobile views.

---

## 🔧 Installation

**Manual**
1. Download the latest `battery-donut-card.js` from  
   [👉 GitHub Releases](https://github.com/lodebo/battery-donut-card/releases/latest)  
2. Copy it to your Home Assistant `www` folder.  
3. Add this to your Dashboard resources:  
4. Restart your dashboard.

**HACS (custom repo)**
1. In HACS → Integrations → Custom Repositories  
Add: `https://github.com/lodebo/battery-donut-card`  
Type: **Lovelace**  
2. Search for “Battery Donut Card” and install.

---

## 🧩 Example configuration

```yaml
type: custom:battery-donut-card
entity: sensor.battery_soc
cap_kwh: 10.24
ring_radius: 80
ring_width: 8
track_color: '#000000'
top_label_text: 'Batterij 1'
top_label_gap: 12
layout_options:
  grid_columns: 1
  grid_rows: 2
```

| Option            | Type    | Default      | Description                              |
| ----------------- | ------- | ------------ | ---------------------------------------- |
| `entity`          | string  | **required** | Sensor providing 0–100 % SoC             |
| `cap_kwh`         | number  | `5.12`       | Total battery capacity (kWh)             |
| `ring_radius`     | number  | `80`         | Radius of the ring                       |
| `ring_width`      | number  | `8`          | Thickness of the ring                    |
| `track_color`     | string  | `#000000`    | Color of the track background            |
| `segments`        | number  | `140`        | Number of gradient segments              |
| `top_label_text`  | string  | `Battery`    | Label above the ring (set empty to hide) |
| `top_label_gap`   | number  | `10`         | Distance between label and ring          |
| `glow_enabled`    | boolean | `true`       | Enables ring glow                        |
| `glow_blur`       | number  | `3.5`        | Blur intensity for glow                  |
| `glow_opacity`    | number  | `0.35`       | Glow opacity                             |
| `glow_scale`      | number  | `1.6`        | Glow width multiplier                    |
| `outline_enabled` | boolean | `true`       | Adds faint outline around donut          |
