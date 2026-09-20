import { stateManager } from './state-manager.js';

export class AppRouter {
  constructor() {
    this.initTransitions();
    this.hydrateState();
    this.initGlobalControls();
  }

  initTransitions() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download') || link.getAttribute('href').startsWith('#')) return;
      const url = new URL(link.href, window.location.origin);
      if (url.origin !== window.location.origin) return;

      stateManager.patch({ location: { route: url.pathname, view: 'transitioning' } });

      if (document.startViewTransition) {
        e.preventDefault();
        document.startViewTransition(async () => {
          window.location.href = link.href;
        });
      }
    });
  }

  async hydrateState() {
    await stateManager.ready;
    const state = stateManager.snapshot();
    this.updateGuidance(state);

    stateManager.addEventListener('change', (e) => {
      this.updateGuidance(e.detail.state);
    });
  }

  updateGuidance(state) {
    const bubble = document.getElementById('leola-guidance');
    if (bubble) {
      const text = state?.guest?.name
        ? `Welcome back, ${state.guest.name}. Come inside, and I’ll help you find your next chapter.`
        : 'Welcome. Come inside, and I’ll help you find your next chapter.';
      const bubbleSpan = bubble.querySelector('.bubble-text');
      if (bubbleSpan) {
        bubbleSpan.textContent = text;
      } else {
        bubble.textContent = text;
      }
    }
  }

  initGlobalControls() {
    const voiceBtn = document.getElementById('btn-voice-toggle');
    const motionBtn = document.getElementById('btn-motion-toggle');

    if (voiceBtn) {
      voiceBtn.addEventListener('click', async () => {
        const current = stateManager.snapshot().settings?.sound ?? true;
        const next = !current;
        await stateManager.patch({ settings: { ...stateManager.snapshot().settings, sound: next } });
        voiceBtn.textContent = next ? 'Voice on' : 'Voice off';
      });
    }

    if (motionBtn) {
      motionBtn.addEventListener('click', async () => {
        const current = stateManager.snapshot().settings?.reducedMotion ?? false;
        const next = !current;
        await stateManager.patch({ settings: { ...stateManager.snapshot().settings, reducedMotion: next } });
        motionBtn.textContent = next ? 'Full motion' : 'Less motion';
      });
    }
  }
}

new AppRouter();
