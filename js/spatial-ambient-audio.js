// js/spatial-ambient-audio.js
// Procedural Web Audio API soundscape for Leola's Library 3D World
// Balanced audio design:
// 1. Lake Michigan gentle water lapping and ocean swells (no harsh high-pass wind noise)
// 2. Clear, punchy footsteps on Boardwalk, Path, and Interior floor
// 3. Crisp, audible bird chirping & seagull calls in the sky
// 4. City traffic car engine passes & low tire hum
// 5. Playground children voices/chimes & swing creaking
// 6. Barnaby the squirrel/chipmunk squeaks & chittering

export class SpatialAmbientAudio {
  constructor(world) {
    this.world = world;
    this.ctx = null;
    this.isMuted = false;
    this.isUnlocked = false;

    // Master nodes
    this.masterGain = null;

    // Continuous Ocean/Water swell
    this.oceanGain = null;
    this.oceanFilter = null;
    this.oceanNoiseNode = null;
    this.waterLapTimer = 2.0;

    // Continuous City Traffic
    this.trafficGain = null;
    this.trafficFilter = null;
    this.trafficNoiseNode = null;
    this.carPassTimer = 3.0; // Periodic engine pass-by sound

    // Playground
    this.playgroundGain = null;
    this.nextSwingCreak = 1.0;
    this.nextChildLaugh = 2.5;

    // Birds & Seagulls
    this.birdsGain = null;
    this.nextSeagullCall = 2.0;
    this.nextSongbirdChirp = 1.2;

    // Footsteps pacing
    this.footstepTimer = 0;
    this.footstepInterval = 0.36; // seconds between steps

    // Squirrel / Chipmunk
    this.squirrelPos = { x: -4.2, z: 16.5 };
    this.lastSquirrelSoundTime = 0;

    this.bindUnlock();
  }

  bindUnlock() {
    const unlockHandler = () => {
      this.ensureContext();
      if (this.ctx && this.ctx.state === 'running') {
        window.removeEventListener('pointerdown', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
      }
    };
    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.masterGain && this.ctx) {
      this.buildAudioGraph();
      this.isUnlocked = true;
    }
    return this.ctx;
  }

  buildAudioGraph() {
    const ctx = this.ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.95, ctx.currentTime);
    this.masterGain.connect(ctx.destination);

    // 1. Ocean Waves Generator
    // Subdued, warm pink-brown noise filtered through deep lowpass (160 Hz - 280 Hz)
    // Avoids "wind rushing/gushing" sound by cutting off all high and mid hiss
    this.oceanGain = ctx.createGain();
    this.oceanGain.gain.setValueAtTime(0.005, ctx.currentTime);
    this.oceanFilter = ctx.createBiquadFilter();
    this.oceanFilter.type = 'lowpass';
    this.oceanFilter.frequency.setValueAtTime(220, ctx.currentTime);
    this.oceanFilter.Q.setValueAtTime(1.0, ctx.currentTime);

    const oceanNoiseBuffer = this.createSoftBrownNoiseBuffer(6.0);
    this.oceanNoiseNode = ctx.createBufferSource();
    this.oceanNoiseNode.buffer = oceanNoiseBuffer;
    this.oceanNoiseNode.loop = true;
    this.oceanNoiseNode.connect(this.oceanFilter);
    this.oceanFilter.connect(this.oceanGain);
    this.oceanGain.connect(this.masterGain);
    this.oceanNoiseNode.start();

    // 2. City Traffic Rumble (continuous background road hum, 80 Hz)
    this.trafficGain = ctx.createGain();
    this.trafficGain.gain.setValueAtTime(0.005, ctx.currentTime);
    this.trafficFilter = ctx.createBiquadFilter();
    this.trafficFilter.type = 'lowpass';
    this.trafficFilter.frequency.setValueAtTime(95, ctx.currentTime);
    this.trafficFilter.Q.setValueAtTime(1.5, ctx.currentTime);

    const trafficNoiseBuffer = this.createSoftBrownNoiseBuffer(6.0);
    this.trafficNoiseNode = ctx.createBufferSource();
    this.trafficNoiseNode.buffer = trafficNoiseBuffer;
    this.trafficNoiseNode.loop = true;
    this.trafficNoiseNode.connect(this.trafficFilter);
    this.trafficFilter.connect(this.trafficGain);
    this.trafficGain.connect(this.masterGain);
    this.trafficNoiseNode.start();

    // 3. Playground Master Gain
    this.playgroundGain = ctx.createGain();
    this.playgroundGain.gain.setValueAtTime(0.85, ctx.currentTime);
    this.playgroundGain.connect(this.masterGain);

