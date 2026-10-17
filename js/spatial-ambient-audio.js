// js/spatial-ambient-audio.js
// Procedural Web Audio API soundscape for Leola's Library 3D World
// Provides:
// 1. Lake Michigan ocean waves & boat water lapping
// 2. Boardwalk & stone path footsteps
// 3. Playground swings creaking & playful laughter/tones
// 4. Seagull calls & sky bird chirping
// 5. City traffic hum & distant car passing
// 6. Barnaby the squirrel/chipmunk chittering & squeaks

export class SpatialAmbientAudio {
  constructor(world) {
    this.world = world;
    this.ctx = null;
    this.isMuted = false;
    this.isUnlocked = false;

    // Node references for continuous sound generators
    this.masterGain = null;

    // Lake & Waves
    this.oceanGain = null;
    this.oceanFilter = null;
    this.oceanNoiseNode = null;
    this.waterLapTimer = 0;

    // City Traffic
    this.trafficGain = null;
    this.trafficFilter = null;
    this.trafficNoiseNode = null;

    // Playground Ambience
    this.playgroundGain = null;
    this.nextSwingCreak = 0;
    this.nextChildLaugh = 0;

    // Birds & Seagulls
    this.birdsGain = null;
    this.nextSeagullCall = 3.0; // seconds
    this.nextSongbirdChirp = 1.5;

    // Footstep pacing
    this.footstepTimer = 0;
    this.footstepInterval = 0.38; // seconds between steps

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
    this.masterGain.gain.setValueAtTime(0.85, ctx.currentTime);
    this.masterGain.connect(ctx.destination);

    // 1. Ocean Waves Generator (Pink noise buffer filtered through low-pass swell)
    this.oceanGain = ctx.createGain();
    this.oceanGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this.oceanFilter = ctx.createBiquadFilter();
    this.oceanFilter.type = 'lowpass';
    this.oceanFilter.frequency.setValueAtTime(420, ctx.currentTime);
    this.oceanFilter.Q.setValueAtTime(1.8, ctx.currentTime);

    const noiseBuffer = this.createNoiseBuffer(5.0); // 5-sec looping pinkish noise
    this.oceanNoiseNode = ctx.createBufferSource();
    this.oceanNoiseNode.buffer = noiseBuffer;
    this.oceanNoiseNode.loop = true;
    this.oceanNoiseNode.connect(this.oceanFilter);
    this.oceanFilter.connect(this.oceanGain);
    this.oceanGain.connect(this.masterGain);
    this.oceanNoiseNode.start();

    // 2. City Traffic Generator (Low rumble through 110Hz filter)
    this.trafficGain = ctx.createGain();
    this.trafficGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this.trafficFilter = ctx.createBiquadFilter();
    this.trafficFilter.type = 'lowpass';
    this.trafficFilter.frequency.setValueAtTime(140, ctx.currentTime);
    this.trafficFilter.Q.setValueAtTime(2.2, ctx.currentTime);

    const trafficNoise = ctx.createBufferSource();
    trafficNoise.buffer = noiseBuffer;
    trafficNoise.loop = true;
    trafficNoise.connect(this.trafficFilter);
    this.trafficFilter.connect(this.trafficGain);
    this.trafficGain.connect(this.masterGain);
    trafficNoise.start();

    // 3. Playground Master Gain
    this.playgroundGain = ctx.createGain();
    this.playgroundGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this.playgroundGain.connect(this.masterGain);

    // 4. Birds & Seagulls Master Gain
    this.birdsGain = ctx.createGain();
    this.birdsGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this.birdsGain.connect(this.masterGain);
  }

