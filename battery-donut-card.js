/*!
 * Battery Donut Card — v1.0.4
 * Smooth multi-stop gradient (red→orange→yellow→green→cyan), auto-scaling text,
 * optional top label, YAML-first — works in Sections + shows in picker (mini editor)
 * MIT License
 */
(() => {
  const TAG = "battery-donut-card";
  const VERSION = "1.0.4";

  class BatteryDonutCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._hass = null;
      this._config = null;
      this._renderQueued = false;
    }

    // Zinnige defaults in de picker
    static getStubConfig() {
      return {
        type: TAG,
        entity: "sensor.battery_soc",
        cap_kwh: 10.24,
        segments: 140,

        // Kleuren
        track_color: "#000000",
        color_red: "#ff0000",
        color_orange: "#fb923c",
        color_yellow: "#facc15",
        color_green: "#34d399",
        color_cyan: "#00bcd4",
        text_color_inside: "#ffffff",

        // Stops (0..1)
        stop_red_hold: 0.11,
        stop_orange: 0.25,
        stop_yellow: 0.45,
        stop_green: 0.70,

        // Layout
        ring_radius: 100,
        ring_width: 10,
        ring_offset_y: 10,
        label_ring_gap: 20,

        // Label
        top_label_text: "Battery",
        top_label_weight: 300,
        top_label_color: "#ffffff",

        // Tekst
        soc_decimals: 0,
        font_scale_kwh: 0.30,
        font_scale_soc: 0.38,

        // Kaart
        background: "transparent",
        border_radius: "0px",
        box_shadow: "none",
        border: "none",
        padding: "0px",
      };
    }

    // Nodig voor Sections card picker
    static getConfigElement() {
      return document.createElement("battery-donut-card-editor");
    }

    setConfig(config) {
      if (!config || !config.entity) {
        throw new Error('Set an "entity" (0..100%) in the card config.');
      }
      this._config = Object.assign(
        {
          // Data
          entity: null,
          cap_kwh: 5.12,
          segments: 140,

          // Ring & layout
          ring_radius: 80,
          ring_width: 8,
          track_color: "#000000",
          ring_offset_y: 10,  // globale verticale shift
          label_ring_gap: 0,  // alleen effect als label zichtbaar is

          // Kleuren
          color_red: "#ff0000",
          color_orange: "#fb923c",
          color_yellow: "#facc15",
          color_green: "#34d399",
          color_cyan: "#00bcd4",

          // Gradient stop-posities (0..1)
          stop_red_hold: 0.11,
          stop_orange: 0.25,
          stop_yellow: 0.45,
          stop_green: 0.70,

          // Teksten binnenin
          text_color_inside: "var(--primary-text-color)",
          soc_decimals: 0,
          font_scale_kwh: 0.30,
          font_scale_soc: 0.38,

          // Label boven ring
          top_label_text: "Battery",
          top_label_weight: 300,
          top_label_color: "var(--primary-text-color)",

          // Kaartcontainer
          background: "transparent",
          border_radius: "0px",
          box_shadow: "none",
          padding: "0px",
          border: "none",
        },
        config
      );

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

    set hass(hass) {
      this._hass = hass;
      this._render();
    }

    getCardSize() { return 3; }

    // ---------- helpers ----------
    _clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
    _toRad(d) { return (d * Math.PI) / 180; }
    _hex2rgb(h) {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(h).trim());
      return m ? { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) } : { r:255,g:255,b:255 };
    }
    _rgb2hex(r,g,b) {
      const p = v => this._clamp(Math.round(v),0,255).toString(16).padStart(2,"0");
      return `#${p(r)}${p(g)}${p(b)}`;
    }
    _lerp(a,b,t){ return a + (b-a)*t; }
    _lerpColor(a,b,t){
      const A=this._hex2rgb(a), B=this._hex2rgb(b);
      return this._rgb2hex(this._lerp(A.r,B.r,t), this._lerp(A.g,B.g,t), this._lerp(A.b,B.b,t));
    }
    _colorAtStops(stops,t){
      t=this._clamp(t,0,1);
      for(let i=0;i<stops.length-1;i++){
        const A=stops[i], B=stops[i+1];
        if(t>=A.pos && t<=B.pos){
          const f=(t-A.pos)/Math.max(B.pos-A.pos,1e-6);
          return this._lerpColor(A.col,B.col,f);
        }
      }
      return stops[stops.length-1].col;
    }

    // ---------- render ----------
    _render() {
      if (!this.shadowRoot || !this._config) return;
      if (this._renderQueued) return;
      this._renderQueued = true;

      Promise.resolve().then(() => {
        this._renderQueued = false;

        const c = this._config;
        const hass = this._hass;

        // Entity / SoC
        let soc = 0;
        if (hass && c.entity && hass.states && hass.states[c.entity]) {
          const raw = String(hass.states[c.entity].state ?? "0");
          soc = this._clamp(parseFloat(raw.replace(",", ".").replace(/[^0-9.]/g, "")) || 0, 0, 100);
        }
        const cap = Number(c.cap_kwh || 5.12);
        const kwh = (soc / 100) * cap;

        // Geometry
        const R = Number(c.ring_radius || 80);
        const W = Number(c.ring_width || 8);
        const cx = 130, baseCy = 130;

        // Label aanwezig? gap toepassen. Geen label? donut centreert.
        const gap = Number(c.label_ring_gap || 0);
        const hasLabel = (c.top_label_text ?? "").trim() !== "";
        const ringShift = Number(c.ring_offset_y || 0) + (hasLabel ? gap/2 : 0);
        const labelShift = hasLabel ? -(gap/2) : 0;

        const cy = baseCy + ringShift;
        const rot = -90; // start bovenaan
        const segs = Math.max(12, Number(c.segments || 140));
        const span = (soc / 100) * 360;

        // Stops (begrensd & oplopend)
        const sRH=this._clamp(Number(c.stop_red_hold),0,1);
        const sO =this._clamp(Number(c.stop_orange ),0,1);
        const sY =this._clamp(Number(c.stop_yellow ),0,1);
        const sG =this._clamp(Number(c.stop_green  ),0,1);
        const stops=[
          { pos: 0.0, col: c.color_red    || "#ff0000" },
          { pos: Math.max(0,Math.min(sRH,1)), col: c.color_red    || "#ff0000" },
          { pos: Math.max(sRH,Math.min(sO,1)), col: c.color_orange || "#fb923c" },
          { pos: Math.max(sO ,Math.min(sY,1)), col: c.color_yellow || "#facc15" },
          { pos: Math.max(sY ,Math.min(sG,1)), col: c.color_green  || "#34d399" },
          { pos: 1.0, col: c.color_cyan   || "#00bcd4" },
        ];

        const fs_kwh = R * (Number(c.font_scale_kwh) || 0.30);
        const fs_soc = R * (Number(c.font_scale_soc) || 0.38);
        const fs_top = R * 0.35;

        const y_kwh = cy - R * 0.08;
        const y_soc = cy + R * 0.40;
        const y_top = baseCy - R - W * 0.8 - fs_top * 0.25 + labelShift;

        const arcSeg = (a0,a1,sw,color) => {
          const x0=cx+R*Math.cos(this._toRad(a0)), y0=cy+R*Math.sin(this._toRad(a0));
          const x1=cx+R*Math.cos(this._toRad(a1)), y1=cy+R*Math.sin(this._toRad(a1));
          const large = (a1-a0)>180 ? 1 : 0;
          return `<path d="M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1}"
                    fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
        };

        // SVG
        let svg = `
          <svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg" aria-label="Battery donut">
            <!-- track -->
            <circle cx="${cx}" cy="${cy}" r="${R}" fill="none"
                    stroke="${c.track_color || "#000000"}"
                    stroke-width="${W}" stroke-linecap="round"/>
        `;

        // Actieve boog
        const start=rot, end=rot+span;
        for(let i=0;i<segs;i++){
          const a0=start+(i/segs)*span, a1=start+((i+1)/segs)*span;
          if(a1> end) break;
          const mid=(a0+a1)/2;
          const t_abs=(mid-rot)/360;
          const col=this._colorAtStops(stops, t_abs);
          svg += arcSeg(a0,a1,W,col);
        }

        // Label boven de ring (alleen als tekst aanwezig is)
        if (hasLabel) {
          svg += `
            <text x="${cx}" y="${y_top}" font-size="${fs_top}" font-weight="${c.top_label_weight || 300}"
                  fill="${c.top_label_color || "var(--primary-text-color)"}"
                  text-anchor="middle" dominant-baseline="middle">${c.top_label_text}</text>`;
        }

        // Binnenste teksten
        const innerColor = c.text_color_inside || "var(--primary-text-color)";
        const sd = Math.max(0, Number(c.soc_decimals) || 0);
        svg += `
            <g text-anchor="middle" font-family="Inter,system-ui,Segoe UI,Roboto,Arial">
              <text x="${cx}" y="${y_kwh}" font-size="${fs_kwh}" font-weight="300" fill="${innerColor}">
                ${kwh.toFixed(2)} kWh
              </text>
              <text x="${cx}" y="${y_soc}" font-size="${fs_soc}" font-weight="300" fill="${innerColor}">
                ${soc.toFixed(sd)} %
              </text>
            </g>
          </svg>
        `;

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
            .wrap { width:100%; height:100%; max-width:520px; display:flex; align-items:center; justify-content:center; }
            svg { width:100%; height:auto; display:block; }
            text { user-select:none; }
          </style>
        `;

        this.shadowRoot.innerHTML = `${style}<ha-card><div class="wrap">${svg}</div></ha-card>`;
      });
    }
  }

  // -------- mini editor (maakt 'm zichtbaar in de Sections card picker) --------
  class BatteryDonutCardEditor extends HTMLElement {
    set hass(h) { this._hass = h; }
    setConfig(cfg) { this._config = cfg || {}; this._render(); }
    _render() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      const c = this._config || {};
      this.shadowRoot.innerHTML = `
        <style>
          .row{display:flex;gap:12px;align-items:center;margin:8px 0}
          label{width:140px;font-weight:600}
          input{flex:1;padding:6px 8px;border:1px solid var(--divider-color);
                background:var(--card-background-color);color:var(--primary-text-color);
                border-radius:6px}
        </style>
        <div class="row"><label>Entity</label>
          <input id="entity" type="text" placeholder="sensor.battery_soc" value="${c.entity ?? ''}">
        </div>
        <div class="row"><label>Top label</label>
          <input id="label" type="text" placeholder="Battery" value="${c.top_label_text ?? 'Battery'}">
        </div>
        <div class="row"><label>Ring radius</label>
          <input id="radius" type="number" min="50" max="200" value="${c.ring_radius ?? 100}">
        </div>
        <div class="row"><label>Ring width</label>
          <input id="width" type="number" min="4" max="30" value="${c.ring_width ?? 10}">
        </div>
      `;
      const emit = () => this.dispatchEvent(new CustomEvent('config-changed', {
        detail: {
          config: {
            ...this._config,
            entity: this.shadowRoot.getElementById('entity').value || this._config?.entity,
            top_label_text: this.shadowRoot.getElementById('label').value || 'Battery',
            ring_radius: Number(this.shadowRoot.getElementById('radius').value || 100),
            ring_width: Number(this.shadowRoot.getElementById('width').value || 10),
          }
        }
      }));
      ['entity','label','radius','width'].forEach(id=>{
        this.shadowRoot.getElementById(id)?.addEventListener('change', emit);
      });
    }
  }
  if (!customElements.get('battery-donut-card-editor')) {
    customElements.define('battery-donut-card-editor', BatteryDonutCardEditor);
  }

  // -------- element registreren --------
  if (!customElements.get(TAG)) {
    customElements.define(TAG, BatteryDonutCard);
  }

  // -------- en pas DAARNA metadata pushen (voor picker) --------
  window.customCards = window.customCards || [];
  window.customCards = window.customCards.filter(c => c.type !== TAG);
  window.customCards.push({
    type: TAG,
    name: "Battery Donut Card",
    description: "Smooth multi-stop battery donut (SoC + kWh). Auto-scaling text, optional top label, gradient stops, and clean track.",
    preview: true,
    documentationURL: "https://github.com/lodebo/battery-donut-card#readme",
    version: VERSION
  });
})();
