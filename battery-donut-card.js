/**
 * Battery Donut Card - Full Optimized Version
 * Alles behouden: 140 segmenten, WiFi-bars, Power-pijl, kWh-uitlezing.
 * Geoptimaliseerd voor stabiliteit op oudere tablets.
 */

const TAG = "battery-donut-card";
const VERSION = "1.3.0";

class BatteryDonutCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._lastUpdate = 0;
  }

  set hass(hass) {
    const now = Date.now();
    // BELANGRIJK: Blokkeert updates sneller dan 2 seconden om CPU rust te geven
    if (this._lastUpdate && now - this._lastUpdate < 2000) return;
    
    this._hass = hass;
    this._lastUpdate = now;
    this._render();
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Je moet een batterij-entiteit opgeven.");
    }
    this._config = config;
  }

  _render() {
    if (!this._hass || !this._config) return;

    const conf = this._config;
    const stateObj = this._hass.states[conf.entity];
    
    if (!stateObj) {
      this.shadowRoot.innerHTML = `<ha-card>Entiteit niet gevonden: ${conf.entity}</ha-card>`;
      return;
    }

    const soc = Math.round(stateObj.state);
    const kwh = conf.kwh_entity ? this._hass.states[conf.kwh_entity]?.state || '0' : '0';
    const power = conf.power_entity ? parseFloat(this._hass.states[conf.power_entity]?.state || 0) : 0;
    const wifi = conf.wifi_entity ? parseInt(this._hass.states[conf.wifi_entity]?.state || 0) : 0;

    // Kleurbepaling (Hetzelfde als origineel)
    let activeColor = "#4caf50";
    if (soc < 20) activeColor = "#f44336";
    else if (soc < 50) activeColor = "#ff9800";

    // De 140 segmenten genereren
    let segmentsHTML = "";
    const totalSegments = 140;
    const activeSegments = Math.round((soc / 100) * totalSegments);

    for (let i = 0; i < totalSegments; i++) {
      // Berekening van hoek voor elk streepje
      const angle = (i * (360 / totalSegments) - 90) * (Math.PI / 180);
      const rOut = 45; // Buitenstraal
      const rIn = 35;  // Binnenstraal
      
      const x1 = 50 + rOut * Math.cos(angle);
      const y1 = 50 + rOut * Math.sin(angle);
      const x2 = 50 + rIn * Math.cos(angle);
      const y2 = 50 + rIn * Math.sin(angle);

      const color = i < activeSegments ? activeColor : "rgba(255,255,255,0.1)";
      segmentsHTML += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" />`;
    }

    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          background: var(--ha-card-background, var(--card-background-color, #1c1c1c));
          border-radius: var(--ha-card-border-radius, 15px);
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          color: white;
          border: var(--ha-card-border, 1px solid #333);
        }
        .canvas-container {
          position: relative;
          width: 100%;
          max-width: 280px;
        }
        svg {
          width: 100%;
          height: auto;
          display: block;
        }
        .info-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          width: 100%;
        }
        .soc-value {
          font-size: 2.5em;
          font-weight: bold;
          line-height: 1em;
        }
        .kwh-value {
          font-size: 1.1em;
          color: #aaa;
          margin-top: 4px;
        }
        .wifi-container {
          display: flex;
          justify-content: center;
          gap: 3px;
          margin-top: 10px;
        }
        .wifi-bar {
          width: 4px;
          border-radius: 1px;
          background: rgba(255,255,255,0.1);
        }
        .wifi-bar.active {
          background: ${activeColor};
        }
        .arrow {
          fill: ${activeColor};
          transition: transform 0.5s ease;
        }
      </style>
      
      <ha-card>
        <div class="canvas-container">
          <svg viewBox="0 0 100 100">
            ${segmentsHTML}
            
            <path d="M46,30 L54,30 L50,18 Z" class="arrow" 
                  transform="${power >= 0 ? 'rotate(0, 50, 50)' : 'rotate(180, 50, 50)'}"
                  style="display: ${power === 0 ? 'none' : 'block'};" />
          </svg>
          
          <div class="info-overlay">
            <div class="soc-value">${soc}%</div>
            <div class="kwh-value">${kwh} kWh</div>
            
            <div class="wifi-container">
              <div class="wifi-bar ${wifi > 5 ? 'active' : ''}" style="height: 6px;"></div>
              <div class="wifi-bar ${wifi > 30 ? 'active' : ''}" style="height: 10px;"></div>
              <div class="wifi-bar ${wifi > 60 ? 'active' : ''}" style="height: 14px;"></div>
              <div class="wifi-bar ${wifi > 85 ? 'active' : ''}" style="height: 18px;"></div>
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

  getCardSize() { return 3; }
}

customElements.define(TAG, BatteryDonutCard);

// Registratie
window.customCards = window.customCards || [];
window.customCards = window.customCards.filter(c => c.type !== TAG);
window.customCards.push({
  type: TAG,
  name: "Battery Donut Full v1.3",
  description: "De volledige geoptimaliseerde versie met 140 segmenten en WiFi.",
  preview: true
});
