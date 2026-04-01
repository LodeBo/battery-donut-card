/*!
 * Battery Donut Card — Version 2.6.0 (Perfected Visuals)
 */

(() => {
  const TAG = "battery-donut-card";
  const VERSION = "2.6.0";

  class BatteryDonutCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._hass = null;
      this._config = null;
      this._elements = {}; 
    }

    static getConfigElement() {
      return document.createElement("battery-donut-card-editor");
    }

    static getStubConfig() {
      return {
        entity: "",
        cap_kwh: 5.12,
        segments: 140,
        ring_radius: 80,
        ring_width: 8,
        ring_offset_y: 0,
        track_color: "rgba(100, 100, 100, 0.2)",
        color_red: "#ff0000",
        color_orange: "#fb923c",
        color_yellow: "#facc15",
        color_green: "#34d399",
        color_cyan: "#00bcd4",
        stop_red_hold: 0.11,
        stop_orange: 0.25,
        stop_yellow: 0.45,
        stop_green: 0.70,
        top_label_text: "Batterij",
        wifi_enabled: true,
        wifi_entity: "",
        wifi_offset_x: 0,
        wifi_offset_y: 0,
        power_enabled: true,
        power_entity: "",
        power_offset_x: 0,
        power_offset_y: 0,
        background: "var(--card-background-color)",
        border_radius: "12px",
        border: "1px solid rgba(255,255,255,0.2)",
      };
    }

    setConfig(config) {
      if (!config || !config.entity) {
        this._config = { ...BatteryDonutCard.getStubConfig(), ...config };
      } else {
        this._config = { ...BatteryDonutCard.getStubConfig(), ...config };
      }
      this._buildDOM();
      if (this._hass) this._updateValues();
    }

    set hass(hass) {
      if (!this._config) { this._hass = hass; return; }
      const entityChanged = this._hasStateChanged(this._hass, hass, this._config.entity);
      const wifiChanged = this._config.wifi_enabled && this._hasStateChanged(this._hass, hass, this._config.wifi_entity);
      const powerChanged = this._config.power_enabled && this._hasStateChanged(this._hass, hass, this._config.power_entity);
      this._hass = hass;
      if (entityChanged || wifiChanged || powerChanged) this._updateValues();
    }

    _hasStateChanged(oldHass, newHass, entityId) {
      if (!entityId) return false;
      return oldHass?.states[entityId]?.state !== newHass?.states[entityId]?.state;
    }

    getCardSize() { return 3; }
    
    getGridOptions() {
      return { columns: 4, rows: 4, min_columns: 2, min_rows: 2 };
    }

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

    _buildDOM() {
      const c = this._config;
      const R = Number(c.ring_radius || 80);
      const W = Number(c.ring_width || 8);
      const cx = 130, cy = 130 + Number(c.ring_offset_y || 0);
      const circumference = 2 * Math.PI * R;
      this._circumference = circumference;

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

      const segs = Math.max(12, Number(c.segments || 140));
      const rot = -90;
      let gradientPaths = "";
      
      const arcSeg=(a0,a1,sw,color)=>{
        const x0=cx+R*Math.cos(this._toRad(a0)), y0=cy+R*Math.sin(this._toRad(a0));
        const x1=cx+R*Math.cos(this._toRad(a1)), y1=cy+R*Math.sin(this._toRad(a1));
        return `<path d="M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
      };

      // FIX: Loop achterstevoren! Hierdoor wordt het rode stuk als laatste getekend en ligt het mooi 
      // over de blauwe staart heen op 12 uur. Geen losse rode stip meer nodig.
      for(let i = segs - 1; i >= 0; i--){
        const a0 = rot + (i/segs)*360;
        const a1 = rot + ((i+1.2)/segs)*360; 
        gradientPaths += arcSeg(a0, a1, W, this._colorAtStops(stops, i/segs));
      }

      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; width: 100%; height: 100%; }
          ha-card { background: ${c.background}; border-radius: ${c.border_radius}; border: ${c.border}; display:flex; align-items:center; justify-content:center; width:100%; height:100%; box-sizing: border-box; padding: 12px; overflow: hidden; }
          .wrap { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
          svg { width: 100%; height: 100%; max-height: 100%; max-width: 100%; aspect-ratio: 1 / 1; display: block; object-fit: contain; }
          text { user-select:none; font-family: Inter, system-ui, sans-serif; }
          .value-text { fill: #ffffff; font-weight: 300; }
          #mask-circle { transition: stroke-dashoffset 0.5s ease-out; }
          .warning { color: #facc15; font-size: 14px; text-align: center; font-family: sans-serif; }
        </style>
        <ha-card>
          ${!c.entity ? `<div class="warning">Selecteer een batterij sensor in de editor.</div>` : `
          <div class="wrap">
            <svg viewBox="0 0 260 260">
              <defs>
                <mask id="donut-mask">
                  <circle id="mask-circle" cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="white" stroke-width="${W}" 
                    stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" 
                    transform="rotate(-90 ${cx} ${cy})" />
                </mask>
              </defs>
              <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${c.track_color}" stroke-width="${W}" />
              <g mask="url(#donut-mask)">${gradientPaths}</g>
              <text x="${cx}" y="${cy - R - 20}" font-size="${R * 0.35}" fill="#ffffff" text-anchor="middle">${c.top_label_text}</text>
              <text id="kwh-text" class="value-text" x="${cx}" y="${cy - R * 0.08}" font-size="${R * 0.30}" text-anchor="middle">0.00 kWh</text>
              <text id="soc-text" class="value-text" x="${cx}" y="${cy + R * 0.40}" font-size="${R * 0.30}" text-anchor="middle">0 %</text>
              <g id="wifi-container"></g>
              <g id="power-container"></g>
            </svg>
          </div>`}
        </ha-card>
      `;

      if (c.entity) {
        this._elements = {
          maskCircle: this.shadowRoot.getElementById("mask-circle"),
          kwhText: this.shadowRoot.getElementById("kwh-text"),
          socText: this.shadowRoot.getElementById("soc-text"),
          wifiContainer: this.shadowRoot.getElementById("wifi-container"),
          powerContainer: this.shadowRoot.getElementById("power-container")
        };
      }
    }

    _updateValues() {
      const h = this._hass; const c = this._config; if (!h || !c.entity || !this._elements.maskCircle) return;
      const rawSoc = h.states[c.entity]?.state ?? "0";
      const soc = this._clamp(parseFloat(rawSoc) || 0, 0, 100);
      const kwh = (soc / 100) * Number(c.cap_kwh || 5.12);
      this._elements.kwhText.textContent = `${kwh.toFixed(2)} kWh`;
      this._elements.socText.textContent = `${soc.toFixed(0)} %`;
      this._elements.maskCircle.style.strokeDashoffset = this._circumference - (soc / 100) * this._circumference;
      if (c.wifi_enabled) this._renderWifi();
      if (c.power_enabled) this._renderPower();
    }

    _renderWifi() {
      const c = this._config;
      const val = parseFloat(this._hass.states[c.wifi_entity]?.state ?? "");
      if (isNaN(val)) { this._elements.wifiContainer.innerHTML = ''; return; }
      const bars = val >= -50 ? 4 : val >= -60 ? 3 : val >= -70 ? 2 : val >= -85 ? 1 : 0;
      const R = Number(c.ring_radius || 80);
      const cx = 130, cy = 130 + Number(c.ring_offset_y || 0);
      
      // FIX: Positie verlaagd, icoon smaller (minder spreiding in X-as)
      const px = cx + R + 15 + (Number(c.wifi_offset_x) || 0); 
      const py = cy + R + 20 + (Number(c.wifi_offset_y) || 0);
      const color = "#22c55e"; 
      
      this._elements.wifiContainer.innerHTML = `<g stroke="${color}" fill="none" stroke-width="2.5" stroke-linecap="round">
        <circle cx="${px}" cy="${py}" r="2" fill="${color}" stroke="none"/>
        ${bars>=1 ? `<path d="M ${px-5} ${py-4} Q ${px} ${py-7} ${px+5} ${py-4}"/>` : ''}
        ${bars>=2 ? `<path d="M ${px-9} ${py-8} Q ${px} ${py-12} ${px+9} ${py-8}"/>` : ''}
        ${bars>=3 ? `<path d="M ${px-13} ${py-12} Q ${px} ${py-17} ${px+13} ${py-12}"/>` : ''}
        ${bars>=4 ? `<path d="M ${px-17} ${py-16} Q ${px} ${py-22} ${px+17} ${py-16}"/>` : ''}
      </g>`;
    }

    _renderPower() {
      const c = this._config;
      const val = parseFloat(this._hass.states[c.power_entity]?.state ?? "");
      if (isNaN(val)) { this._elements.powerContainer.innerHTML = ''; return; }
      const R = Number(c.ring_radius || 80);
      const cx = 130, cy = 130 + Number(c.ring_offset_y || 0);
      
      // FIX: Verder naar links (-25) en iets lager gezet, zodat waarden als 2000W ver onder de ring blijven.
      const px = cx - R - 25 + (Number(c.power_offset_x) || 0); 
      const py = cy + R + 20 + (Number(c.power_offset_y) || 0);
      const isCharging = val < 0;
      const color = isCharging ? "#22c55e" : "#f59e0b";
      
      const arrow = isCharging 
        ? `M ${px} ${py+9} L ${px} ${py-9} M ${px-4} ${py-4} L ${px} ${py-9} L ${px+4} ${py-4}` 
        : `M ${px} ${py-9} L ${px} ${py+9} M ${px-4} ${py+4} L ${px} ${py+9} L ${px+4} ${py+4}`;
        
      this._elements.powerContainer.innerHTML = `
        <g stroke="${color}" fill="none" stroke-width="2.5" stroke-linecap="round">
          <path d="${arrow}"/>
        </g>
        <text x="${px+12}" y="${py}" font-size="14" fill="#fff" dominant-baseline="middle" font-weight="400">${Math.abs(val).toFixed(0)} W</text>
      `;
    }
  }

  // --- UI Editor ---
  class BatteryDonutCardEditor extends HTMLElement {
    setConfig(config) {
      this._config = config;
      if (this._form) this._form.data = config;
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._form) this._buildForm();
      this._form.hass = hass;
    }

    _buildForm() {
      this.attachShadow({ mode: "open" });
      this._form = document.createElement("ha-form");
      
      this._form.schema = [
        { name: "top_label_text", label: "Kaart Titel (bijv. Batterij 1)", selector: { text: {} } },
        { name: "entity", label: "Batterij SoC Sensor (%)", selector: { entity: { domain: "sensor" } } },
        { name: "cap_kwh", label: "Totale Capaciteit (kWh)", selector: { number: { mode: "box", step: 0.1 } } },
        { type: "grid", name: "", schema: [
          { name: "wifi_enabled", label: "Toon Wi-Fi Icoon", selector: { boolean: {} } },
          { name: "power_enabled", label: "Toon Vermogen Pijltje", selector: { boolean: {} } }
        ]},
        { name: "wifi_entity", label: "Wi-Fi Sterkte Sensor", selector: { entity: { domain: "sensor" } } },
        { name: "power_entity", label: "Actief Vermogen Sensor (W)", selector: { entity: { domain: "sensor" } } }
      ];
      
      this._form.computeLabel = s => s.label || s.name;
      this._form.data = this._config;
      
      this._form.addEventListener("value-changed", ev => {
        this.dispatchEvent(new CustomEvent("config-changed", {
          detail: { config: ev.detail.value },
          bubbles: true, composed: true
        }));
      });
      
      this.shadowRoot.appendChild(this._form);
    }
  }

  customElements.define("battery-donut-card-editor", BatteryDonutCardEditor);
  customElements.define(TAG, BatteryDonutCard);
  
  window.customCards = window.customCards || [];
  if (!window.customCards.some(c => c.type === TAG)) {
    window.customCards.push({ type: TAG, name: "Battery Donut Card", description: "Smooth gradient donut with native visual editor.", preview: true });
  }
})();
