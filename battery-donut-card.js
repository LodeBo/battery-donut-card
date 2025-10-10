/*!
 * Battery Donut Card — v1.0.15
 * Smooth multi-stop battery donut (SoC + kWh) + Wi-Fi indicator (bars by dBm)
 * - Wi-Fi: toon bars op basis van wifi_entity (dBm). Geen fake fallback.
 * - Wi-Fi positionering met wifi_offset_x / wifi_offset_y.
 * MIT License
 */
(() => {
  const TAG = "battery-donut-card";
  const VERSION = "1.0.15";

  class BatteryDonutCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._hass = null;
      this._config = null;
      this._renderQueued = false;
    }

    // Default config voor card picker (zonder 'type:')
    static getStubConfig() {
      return {
        entity: "sensor.battery_soc",
        cap_kwh: 10.24,
        segments: 140,

        // Ring & layout
        ring_radius: 100,
        ring_width: 10,
        ring_offset_y: 10,

        // Kleuren
        track_color: "#000000",
        color_red: "#ff0000",
        color_orange: "#fb923c",
        color_yellow: "#facc15",
        color_green: "#34d399",
        color_cyan: "#00bcd4",

        // Overgangsstops (0..1)
        stop_red_hold: 0.11,
        stop_orange: 0.25,
        stop_yellow: 0.45,
        stop_green: 0.70,

        // Tekst
        top_label_text: "Battery",
        top_label_weight: 300,
        top_label_color: "#ffffff",
        text_color_inside: "#ffffff",
        soc_decimals: 0,
        font_scale_kwh: 0.30,
        font_scale_soc: 0.38,

        // Wi-Fi (alleen via ECHTE sensor)
        // wifi_entity: "sensor.lilygo_rs485_wifi_signal_strength",
        wifi_always_show: false,   // true = badge tonen ook als sensor ontbreekt
        wifi_size_pct: 9,          // ~% van donut diameter
        wifi_offset_x: 100,        // px relatief t.o.v. SVG (positief = rechts)
        wifi_offset_y: 100,        // px (positief = naar onder)
        wifi_color_ok:  "#16a34a", // donkergroen
        wifi_color_down:"#ef4444", // rood
        wifi_shiny: true,          // glossy highlight

        // Card rand / achtergrond
        background: "transparent",
        border_radius: "12px",
        box_shadow: "none",
        border: "none",
        padding: "0px",
      };
    }

    static getConfigElement() {
      // minimale editor stub, zodat de picker weet dat er een editor is
      return document.createElement("battery-donut-card-editor");
    }

    setConfig(config) {
      if (!config || !config.entity) {
        throw new Error('Set an "entity" (0..100%) in the card config.');
      }
      this._config = Object.assign(
        {
          // Data
          cap_kwh: 5.12,
          segments: 140,

          // Ring & layout
          ring_radius: 80,
          ring_width: 8,
          ring_offset_y: 10,
          track_color: "#000000",

          // Kleuren
          color_red: "#ff0000",
          color_orange: "#fb923c",
          color_yellow: "#facc15",
          color_green: "#34d399",
          color_cyan: "#00bcd4",

          // Gradient stops
          stop_red_hold: 0.11,
          stop_orange: 0.25,
          stop_yellow: 0.45,
          stop_green: 0.70,

          // Tekst binnenin / label
          text_color_inside: "var(--primary-text-color)",
          soc_decimals: 0,
          font_scale_kwh: 0.30,
          font_scale_soc: 0.38,
          top_label_text: "Battery",
          top_label_weight: 300,
          top_label_color: "var(--primary-text-color)",

          // Wi-Fi
          wifi_entity: undefined,
          wifi_always_show: false,
          wifi_size_pct: 9,
          wifi_offset_x: 96,
          wifi_offset_y: 96,
          wifi_color_ok:  "#16a34a",
          wifi_color_down:"#ef4444",
          wifi_shiny: true,

          // Kaartstijl
          background: "transparent",
          border_radius: "12px",
          box_shadow: "none",
          padding: "0px",
          border: "none",
        },
        config
      );

      // alias: 'name:' mag het top label vullen als dat niet expliciet gezet is
      if (this._config.name && !this._config.top_label_text) {
        this._config.top_label_text = this._config.name;
      }

      this._render();
      if (!this._logged) {
        this._logged = true;
        console.info(
          `%c ${TAG} %c v${VERSION}`,
          "background:#00bcd4;color:#000;padding:2px 6px;border-radius:3px 0 0 3px;font-weight:700",
          "background:#333;color:#fff;padding:2px 6px;border-radius:0 3px 3px 0"
        );
      }
    }

    set hass(hass) { this._hass = hass; this._render(); }
    getCardSize() { return 3; }

    // Helpers
    _clamp(n,a,b){return Math.max(a,Math.min(b,n));}
    _toRad(d){return (d*Math.PI)/180;}
    _hex2rgb(h){const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(h).trim());return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:{r:255,g:255,b:255};}
    _rgb2hex(r,g,b){const p=v=>this._clamp(Math.round(v),0,255).toString(16).padStart(2,"0");return `#${p(r)}${p(g)}${p(b)}`;}
    _lerp(a,b,t){return a+(b-a)*t;}
    _lerpColor(a,b,t){const A=this._hex2rgb(a),B=this._hex2rgb(b);return this._rgb2hex(this._lerp(A.r,B.r,t),this._lerp(A.g,B.g,t),this._lerp(A.b,B.b,t));}
    _colorAtStops(stops,t){t=this._clamp(t,0,1);for(let i=0;i<stops.length-1;i++){const A=stops[i],B=stops[i+1];if(t>=A.pos&&t<=B.pos){const f=(t-A.pos)/Math.max(B.pos-A.pos,1e-6);return this._lerpColor(A.col,B.col,f);}}return stops[stops.length-1].col;}

    _render() {
      if (!this.shadowRoot || !this._config) return;
      if (this._renderQueued) return;
      this._renderQueued = true;

      Promise.resolve().then(() => {
        this._renderQueued = false;
        const c = this._config, h = this._hass;

        // SoC
        let soc = 0;
        if (h && c.entity && h.states && h.states[c.entity]) {
          const raw = String(h.states[c.entity].state ?? "0");
          soc = this._clamp(parseFloat(raw.replace(",", ".").replace(/[^0-9.]/g, ""))||0,0,100);
        }
        const cap = Number(c.cap_kwh || 5.12);
        const kwh = (soc/100)*cap;

        // Geometry donut
        const R  = Number(c.ring_radius || 80);
        const W  = Number(c.ring_width  || 8);
        const cx = 130;
        const cy = 130 + Number(c.ring_offset_y || 0);
        const rot = -90;
        const segs = Math.max(12, Number(c.segments || 140));
        const span = (soc/100)*360;

        // Stops
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

        // Tekst sizes/pos
        const fs_kwh = R*(Number(c.font_scale_kwh)||0.30);
        const fs_soc = R*(Number(c.font_scale_soc)||0.38);
        const y_kwh = cy - R*0.08;
        const y_soc = cy + R*0.40;

        const arcSeg=(a0,a1,sw,color)=>{
          const x0=cx+R*Math.cos(this._toRad(a0)), y0=cy+R*Math.sin(this._toRad(a0));
          const x1=cx+R*Math.cos(this._toRad(a1)), y1=cy+R*Math.sin(this._toRad(a1));
          const large=(a1-a0)>180?1:0;
          return `<path d="M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1}"
                   fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
        };

        // SVG start
        let svg = `
          <svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg" aria-label="Battery donut">
            <circle cx="${cx}" cy="${cy}" r="${R}" fill="none"
                    stroke="${c.track_color || "#000"}" stroke-width="${W}" stroke-linecap="round"/>
        `;

        // Actieve boog
        const start=rot, end=rot+span;
        for(let i=0;i<segs;i++){
          const a0=start+(i/segs)*span, a1=start+((i+1)/segs)*span;
          if(a1> end) break;
          const mid=(a0+a1)/2, t_abs=(mid-rot)/360;
          svg += arcSeg(a0,a1,W,this._colorAtStops(stops,t_abs));
        }

        // Top label
        if ((c.top_label_text ?? "").trim() !== "") {
          const fs_top = R*0.35;
          const y_top = (cy - R) - (W*0.8) - fs_top*0.25;
          svg += `
            <text x="${cx}" y="${y_top}" font-size="${fs_top}" font-weight="${c.top_label_weight || 300}"
                  fill="${c.top_label_color || "var(--primary-text-color)"}"
                  text-anchor="middle" dominant-baseline="middle">${c.top_label_text}</text>
          `;
        }

        // Binnenste teksten
        const innerColor=c.text_color_inside || "var(--primary-text-color)";
        const sd=Math.max(0,Number(c.soc_decimals)||0);
        svg += `
          <g text-anchor="middle" font-family="Inter,system-ui,Segoe UI,Roboto,Arial">
            <text x="${cx}" y="${y_kwh}" font-size="${fs_kwh}" font-weight="300"
                  fill="${innerColor}">${kwh.toFixed(2)} kWh</text>
            <text x="${cx}" y="${y_soc}" font-size="${fs_soc}" font-weight="300"
                  fill="${innerColor}">${soc.toFixed(sd)} %</text>
          </g>
        `;

        // =======================
        // Wi-Fi indicator (bars)
        // =======================
        // signaal ophalen
        let rawWifi = "";
        let wifiVal = NaN;
        const we = c.wifi_entity;

        if (we && h && h.states && h.states[we]) {
          rawWifi = String(h.states[we].state ?? "");
          wifiVal = Number(String(rawWifi).replace(",", "."));
        }

        const hasSensor = !!we;
        const connected = !(rawWifi === "" || rawWifi === "unavailable" || rawWifi === "unknown" || Number.isNaN(wifiVal));
        const shouldShow = hasSensor ? (connected || c.wifi_always_show) : false;

        if (shouldShow) {
          // dBm -> bars
          let bars = 0;
          if (connected) {
            if (wifiVal >= -50) bars = 4;
            else if (wifiVal >= -60) bars = 3;
            else if (wifiVal >= -70) bars = 2;
            else if (wifiVal >= -85) bars = 1;
            else bars = 0;
          }

          const color = connected ? (c.wifi_color_ok || "#16a34a") : (c.wifi_color_down || "#ef4444");

          // Positie: offsets in px t.o.v. (0,0) van SVG
          const size = (Number(c.wifi_size_pct)||9) / 100 * (2*R);
          const wx = cx + Number(c.wifi_offset_x || 0);
          const wy = cy + Number(c.wifi_offset_y || 0);

          // boog geometrie (zoals je voorbeeld; open cirkelsegmenten)
          const t = Math.max(1.6, size * 0.18);   // stroke width
          const r1 = size * 0.60;
          const r2 = size * 0.80;
          const r3 = size * 1.00;
          const r4 = size * 1.20;
          const dot = t*0.9;

          // segmenthoek: -135° → -45°
          const arc = (r) => {
            const a0 = -135 * Math.PI/180, a1 = -45 * Math.PI/180;
            const x0 = wx + r*Math.cos(a0), y0 = wy + r*Math.sin(a0);
            const x1 = wx + r*Math.cos(a1), y1 = wy + r*Math.sin(a1);
            return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
          };

          svg += `
            <g stroke="${color}" fill="none" stroke-linecap="round" stroke-linejoin="round">
              ${ c.wifi_shiny ? `
                <defs>
                  <linearGradient id="wifi_gloss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="rgba(255,255,255,0.25)"/>
                    <stop offset="1" stop-color="rgba(255,255,255,0.05)"/>
                  </linearGradient>
                </defs>
                <circle cx="${wx}" cy="${wy}" r="${size}" fill="rgba(0,0,0,0.55)" stroke="none"/>
                <circle cx="${wx}" cy="${wy - size*0.55}" r="${size*0.65}" fill="url(#wifi_gloss)" opacity="0.7" stroke="none"/>
              `: ``}
          `;

          if (connected) {
            if (bars >= 1) svg += `<path d="${arc(r1)}" stroke-width="${t}"/>`;
            if (bars >= 2) svg += `<path d="${arc(r2)}" stroke-width="${t}"/>`;
            if (bars >= 3) svg += `<path d="${arc(r3)}" stroke-width="${t}"/>`;
            if (bars >= 4) svg += `<path d="${arc(r4)}" stroke-width="${t}"/>`;
            svg += `<circle cx="${wx}" cy="${wy}" r="${dot}" fill="${color}" stroke="none"/>`;
          } else {
            // geen verbinding: ALLE bars + KORTE slash zoals voorbeeld
            svg += `
              <path d="${arc(r1)}" stroke-width="${t}"/>
              <path d="${arc(r2)}" stroke-width="${t}"/>
              <path d="${arc(r3)}" stroke-width="${t}"/>
              <path d="${arc(r4)}" stroke-width="${t}"/>
              <circle cx="${wx}" cy="${wy}" r="${dot}" fill="${color}" stroke="none"/>
              <path d="M ${wx - r4*0.6} ${wy - r4*0.6} L ${wx + r4*0.6} ${wy + r4*0.6}"
                    stroke="${color}" stroke-width="${t}" stroke-linecap="round"/>
            `;
          }
          svg += `</g>`;
        }

        // Close SVG
        svg += `</svg>`;

        // Styles & card
        const style = `
          <style>
            :host { display:block; width:100%; height:100%; }
            ha-card {
              background:${c.background};
              border-radius:${c.border_radius};
              box-shadow:${c.box_shadow};
              border:${c.border};
              padding:${c.padding};
              display:flex; align-items:center; justify-content:center;
              width:100%; height:100%;
            }
            .wrap { width:100%; height:100%; max-width:520px;
              display:flex; align-items:center; justify-content:center; position:relative; }
            svg { width:100%; height:auto; display:block; }
            text { user-select:none; }
          </style>
        `;

        this.shadowRoot.innerHTML = `${style}<ha-card><div class="wrap">${svg}</div></ha-card>`;
      });
    }
  }

  // mini-editor stub (geen echte UI, maar houdt de picker tevreden)
  class BatteryDonutCardEditor extends HTMLElement { setConfig(c){ this._config=c; } }
  if (!customElements.get("battery-donut-card-editor")) customElements.define("battery-donut-card-editor", BatteryDonutCardEditor);

  if (!customElements.get(TAG)) customElements.define(TAG, BatteryDonutCard);

  // Registratie voor Card Picker / “Custom” sectie
  const registerForPicker = () => {
    try {
      window.customCards = window.customCards || [];
      window.customCards = window.customCards.filter(c => c.type !== TAG);
      window.customCards.push({
        type: TAG,
        name: "Battery Donut Card",
        description: "Smooth multi-stop battery donut (SoC + kWh) with Wi-Fi bars.",
        preview: true,
        documentationURL: "https://github.com/lodebo/battery-donut-card#readme",
        version: VERSION,
      });
      window.dispatchEvent(new Event("ll-rebuild"));
    } catch(e) {
      console.warn("battery-donut-card: customCards registration failed", e);
    }
  };
  setTimeout(registerForPicker, 0);
})();
