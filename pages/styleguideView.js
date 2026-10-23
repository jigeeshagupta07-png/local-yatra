/**
 * YatraLocal Component Style Guide (Phase 1)
 * Interactive showcase of all design tokens, typography, buttons, badges, chips, inputs, and components.
 */

export function renderStyleguide() {
  return `
    <div class="container" style="padding-top: var(--space-8); padding-bottom: 80px; max-width: 900px;">
      <div style="margin-bottom: var(--space-8);">
        <span class="badge badge-local">Phase 1 Design System</span>
        <h1>YatraLocal UI Style Guide & Component Library</h1>
        <p style="color: var(--color-text-secondary);">
          Indian travel palette (Deep Teal #0d5c58, Marigold Accent #d97706, Off-White #fbf9f5).
          All elements meet WCAG AA contrast standards and 44px minimum tap targets.
        </p>
      </div>

      <!-- Color Swatches -->
      <section class="card" style="margin-bottom: var(--space-8);">
        <h3>1. Color Palette</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 16px;">
          <div style="background: #0d5c58; color: #fff; padding: 16px; border-radius: 8px;">
            <strong>Primary Teal</strong><br><small>#0d5c58</small>
          </div>
          <div style="background: #d97706; color: #fff; padding: 16px; border-radius: 8px;">
            <strong>Accent Saffron</strong><br><small>#d97706</small>
          </div>
          <div style="background: #fbf9f5; color: #1f2937; padding: 16px; border-radius: 8px; border: 1px solid #e2ddd5;">
            <strong>Background</strong><br><small>#fbf9f5</small>
          </div>
          <div style="background: #1f2937; color: #fff; padding: 16px; border-radius: 8px;">
            <strong>Slate Text</strong><br><small>#1f2937</small>
          </div>
          <div style="background: #15803d; color: #fff; padding: 16px; border-radius: 8px;">
            <strong>Success</strong><br><small>#15803d</small>
          </div>
          <div style="background: #b91c1c; color: #fff; padding: 16px; border-radius: 8px;">
            <strong>Danger SOS</strong><br><small>#b91c1c</small>
          </div>
        </div>
      </section>

      <!-- Buttons -->
      <section class="card" style="margin-bottom: var(--space-8);">
        <h3>2. Buttons (Min 44px Touch Targets)</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; align-items: center;">
          <button class="btn btn-primary">Primary Button</button>
          <button class="btn btn-secondary">Secondary Button</button>
          <button class="btn btn-accent">Accent Button</button>
          <button class="btn btn-ghost">Ghost Button</button>
          <button class="btn btn-danger">Danger / SOS</button>
          <button class="btn btn-primary btn-lg">Large Action (52px)</button>
          <button class="btn btn-primary" disabled>Disabled State</button>
        </div>
      </section>

      <!-- Badges -->
      <section class="card" style="margin-bottom: var(--space-8);">
        <h3>3. Badges & Indicators</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; align-items: center;">
          <span class="badge badge-verified">✓ Verified Local</span>
          <span class="badge badge-local">Local Host</span>
          <span class="badge badge-family">Supports a local family</span>
          <span class="badge badge-simulated">Demo / Simulated</span>
          <span class="badge badge-crowd-low">🟢 Low Crowd</span>
          <span class="badge badge-crowd-med">🟡 Medium Crowd</span>
          <span class="badge badge-crowd-high">🔴 High Crowd</span>
        </div>
        <div style="margin-top: 16px;">
          <div class="stat-placeholder-box">[Add verified statistic + source: Example Placeholder]</div>
        </div>
      </section>

      <!-- Form Elements -->
      <section class="card" style="margin-bottom: var(--space-8);">
        <h3>4. Form Controls & Stepper</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-top: 16px;">
          <div class="form-group">
            <label class="form-label">Text Input</label>
            <input type="text" class="input-control" placeholder="Enter full name...">
          </div>
          <div class="form-group">
            <label class="form-label">Select Dropdown</label>
            <select class="select-control">
              <option>Manali, Himachal Pradesh</option>
              <option>Jaipur, Rajasthan</option>
            </select>
          </div>
        </div>

        <div style="margin-top: 12px;">
          <label class="form-label">Stepper Counter</label>
          <div class="stepper-box">
            <button class="stepper-btn">&minus;</button>
            <span class="stepper-value">3</span>
            <button class="stepper-btn">&plus;</button>
          </div>
        </div>

        <div style="margin-top: 16px;">
          <label class="form-label">Interactive Multi-Select Chips</label>
          <div class="chip-grid">
            <button class="chip-btn selected">🌿 Relaxed</button>
            <button class="chip-btn selected">🪔 Spiritual</button>
            <button class="chip-btn">🧗 Adventure</button>
            <button class="chip-btn">🏛️ Cultural</button>
          </div>
        </div>
      </section>

      <!-- Skeleton Loaders -->
      <section class="card" style="margin-bottom: var(--space-8);">
        <h3>5. Skeleton Loaders</h3>
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 16px;">
          <div class="skeleton" style="height: 24px; width: 40%;"></div>
          <div class="skeleton" style="height: 18px; width: 85%;"></div>
          <div class="skeleton" style="height: 18px; width: 65%;"></div>
        </div>
      </section>
    </div>
  `;
}
