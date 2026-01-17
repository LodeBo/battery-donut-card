/*!
 * Battery Donut Card — Final5 (Stable Version)
 */

(() => {
  const TAG = "battery-donut-card";
  const VERSION = "1.4.0";

  class BatteryDonutCard extends HTMLElement {
    constructor() {
      super();
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this._hass = null;
      this._config = null;
      this._renderQueued = false;
      this._lastUpdate = 0; // NODIG VOOR STABILITEIT
    }

    static getStubConfig() {
      return {
        entity: "sensor.battery_soc",
        cap_kwh: 5.12,
        segments: 140,
        ring_radius: 80,
        ring_width: 8,
        ring_offset_y: 0,
        label_ring_gap: 20,
        track_color: "#000000",
        color_red: "#ff0000",
        color_orange: "#fb923c",
        color_yellow: "#facc15",
        color_green: "#34d399",
        color_cyan: "#00bcd4",
        stop_red_hold: 0.11,
        stop_orange: 0.25,
        stop_yellow: 0.45,
        stop_green: 0.70,
        top_label_text: "Battery",
        top_label_weight: 300,
        top_label_color: "#ffffff",
        text_color_inside: "#ffffff",
        font_scale_kwh: 0.30,
        font_scale_soc: 0.30,
        wifi_enabled: true,
        wifi_always_show: false,
        wifi_entity: "sensor.lilygo_rs485_wifi_signal_strength",
        wifi_size_pct: 9,
        wifi_offset_x: 0,
        wifi_offset_y: 0,
        power_enabled: true,
        power_always_show: false,
        power_entity: "sensor.inverter_active_power",
        power_size_pct: 16,
        power_offset_x: 0,
        power_offset_y: 0,
        background: "var(--card-background-color)",
        border_radius: "12px",
        border: "1px solid rgba(255,255,255,0.2)",
        box_shadow: "none",
        padding: "0px",
      };
    }

    static getConfigElement() {
      return document.createElement("battery-donut-card-editor");
    }

    setConfig(config) {
      if (!config || !config.entity) {
        throw new Error('Set an "entity" (0..100%) in the card config.');
      }
      this._config = Object.assign({}, BatteryDonutCard.getStubConfig(), config);
      if (this._config.name && !this._config.top_label_text) {
        this._config.top_label_text = this._config.name;
      }
      this._render();
    }

    set hass(hass) {
      // DE ENIGE NOODZAKELIJKE WIJZIGING:
      // Update maximaal elke 2 seconden om de processor van de tablet te ontlasten
      const now = Date.now();
      if (this._lastUpdate && now - this._lastUpdate < 2000) return;
      
      this._lastUpdate = now;
      this._hass = hass;
      this._render();
    }

    getCardSize() { return 3; }

    _clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
    _toRad(d) { return (d * Math.PI) / 180; }
    _hex2rgb(h) {
      const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(h).trim());
      return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:{r:255,g:255,b:255};
    }
    _rgb2hex(r,g,b){ const p=v=>this._clamp(Math.round(v),0,255).toString(16).padStart(2,"0"); return `#${p(r)}${p(g)}${p(b)}`; }
    _lerp(a,b,t){ return a+(b-a)*t; }
    _lerpColor(a,b,t){ const A=this._hex2rgb(a),B=this._hex2rgb(b); return this._rgb2hex(this._lerp(A.r,B.r,t),this._lerp(A.g,B.g,t),this._lerp(A.b,B.b,t)); }
    _colorAtStops(stops,t){
      t=this._clamp(t,0,1);
      for(let i=0;i<stops.length-1;i++){
        const A=stops[i],B=stops[i+1];
        if(t>=A.pos && t<=B.pos){
          const f=(t-A.pos)/Math.max(B.pos-A.pos,1e-6);
          return this._lerpColor(A.col,B.col,f);
        }
      }
      return stops[stops.length-1].col;
    }

    _render() {
      if (!this._config || !this._hass) return;
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      if (this._renderQueued) return;
      this._renderQueued = true;

      Promise.resolve().then(() => {
        this._renderQueued = false;
        const c = this._config;
        const h = this._hass;

        let soc = 0;
        if (h && c.entity && h.states && h.states[c.entity]) {
          const raw = String(h.states[c.entity].state ?? "0");
          soc = this._clamp(parseFloat(raw.replace(",", ".").replace(/[^0-9.]/g, "")) || 0, 0, 100);
        }
        const cap = Number(c.cap_kwh || 5.12);
        const kwh = (soc / 100) * cap;

        const R  = Number(c.ring_radius || 80);
        const W  = Number(c.ring_width  || 8);
        const cx = 130;
        const cy = 130 + Number(c.ring_offset_y || 0);
        const rot = -90;
        const segs = Math.max(12, Number(c.segments || 140));
        const span = (soc / 100) * 360;

        const sRH=this._clamp(Number(c.stop_red_hold),0,1);
        const sO =this._clamp(Number(c.stop_orange ),0,1);
        const sY =this._clamp(Number(c.stop_yellow ),0,1);
        const sG =this._clamp(Number(c.stop_green  ),0,1);
        const stops=[
          {pos:0.0,col:c.color_red||"#ff0000"},
          {pos:Math.max(0,Math.min(sRH,1)),col:c.color_red||"#ff0000"},
          {pos:Math.max(sRH,Math.min(sO,1)),col:c.color_orange||"#fb923c"},
          {pos:Math.max(sO,Math.min(sY,1)),col:c.color_yellow||"#facc15"},
          {pos:Math.max(sY,Math.min(sG,1)),col:c.color_green||"#34d399"},
          {pos:1.0,col:c.color_cyan||"#00bcd4"},
        ];

        const fs_kwh = R * (Number(c.font_scale_kwh) || 0.30);
        const fs_soc = R * (Number(c.font_scale_soc) || 0.30);
        const y_kwh = cy - R * 0.08;
        const y_soc = cy + R * 0.40;

        const arcSeg=(a0,a1,sw,color)=>{
          const x0=cx+R*Math.cos(this._toRad(a0)), y0=cy+R*Math.sin(this._toRad(a0));
          const x1=cx+R*Math.cos(this._toRad(a1)), y1=cy+R*Math.sin(this._toRad(a1));
          const large=(a1-a0)>180?1:0;
          return `<path d="M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
        };

        let svg = `<svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg"><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${c.track_color || "#000"}" stroke-width="${W}" stroke-linecap="round"/>`;

        const start=rot, end=rot+span;
        for(let i=0;i<segs;i++){
          const a0=start+(i/segs)*span, a1=start+((i+1)/segs)*span;
          if(a1> end) break;
          const mid=(a0+a1)/2, t_abs=(mid-rot)/360;
          svg += arcSeg(a0,a1,W,this._colorAtStops(stops,t_abs));
        }

        if ((c.top_label_text ?? "").trim() !== "") {
          const fs_top = R * 0.35;
          const y_top = (cy - R) - (W*0.8) - fs_top*0.25 - Number(c.label_ring_gap || 0);
          svg += `<text x="${cx}" y="${y_top}" font-size="${fs_top}" font-weight="${c.top_label_weight || 300}" fill="${c.top_label_color || "var(--primary-text-color)"}" text-anchor="middle" dominant-baseline="middle">${c.top_label_text}</text>`;
        }

        const innerColor = c.text_color_inside || "var(--primary-text-color)";
        svg += `<g text-anchor="middle" font-family="Inter,system-ui,Segoe UI,Roboto,Arial"><text x="${cx}" y="${y_kwh}" font-size="${fs_kwh}" font-weight="300" fill="${innerColor}">${kwh.toFixed(2)} kWh</text><text x="${cx}" y="${y_soc}" font-size="${fs_soc}" font-weight="300" fill="${innerColor}">${soc.toFixed(0)} %</text></g>`;

        // Wi-Fi
        (() => {
          if (!c.wifi_enabled) return;
          let raw = "", val = NaN;
          const we = c.wifi_entity;
          if (we && h && h.states && h.states[we]) {
            raw = String(h.states[we].state ?? "");
            val = Number(String(raw).replace(",", "."));
          }
          const connected = !(raw === "" || raw === "unavailable" || raw === "unknown" || Number.isNaN(val));
          if (!connected && !c.wifi_always_show) return;
          let bars = 0;
          if (connected) {
            if (val >= -50) bars = 4;
            else if (val >= -60) bars = 3;
            else if (val >= -70) bars = 2;
            else if (val >= -85) bars = 1;
          }
          const size = (Number(c.wifi_size_pct)||9) * (2*R) / 100;
          const px = (cx - R) + (Number(c.wifi_offset_x)||0) * (R/100) + R;
          const py = (cy + R) + (Number(c.wifi_offset_y)||0) * (R/100);
          const color = connected ? "#22c55e" : "#ef4444";
          const t = Math.max(1.6, size * 0.20);
          const r1 = size * 0.60, r2 = size * 0.80, r3 = size * 1.00, r4 = size * 1.20, dot = t*0.9;
          const arc = (r) => {
            const a0 = -135 * Math.PI/180, a1 = -45 * Math.PI/180;
            return `M ${px + r*Math.cos(a0)} ${py + r*Math.sin(a0)} A ${r} ${r} 0 0 1 ${px + r*Math.cos(a1)} ${py + r*Math.sin(a1)}`;
          };
          svg += `<g stroke="${color}" fill="none" stroke-linecap="round" stroke-linejoin="round">`;
          if (connected) {
            if (bars >= 1) svg += `<path d="${arc(r1)}" stroke-width="${t}"/>`;
            if (bars >= 2) svg += `<path d="${arc(r2)}" stroke-width="${t}"/>`;
            if (bars >= 3) svg += `<path d="${arc(r3)}" stroke-width="${t}"/>`;
            if (bars >= 4) svg += `<path d="${arc(r4)}" stroke-width="${t}"/>`;
            svg += `<circle cx="${px}" cy="${py}" r="${dot}" fill="${color}" stroke="none"/>`;
          } else {
            svg += `<path d="${arc(r1)}" stroke-width="${t}"/><path d="${arc(r2)}" stroke-width="${t}"/><path d="${arc(r3)}" stroke-width="${t}"/><path d="${arc(r4)}" stroke-width="${t}"/><circle cx="${px}" cy="${py}" r="${dot}" fill="${color}" stroke="none"/><path d="M ${px - r4*0.95} ${py - r4*0.95} L ${px + r4*0.95} ${py + r4*0.95}" stroke="${color}" stroke-width="${t}"/>`;
          }
          svg += `</g>`;
        })();

        // Power
        (() => {
          if (!c.power_enabled) return;
          let raw = "", val = NaN;
          const pe = c.power_entity;
          if (pe && h && h.states && h.states[pe]) {
            raw = String(h.states[pe].state ?? "");
            val = Number(String(raw).replace(",", "."));
          }
          const hasValue = !Number.isNaN(val);
          if (!hasValue && !c.power_always_show) return;
          const absW = hasValue ? Math.abs(val) : 0;
          const pSize = (Number(c.power_size_pct)||16) * (2*R) / 100;
          const px = (cx - R) + (Number(c.power_offset_x)||0) * (R/100) + R;
          const py = (cy + R) + (Number(c.power_offset_y)||0) * (R/100);
          const stroke = Math.max(1.4, pSize * 0.18);
          const isUp = hasValue ? (val < 0) : true;
          const rotationDeg = isUp ? 0 : 180;
          const half = pSize * 0.26, head = half * 0.55, halfW = stroke * 0.85;
          const yTop = py - half, yBot = py + half, yTip = yTop, yHeadHalf = yTop + head*0.55, yHeadTop = yTop + head;
          svg += `<g transform="rotate(${rotationDeg} ${px} ${py})" stroke="${isUp ? "#22c55e" : "#f59e0b"}" fill="none" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"><line x1="${px}" y1="${yBot}" x2="${px}" y2="${yHeadTop}" /><path d="M ${px - halfW} ${yHeadHalf} L ${px} ${yTip} L ${px + halfW} ${yHeadHalf}" /></g><text x="${px + pSize * 0.45}" y="${py}" font-size="${Math.max(10, pSize * 0.90)}" font-weight="300" fill="#ffffff" text-anchor="start" dominant-baseline="middle">${absW.toFixed(0)} W</text>`;
        })();

        svg += `</svg>`;
        this.shadowRoot.innerHTML = `<style>:host { display:block; width:100%; height:100%; } ha-card { background:${c.background}; border-radius:${c.border_radius}; box-shadow:${c.box_shadow}; border:${c.border}; padding:${c.padding}; display:flex; align-items:center; justify-content:center; width:100%; height:100%; } .wrap { width:100%; height:100%; max-width:520px; display:flex; align-items:center; justify-content:center; position:relative; } svg { width:100%; height:auto; display:block; } text { user-select:none; }</style><ha-card><div class="wrap">${svg}</div></ha-card>`;
      });
    }
  }

  class BatteryDonutCardEditor extends HTMLElement { setConfig(c){ this._config=c; } }
  if (!customElements.get("battery-donut-card-editor")) customElements.define("battery-donut-card-editor", BatteryDonutCardEditor);
  if (!customElements.get(TAG)) customElements.define(TAG, BatteryDonutCard);

  try {
    window.customCards = window.customCards || [];
    window.customCards = window.customCards.filter((c) => c.type !== TAG);
    window.customCards.push({
      type: TAG,
      name: "Battery Donut Card",
      description: "Smooth multi-stop battery donut (SoC + kWh) met Wi-Fi bars en power arrow.",
      preview: true,
      documentationURL: "https://github.com/lodebo/battery-donut-card#readme",
      version: VERSION,
    });
    window.dispatchEvent(new Event("ll-rebuild"));
  } catch (e) {}
})();
