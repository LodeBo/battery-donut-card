# Battery Donut Card

A minimalist Home Assistant custom card that renders a smooth, multi-stop **battery SoC donut** — with auto-scaling text and a configurable top label.  

![screenshot](https://github.com/LodeBo/battery-donut-card/blob/main/donut.png?raw=true)

---

## Installation

### HACS (recommended)
1. Go to **HACS → Frontend → ⋮ → Custom repositories**.  
2. Add your repository URL, category: **Lovelace**.  
3. Install **Battery Donut Card** and click **Reload resources**.  

### Manual
Copy `battery-donut-card.js` into `/config/www/` and add this resource in **Settings → Dashboards → Resources**:

```yaml
url: /local/battery-donut-card.js
type: module
```
## Options

| Option             | Type     | Default      | Description |
|--------------------|----------|--------------|-------------|
| `entity`           | string   | **required** | Sensor providing 0–100 % SoC. |
| `cap_kwh`          | number   | `5.12`       | Total battery capacity (kWh), used to calculate displayed kWh. |
| `ring_radius`      | number   | `80`         | Radius of the ring. Larger = bigger donut. |
| `ring_width`       | number   | `8`          | Thickness of the ring. |
| `track_color`      | string   | `#000000`    | Color of the background track. |
| `rotate_deg`       | number   | `-90`        | Rotation in degrees (where 0% starts). |
| `segments`         | number   | `140`        | Number of arc segments (higher = smoother gradient). |
| `color_red`        | string   | `#ff0000`    | Start color (0%). |
| `color_orange`     | string   | `#fb923c`    | Transition color. |
| `color_yellow`     | string   | `#facc15`    | Transition color. |
| `color_green`      | string   | `#34d399`    | Transition color. |
| `color_cyan`       | string   | `#00bcd4`    | End color (100%). |
| `glow_enabled`     | bool     | `true`       | Enable/disable glow effect. |
| `glow_blur`        | number   | `3.5`        | Blur radius for glow. |
| `glow_opacity`     | number   | `0.35`       | Opacity of glow. |
| `glow_scale`       | number   | `1.6`        | Thickness of glow relative to ring. |
| `outline_enabled`  | bool     | `false`      | Enable outline inside the donut. |
| `top_label_text`   | string   | `'Battery'`  | Text above the ring. |
| `top_label_weight` | number   | `300`        | Font weight of the top label. |
| `top_label_color`  | string   | `var(--primary-text-color)` | Color of the top label. |
| `ring_offset_y`    | number   | `10`         | Shift the ring up or down (positive = lower). |
| `font_scale_kwh`   | number   | `0.30`       | Scale factor for the kWh text size (auto-scales with `ring_radius`). |
| `font_scale_soc`   | number   | `0.38`       | Scale factor for the % text size (auto-scales with `ring_radius`). |
| `background`       | string   | `transparent`| Background of the card. |
| `border_radius`    | string   | `0px`        | Border radius of the card. |
| `box_shadow`       | string   | `none`       | Shadow of the card. |
| `padding`          | string   | `0px`        | Inner padding of the card. |
| `border`           | string   | `none`       | Border of the card. |
| `aspect_ratio`     | string   | `1/1`        | Aspect ratio of the card. |




