import { stateManager } from './state-manager.js';

export class CardHandoff {
  constructor() {
    this.form = document.getElementById('card-form');
    this.container = document.getElementById('enrollment-flow');
    this.init();
  }

  async init() {
    await stateManager.ready;
    this.renderCardState(stateManager.snapshot());

    stateManager.addEventListener('change', (e) => {
      this.renderCardState(e.detail.state);
    });

    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  renderCardState(state) {
    if (!this.container) return;

    if (state.guest?.cardId && state.guest?.name) {
      this.container.innerHTML = `
        <div class="library-card-issued" aria-live="polite">
          <h3 style="margin: 0 0 8px 0; color: var(--clay-wood-dark);">Official Member Card</h3>
          <p style="font-size: 1.25rem; font-weight: bold; margin: 4px 0; color: var(--clay-wood-light);">
            ${this.escapeHtml(state.guest.name)}
          </p>
          <p style="font-family: monospace; font-size: 0.95rem; margin: 4px 0; color: #666;">
            ID: <strong>${state.guest.cardId}</strong>
          </p>
          <div class="card-stamp">Active Reader &bull; Good Standing</div>
          <div style="margin-top: 14px;">
            <button id="btn-reissue" class="clay-btn" style="font-size: 0.85rem; padding: 6px 14px; min-height: 36px;">
              Update Member Details
            </button>
          </div>
        </div>
      `;

      document.getElementById('btn-reissue')?.addEventListener('click', () => {
        this.renderForm(state.guest.name);
      });
    }
  }

  renderForm(currentName = '') {
    if (!this.container) return;
    this.container.innerHTML = `
      <form id="card-form">
        <label for="guest-name" style="display: block; margin-bottom: 6px; font-weight: bold;">Your Name</label>
        <input type="text" id="guest-name" class="clay-input" value="${this.escapeHtml(currentName)}" placeholder="e.g. Eleanor Vance" required>
        <button type="submit" class="clay-btn">Create My Library Card</button>
      </form>
    `;
    this.form = document.getElementById('card-form');
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    document.getElementById('guest-name')?.focus();
  }

  async handleSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('guest-name');
    const name = nameInput?.value?.trim();
    if (!name) return;

    const cardId = `LL-${Date.now().toString(36).toUpperCase()}`;
    const issuedAt = new Date().toISOString();

    await stateManager.patch({
      guest: { name, cardId, issuedAt },
      location: { route: 'index.html', view: 'inside', updatedAt: issuedAt }
    });

    const bubble = document.getElementById('leola-guidance');
    if (bubble) {
      const bubbleSpan = bubble.querySelector('.bubble-text') || bubble;
      bubbleSpan.textContent = `Wonderful to meet you, ${name}! Your card is stamped and ready.`;
    }
  }

  escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));
  }
}

new CardHandoff();
