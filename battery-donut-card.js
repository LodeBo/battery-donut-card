/*!
 * Battery Donut Card — Optimized Version
 */

(() => {
  const TAG = "battery-donut-card";
  const VERSION = "2.0.0";

  class BatteryDonutCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._hass = null;
      this._config = null;
      this._elements = {}; // Cache voor onze DOM elementen
    }

    static getStubConfig() {
      return {
        entity: "sensor.battery_soc",
        cap_kwh: 5.12,
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
        top_label_text: "Battery",
        wifi_enabled: true,
        wifi_entity: "sensor.lilygo_rs485_wifi_signal_strength",
        power_enabled: true,
        power_entity: "sensor.inverter_active_power",
        background: "var(--card-background-color)",
        border_radius: "12px",
        border: "1px solid rgba(255,255,255,0.2)",
      };
    }

    static getConfigElement() {
      return document.createElement("battery-donut-card-editor");
    }

    setConfig(config) {
      if (!config || !config.entity) {
        throw new Error('Set an "entity" (0..100%) in the card config.');
      }
      this._config = { ...BatteryDonutCard.getStubConfig(), ...config };
      
      // Bouw de DOM structuur precies 1 keer op
      this._buildDOM();
      
      // Forceer een eerste update als hass al beschikbaar is
      if (this._hass) this._updateValues();
    }

    set hass(hass) {
      if (!this._config) {
        this._hass = hass;
        return;
      }

      // Check of de specifieke entiteiten ECHT veranderd zijn
      const entityChanged = this._hasStateChanged(this._hass, hass, this._config.entity);
      const wifiChanged = this._config.wifi_enabled && this._hasStateChanged(this._hass, hass, this._config.wifi_entity);
      const powerChanged = this._config.power_enabled && this._hasStateChanged(this._hass, hass, this._config.power_entity);

      this._hass = hass;

      // Update alleen de UI als de onderliggende data is aangepast
      if (entityChanged || wifiChanged || powerChanged) {
        this._updateValues();
      }
    }

    _hasStateChanged(oldHass, newHass, entityId) {
      const oldState = oldHass?.states[entityId]?.state;
      const newState = newHass?.states[entityId]?.state;
      return oldState !== newState;
    }

    getCardSize() { return 3; }

    // --- Helper Functies ---
    _clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
    _hex2rgb(h) {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(h).trim());
      return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 255, g: 255, b: 255 };
    }
    _rgb2hex(r, g, b) {
      const p = v => this._clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
      return `#${p(r)}${p(g)}${p(b)}`;
    }
    _lerpColor(a, b, t) {
      const A = this._hex2rgb(a), B = this._hex2rgb(b);
      return this._rgb2hex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
    }
    
    _getCurrentColor(socPct) {
      const c = this._config;
      const stops = [
        { pos: 0.0, col: c.color_red },
        { pos: c.stop_red_hold, col: c.color_red },
        { pos: c.stop_orange, col: c.color_orange },
        { pos: c.stop_yellow, col: c.color_yellow },
        { pos: c.stop_green, col: c.color_green },
        { pos: 1.0, col: c.color_cyan },
      ];

      for (let i = 0; i < stops.length - 1; i++) {
        if (socPct >= stops[i].pos && socPct <= stops[i+1].pos) {
          const f = (socPct - stops[i].pos) / Math.max(stops[i+1].pos - stops[i].pos, 1e-6);
          return this._lerpColor(stops[i].col, stops[i+1].col, f);
        }
      }
      return stops[stops.length - 1].col;
    }

    // --- DOM Management ---
    _buildDOM() {
      const c = this._config;
      const R = Number(c.ring_radius || 80);
      const W = Number(c.ring_width || 8);
      const cx = 130;
      const cy = 130 + Number(c.ring_offset_y || 0);
      
      // Omtrek van de cirkel
      const circumference = 2 * Math.PI * R;
      this._circumference = circumference;

      this.shadowRoot.innerHTML = `
        <style>
          :host { display:block; width:100%; height:100%; }
          ha-card { 
            background: ${c.background}; border-radius: ${c.border_radius}; 
            border: ${c.border}; display:flex; align-items:center; 
            justify-content:center; width:100%; height:100%; 
          }
          svg { width:100%; height:auto; max-width: 520px; display:block; }
          text { user-select:none; font-family: Inter, system-ui, sans-serif; }
          .value-text { fill: var(--primary-text-color, #fff); font-weight: 300; }
          .donut-progress { transition: stroke-dashoffset 0.5s ease-out, stroke 0.5s ease; }
        </style>
        <ha-card>
          <svg viewBox="0 0 260 260">
            <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${c.track_color}" stroke-width="${W}" />
            
            <circle id="donut-progress" class="donut-progress" cx="${cx}" cy="${cy}" r="${R}" 
              fill="none" stroke="${c.color_green}" stroke-width="${W}" stroke-linecap="round"
              stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" 
              transform="rotate(-90 ${cx} ${cy})" />

            <text x="${cx}" y="${cy - R - 20}" font-size="${R * 0.35}" fill="var(--secondary-text-color, #aaa)" text-anchor="middle">${c.top_label_text}</text>
            <text id="kwh-text" class="value-text" x="${cx}" y="${cy - R * 0.08}" font-size="${R * 0.30}" text-anchor="middle">0.00 kWh</text>
            <text id="soc-text" class="value-text" x="${cx}" y="${cy + R * 0.40}" font-size="${R * 0.30}" text-anchor="middle">0 %</text>

            <g id="wifi-container"></g>
            <g id="power-container"></g>
          </svg>
        </ha-card>
      `;

      // Cache the elements so we don't query the DOM every update
      this._elements = {
        progressRing: this.shadowRoot.getElementById("donut-progress"),
        kwhText: this.shadowRoot.getElementById("kwh-text"),
        socText: this.shadowRoot.getElementById("soc-text"),
        wifiContainer: this.shadowRoot.getElementById("wifi-container"),
        powerContainer: this.shadowRoot.getElementById("power-container")
      };
    }

    _updateValues() {
      const h = this._hass;
      const c = this._config;
      if (!h || !c.entity) return;

      // 1. Update SoC en kWh
      const rawSoc = h.states[c.entity]?.state ?? "0";
      const soc = this._clamp(parseFloat(rawSoc) || 0, 0, 100);
      const cap = Number(c.cap_kwh || 5.12);
      const kwh = (soc / 100) * cap;

      this._elements.kwhText.textContent = `${kwh.toFixed(2)} kWh`;
      this._elements.socText.textContent = `${soc.toFixed(0)} %`;

      // 2. Update Ring (Animatie via CSS stroke-dashoffset en kleur wissel)
      const offset = this._circumference - (soc / 100) * this._circumference;
      const ringColor = this._getCurrentColor(soc / 100);
      
      this._elements.progressRing.style.strokeDashoffset = offset;
      this._elements.progressRing.style.stroke = ringColor;

      // 3. Update WiFi en Power (Optioneel)
      if (c.wifi_enabled) this._renderWifi();
      if (c.power_enabled) this._renderPower();
    }

    _renderWifi() {
      const we = this._config.wifi_entity;
      const raw = this._hass.states[we]?.state ?? "";
      const val = parseFloat(raw);
      const connected = !isNaN(val);

      if (!connected) {
        this._elements.wifiContainer.innerHTML = ''; 
        return;
      }

      let bars = val >= -50 ? 4 : val >= -60 ? 3 : val >= -70 ? 2 : val >= -85 ? 1 : 0;
      
      // Simpele visualisatie toegevoegd via string (geisoleerd en efficiënt nu de rest clean is)
      const R = Number(this._config.ring_radius || 80);
      const px = 130 + R; 
      const py = 130 + R;
      const color = "#22c55e"; // Groen indien verbonden
      
      let wifiSvg = `<circle cx="${px}" cy="${py}" r="3" fill="${color}" />`;
      if (bars >= 1) wifiSvg += `<path d="M ${px-5} ${py-5} Q ${px} ${py-8} ${px+5} ${py-5}" stroke="${color}" stroke-width="2" fill="none"/>`;
      if (bars >= 2) wifiSvg += `<path d="M ${px-9} ${py-9} Q ${px} ${py-13} ${px+9} ${py-9}" stroke="${color}" stroke-width="2" fill="none"/>`;
      if (bars >= 3) wifiSvg += `<path d="M ${px-13} ${py-13} Q ${px} ${py-18} ${px+13} ${py-13}" stroke="${color}" stroke-width="2" fill="none"/>`;

      this._elements.wifiContainer.innerHTML = wifiSvg;
    }

    _renderPower() {
      const pe = this._config.power_entity;
      const raw = this._hass.states[pe]?.state ?? "";
      const val = parseFloat(raw);

      if (isNaN(val)) {
        this._elements.powerContainer.innerHTML = '';
        return;
      }

      const isUp = val < 0; // Opladen vs Ontladen
      const color = isUp ? "#22c55e" : "#f59e0b";
      const R = Number(this._config.ring_radius || 80);
      const px = 130 - R; 
      const py = 130 + R;
      
      // Rotatie 180 graden afhankelijk van laadrichting
      const arrowPath = isUp 
        ? `M ${px} ${py+8} L ${px} ${py-8} M ${px-4} ${py-4} L ${px} ${py-8} L ${px+4} ${py-4}` 
        : `M ${px} ${py-8} L ${px} ${py+8} M ${px-4} ${py+4} L ${px} ${py+8} L ${px+4} ${py+4}`;

      this._elements.powerContainer.innerHTML = `
        <path d="${arrowPath}" stroke="${color}" stroke-width="3" stroke-linecap="round" fill="none" />
        <text x="${px + 12}" y="${py}" font-size="12" fill="#fff" dominant-baseline="middle">${Math.abs(val).toFixed(0)} W</text>
      `;
    }
  }

  // Registreer kaart editor en custom element
  class BatteryDonutCardEditor extends HTMLElement { setConfig(c) { this._config = c; } }
  if (!customElements.get("battery-donut-card-editor")) customElements.define("battery-donut-card-editor", BatteryDonutCardEditor);
  if (!customElements.get(TAG)) customElements.define(TAG, BatteryDonutCard);

  // Home Assistant Custom Card Registratie
  window.customCards = window.customCards || [];
  if (!window.customCards.some(c => c.type === TAG)) {
    window.customCards.push({
      type: TAG,
      name: "Battery Donut Card",
      description: "Optimized battery donut for Home Assistant.",
      preview: true,
    });
  }
})();