    // 4. Birds & Seagulls Master Gain
    this.birdsGain = ctx.createGain();
    this.birdsGain.gain.setValueAtTime(0.9, ctx.currentTime);
    this.birdsGain.connect(this.masterGain);
  }

  // Pure warm brown noise with steep roll-off to eliminate hiss/wind rush
  createSoftBrownNoiseBuffer(seconds) {
    const ctx = this.ctx;
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Single-pole low-pass integrator for true brown noise
      lastOut = (lastOut + 0.025 * white) / 1.025;
      data[i] = lastOut * 1.8;
    }
    return buffer;
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.95, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Main per-frame update loop called from world.animate()
   */
  update(camera, playerPos, dt, time) {
    if (!this.ctx || this.isMuted) return;
    if (this.ctx.state === 'suspended') return;

    const pX = playerPos?.x ?? camera.position.x;
    const pZ = playerPos?.z ?? camera.position.z;
    const isOutside = (this.world.phase === 'outside' || this.world.phase === 'park' || pZ > 4.5);

    // 1. UPDATE OCEAN WAVES & BOAT WATER LAPPING
    if (this.oceanGain && this.oceanFilter) {
      if (!isOutside) {
        this.oceanGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.2);
      } else {
        // Distance to waterfront (boardwalk at z ~ 25..28)
        const waterProximity = THREE_clamp(1.0 - (Math.abs(pZ - 27) / 40), 0, 1);
        const swell = 0.5 + 0.5 * Math.sin(time * 0.95);
        // Kept gentle so it doesn't drown out other sounds (max volume ~0.025)
        const targetVol = (0.005 + 0.020 * swell) * waterProximity;
        this.oceanGain.gain.setTargetAtTime(Math.max(0.001, targetVol), this.ctx.currentTime, 0.15);
        this.oceanFilter.frequency.setTargetAtTime(140 + swell * 110, this.ctx.currentTime, 0.2);

        // Water lapping against boats / pier
        this.waterLapTimer -= dt;
        if (this.waterLapTimer <= 0 && waterProximity > 0.25) {
          this.playWaterLap(waterProximity);
          this.waterLapTimer = 3.0 + Math.random() * 3.5;
        }
      }
    }

    // 2. UPDATE CITY TRAFFIC HUM & PASSING CAR ENGINES
    if (this.trafficGain) {
      if (!isOutside) {
        this.trafficGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.2);
      } else {
        const distToStreet = Math.abs(pX - (-26));
        const streetProximity = THREE_clamp(1.0 - (distToStreet / 42), 0, 1);
        const trafficVol = 0.04 * streetProximity;
        this.trafficGain.gain.setTargetAtTime(Math.max(0.002, trafficVol), this.ctx.currentTime, 0.2);

        // Periodic distinct car engine driving by on the road
        this.carPassTimer -= dt;
        if (this.carPassTimer <= 0) {
          this.playCarPassing(Math.max(0.3, streetProximity));
          this.carPassTimer = 5.0 + Math.random() * 5.0;
        }
      }
    }

    // 3. UPDATE PLAYGROUND SWINGS & CHILDREN
    if (this.playgroundGain) {
      // Swings at world coordinates (~39, 0, -4)
      const distToPlayground = Math.hypot(pX - 39, pZ - (-4));
      const playProximity = THREE_clamp(1.0 - (distToPlayground / 55), 0, 1);

      if (playProximity > 0.05 && isOutside) {
        this.nextSwingCreak -= dt;
        if (this.nextSwingCreak <= 0) {
          this.playSwingCreak(playProximity);
          this.nextSwingCreak = 2.0 + Math.random() * 2.0;
        }

        this.nextChildLaugh -= dt;
        if (this.nextChildLaugh <= 0) {
          this.playChildChime(playProximity);
          this.nextChildLaugh = 4.5 + Math.random() * 4.5;
        }
      }
    }

    // 4. BIRDS & SEAGULLS IN SKY
    if (isOutside) {
      // Seagulls near the water or looking up
      this.nextSeagullCall -= dt;
      if (this.nextSeagullCall <= 0) {
        const isLookingUp = (camera.rotation.x < -0.08);
        const nearWater = (pZ > 12);
        if (nearWater || isLookingUp || Math.random() < 0.6) {
          this.playSeagullCall(isLookingUp ? 1.0 : 0.75);
        }
        this.nextSeagullCall = 3.5 + Math.random() * 4.0;
      }

      // Songbirds in courtyard / near trees
      this.nextSongbirdChirp -= dt;
      if (this.nextSongbirdChirp <= 0) {
        this.playSongbirdChirp();
        this.nextSongbirdChirp = 2.8 + Math.random() * 3.2;
      }
    }

    // 5. SQUIRREL / CHIPMUNK PROXIMITY CHATTER
    if (isOutside) {
      const distToSquirrel = Math.hypot(pX - this.squirrelPos.x, pZ - this.squirrelPos.z);
      if (distToSquirrel < 5.0 && time - this.lastSquirrelSoundTime > 4.5) {
        this.playSquirrelChitter(0.85);
        this.lastSquirrelSoundTime = time;
      }
    }

    // 6. BOARDWALK & PATH FOOTSTEPS
    if (this.world.isWalking) {
      this.footstepTimer -= dt;
      if (this.footstepTimer <= 0) {
        this.footstepTimer = this.footstepInterval;
        this.playFootstepForPosition(pX, pZ, isOutside);
      }
    } else {
      this.footstepTimer = 0.04;
    }
  }

  /**
   * Footsteps: Distinct, punchy audio
   * - Boardwalk (wood hollow clop): z in [21, 29]
   * - Flagstone/Cobblestone (crisp tap): park courtyard
   * - Library interior: soft floor tap
   */
  playFootstepForPosition(pX, pZ, isOutside) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const onBoardwalk = isOutside && (pZ >= 21.0 && pZ <= 29.0 && Math.abs(pX) <= 22);

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (onBoardwalk) {
      // Crisp wooden plank hollow thud
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(145 + Math.random() * 30, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(260, now);
      filter.Q.setValueAtTime(2.2, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (isOutside) {
      // Crisp stone/flagstone footstep
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240 + Math.random() * 40, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.06);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(580, now);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.09);
    } else {
      // Interior polished wood floor
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110 + Math.random() * 20, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);

      gain.gain.setValueAtTime(0.10, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  }

  /**
   * Passing car engine on the city street (doppler pitch shift)
   */
  playCarPassing(intensity = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const duration = 2.4;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Engine RPM glide from approach to fade (120 Hz -> 85 Hz)
    osc.frequency.setValueAtTime(125, now);
    osc.frequency.exponentialRampToValueAtTime(82, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, now);

    const vol = 0.045 * intensity;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.9);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  /**
   * Barnaby the Squirrel / Chipmunk playful chitter & squeaks
   */
  playSquirrelChitter(intensity = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const chirpCount = 4 + Math.floor(Math.random() * 2);
    for (let i = 0; i < chirpCount; i++) {
      const delay = i * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const startFreq = 2600 + Math.random() * 600;
      const peakFreq = startFreq + 1000;
      osc.frequency.setValueAtTime(startFreq, now + delay);
      osc.frequency.linearRampToValueAtTime(peakFreq, now + delay + 0.022);
      osc.frequency.exponentialRampToValueAtTime(startFreq - 300, now + delay + 0.05);

      const vol = 0.09 * intensity;
      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.052);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.06);
    }
  }

  /**
   * Seagull call: authentic frequency slide (glide up then down)
   */
  playSeagullCall(intensity = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    [0, 0.38].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const baseF = idx === 0 ? 1350 : 1520;
      osc.frequency.setValueAtTime(baseF, now + offset);
      osc.frequency.linearRampToValueAtTime(baseF + 520, now + offset + 0.11);
      osc.frequency.exponentialRampToValueAtTime(baseF - 320, now + offset + 0.35);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, now + offset);

      const vol = 0.07 * intensity * (idx === 0 ? 0.85 : 1.0);
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.linearRampToValueAtTime(vol, now + offset + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.36);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.birdsGain || this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.38);
    });
  }

  /**
   * Songbird chirp (sweet melodic warble in the trees)
   */
  playSongbirdChirp() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const pattern = [[2400, 2800], [2900, 2500], [2700, 3100]];
    pattern.forEach(([f1, f2], idx) => {
      const t = now + idx * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f1, t);
      osc.frequency.linearRampToValueAtTime(f2, t + 0.045);

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);

      osc.connect(gain);
      gain.connect(this.birdsGain || this.masterGain);
      osc.start(t);
      osc.stop(t + 0.07);
    });
  }

  /**
   * Playground swing rhythmic creak
   */
  playSwingCreak(proximity = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.linearRampToValueAtTime(1160, now + 0.07);
    osc.frequency.linearRampToValueAtTime(890, now + 0.16);

    const vol = 0.06 * proximity;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.20);

    osc.connect(gain);
    gain.connect(this.playgroundGain || this.masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * Distant playful bell/laughter chimes from the children in the playground
   */
  playChildChime(proximity = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const tones = [1046.5, 1318.5, 1567.98];
    tones.forEach((freq, idx) => {
      const t = now + idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const vol = 0.045 * proximity;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.playgroundGain || this.masterGain);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  /**
   * Gentle boat water lap & wooden dock creak
   */
  playWaterLap(proximity = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.32);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(190, now);

    const vol = 0.055 * proximity;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }
}

function THREE_clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