  createNoiseBuffer(seconds) {
    const ctx = this.ctx;
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.85, this.ctx.currentTime, 0.05);
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
    // Waterfront harbor is at z in [22, 60], lake center around z = 35..60, x around 10..80
    if (this.oceanGain && this.oceanFilter) {
      if (!isOutside) {
        this.oceanGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.2);
      } else {
        // Distance to waterfront / boardwalk (z around 25 to 50)
        const distToWater = Math.max(0, Math.min(60, 24 - pZ)); // Closer when player is near or on boardwalk (z > 20)
        // If player is on boardwalk (z in [22, 35]), water is very close
        const waterProximity = THREE_clamp(1.0 - (Math.abs(pZ - 28) / 38), 0, 1);
        // Ocean swell rhythm (waves break every ~4.2 seconds)
        const swell = 0.5 + 0.5 * Math.sin(time * 1.45);
        const swellVol = 0.04 + 0.12 * swell;
        const targetVol = swellVol * waterProximity;
        this.oceanGain.gain.setTargetAtTime(Math.max(0.002, targetVol), this.ctx.currentTime, 0.15);
        this.oceanFilter.frequency.setTargetAtTime(280 + swell * 360, this.ctx.currentTime, 0.2);

        // Periodic gentle boat wood creak / water lap
        this.waterLapTimer -= dt;
        if (this.waterLapTimer <= 0 && waterProximity > 0.35) {
          this.playWaterLap(waterProximity);
          this.waterLapTimer = 3.5 + Math.random() * 4.0;
        }
      }
    }

    // 2. UPDATE CITY TRAFFIC HUM
    // City street is along x in [-35, -20]
    if (this.trafficGain) {
      if (!isOutside) {
        this.trafficGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.2);
      } else {
        const distToStreet = Math.abs(pX - (-27));
        const streetProximity = THREE_clamp(1.0 - (distToStreet / 45), 0, 1);
        const trafficVol = 0.045 * (streetProximity * streetProximity);
        this.trafficGain.gain.setTargetAtTime(Math.max(0.001, trafficVol), this.ctx.currentTime, 0.25);
      }
    }

    // 3. UPDATE PLAYGROUND SWINGS & CHILDREN LAUGHTER
    // Playground center is at (43, 0.08, -4) with swings at local (-4, 0.24, -0.4) => world (~39, 0, -4)
    if (this.playgroundGain) {
      const distToPlayground = Math.hypot(pX - 39, pZ - (-4));
      const playProximity = THREE_clamp(1.0 - (distToPlayground / 38), 0, 1);

      if (playProximity > 0.08 && isOutside) {
        this.playgroundGain.gain.setTargetAtTime(0.08 * playProximity, this.ctx.currentTime, 0.2);

        this.nextSwingCreak -= dt;
        if (this.nextSwingCreak <= 0) {
          this.playSwingCreak(playProximity);
          this.nextSwingCreak = 1.8 + Math.random() * 1.5;
        }

        this.nextChildLaugh -= dt;
        if (this.nextChildLaugh <= 0) {
          this.playChildChime(playProximity);
          this.nextChildLaugh = 5.0 + Math.random() * 6.0;
        }
      } else {
        this.playgroundGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
      }
    }

    // 4. BIRDS & SEAGULLS IN SKY
    // Seagulls call near water or when player looks up at the sky (pitch < -0.15)
    if (isOutside) {
      this.nextSeagullCall -= dt;
      if (this.nextSeagullCall <= 0) {
        const isLookingUp = (camera.rotation.x < -0.12);
        const nearWater = (pZ > 15);
        if (isLookingUp || nearWater || Math.random() < 0.45) {
          this.playSeagullCall(isLookingUp ? 1.0 : 0.65);
        }
        this.nextSeagullCall = 4.5 + Math.random() * 5.5;
      }

      this.nextSongbirdChirp -= dt;
      if (this.nextSongbirdChirp <= 0) {
        // Near park trees (around x: -5, z: 16 near Barnaby or milestone)
        const nearParkTrees = Math.hypot(pX - (-5), pZ - 16) < 20;
        if (nearParkTrees) {
          this.playSongbirdChirp();
        }
        this.nextSongbirdChirp = 3.0 + Math.random() * 4.0;
      }
    }

    // 5. SQUIRREL / CHIPMUNK PROXIMITY CHATTER
    // If player walks very close to Barnaby the squirrel at (-4.2, 16.5)
    if (isOutside) {
      const distToSquirrel = Math.hypot(pX - this.squirrelPos.x, pZ - this.squirrelPos.z);
      if (distToSquirrel < 3.2 && time - this.lastSquirrelSoundTime > 6.0) {
        this.playSquirrelChitter(0.5);
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
      this.footstepTimer = 0.05; // Ready to step immediately when starting to walk
    }
  }

  /**
   * Footsteps adapted to surface type:
   * - Boardwalk (wood hollow clop): z in [22, 28]
   * - Flagstone/Cobblestone (crisp tap): park walkways & courtyard
   * - Library interior wood floor: z < 4.5
   */
  playFootstepForPosition(pX, pZ, isOutside) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Is player on the Harbor Boardwalk?
    const onBoardwalk = isOutside && (pZ >= 22.0 && pZ <= 28.5 && Math.abs(pX) <= 19);

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (onBoardwalk) {
      // Wood plank boardwalk hollow thud
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120 + Math.random() * 25, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (isOutside) {
      // Stone/gravel path tap
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180 + Math.random() * 30, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.06);
    } else {
      // Interior polished wood floor
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90 + Math.random() * 15, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.06);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.07);
    }
  }

  /**
   * Barnaby the Squirrel / Chipmunk playful chitter & squeaks
   * Triggered on user interaction or proximity
   */
  playSquirrelChitter(intensity = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Series of 3-5 rapid cute squeaks / chitter pulses (2.6 kHz - 4.2 kHz)
    const chirpCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < chirpCount; i++) {
      const delay = i * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const startFreq = 2800 + Math.random() * 800;
      const peakFreq = startFreq + 900;
      osc.frequency.setValueAtTime(startFreq, now + delay);
      osc.frequency.linearRampToValueAtTime(peakFreq, now + delay + 0.025);
      osc.frequency.exponentialRampToValueAtTime(startFreq - 400, now + delay + 0.055);

      const vol = 0.06 * intensity;
      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.055);

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

    // 2-part seagull cry: "Kee-owww"
    [0, 0.42].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const baseF = idx === 0 ? 1450 : 1600;
      osc.frequency.setValueAtTime(baseF, now + offset);
      osc.frequency.linearRampToValueAtTime(baseF + 550, now + offset + 0.12);
      osc.frequency.exponentialRampToValueAtTime(baseF - 350, now + offset + 0.38);

      // Low pass to soften sawtooth into natural cry
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, now + offset);

      const vol = 0.035 * intensity * (idx === 0 ? 0.8 : 1.0);
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.linearRampToValueAtTime(vol, now + offset + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.38);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.birdsGain || this.masterGain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.4);
    });
  }

  /**
   * Songbird chirp (Pip the Bluebird near the milestone)
   */
  playSongbirdChirp() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const notes = [2200, 2650, 2400];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq + 300, t + 0.05);

      gain.gain.setValueAtTime(0.02, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);

      osc.connect(gain);
      gain.connect(this.birdsGain || this.masterGain);
      osc.start(t);
      osc.stop(t + 0.06);
    });
  }

  /**
   * Gentle rhythmic metallic squeak of playground swings
   */
  playSwingCreak(proximity = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Squeak oscillates up and down
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.linearRampToValueAtTime(1180, now + 0.08);
    osc.frequency.linearRampToValueAtTime(920, now + 0.18);

    const vol = 0.028 * proximity;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.playgroundGain || this.masterGain);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  /**
   * Distant playful bell/laughter chimes from the children in the playground
   */
  playChildChime(proximity = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Cheerful triad arpeggio (C6, E6, G6)
    const tones = [1046.5, 1318.5, 1567.98];
    tones.forEach((freq, idx) => {
      const t = now + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      const vol = 0.022 * proximity;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.playgroundGain || this.masterGain);
      osc.start(t);
      osc.stop(t + 0.3);
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

    // Low water slap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);

    const vol = 0.038 * proximity;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.42);
  }
}

function THREE_clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
