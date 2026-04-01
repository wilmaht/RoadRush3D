export class GameAudio {
    constructor() {
        this.ctx = null; this.mg = null; this.sg = null; this.on = false;
        this.beat = 0; this.next = 0; this.tid = null; this.bpm = 150;
        this.engOsc = null; this.engGain = null;
        this.sirenOsc = null; this.sirenGain = null; this.sirenOn = false;
        this.trackIdx = 0; this.trackBars = 0; this.muted = false;
    }
    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.mg = this.ctx.createGain(); this.mg.gain.value = 0.10; this.mg.connect(this.ctx.destination);
        this.sg = this.ctx.createGain(); this.sg.gain.value = 0.3; this.sg.connect(this.ctx.destination);
        this.engGain = this.ctx.createGain(); this.engGain.gain.value = 0.04; this.engGain.connect(this.ctx.destination);
        this.engOsc = this.ctx.createOscillator(); this.engOsc.type = 'sawtooth'; this.engOsc.frequency.value = 60;
        const filt = this.ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 120;
        this.engOsc.connect(filt); filt.connect(this.engGain); this.engOsc.start();
    }
    setEngine(speed) {
        if (this.engOsc) {
            this.engOsc.frequency.value = 40 + speed * 1.2;
            this.engGain.gain.value = 0.02 + speed * 0.0003;
        }
    }
    startSiren(type='police') {
        if (this.sirenOn) return;
        this.init();
        this.sirenOn = true;
        this.sirenType = type;
        this.sirenGain = this.ctx.createGain();
        this.sirenGain.gain.value = 0.06;
        this.sirenGain.connect(this.ctx.destination);
        this.sirenOsc = this.ctx.createOscillator();
        this.sirenOsc.type = 'sine';
        this.sirenOsc.frequency.value = type === 'ambulance' ? 800 : 600;
        this.sirenOsc.connect(this.sirenGain);
        this.sirenOsc.start();
        this._sirenLoop();
    }
    _sirenLoop() {
        if (!this.sirenOn || !this.sirenOsc) return;
        const t = this.ctx.currentTime;
        if (this.sirenType === 'ambulance') {
            // Скорая: высокий wail 800→1200→800, длинный цикл 1с, с паузой
            this.sirenOsc.frequency.setValueAtTime(800, t);
            this.sirenOsc.frequency.linearRampToValueAtTime(1200, t + 0.4);
            this.sirenOsc.frequency.linearRampToValueAtTime(800, t + 0.8);
            this.sirenGain.gain.setValueAtTime(0.05, t);
            this.sirenGain.gain.setValueAtTime(0.05, t + 0.8);
            this.sirenGain.gain.linearRampToValueAtTime(0.01, t + 0.9);
            this.sirenGain.gain.linearRampToValueAtTime(0.05, t + 1.0);
            setTimeout(() => this._sirenLoop(), 1000);
        } else {
            // Полиция: быстрый yelp 600→900→600, 0.6с
            this.sirenOsc.frequency.setValueAtTime(600, t);
            this.sirenOsc.frequency.linearRampToValueAtTime(900, t + 0.3);
            this.sirenOsc.frequency.linearRampToValueAtTime(600, t + 0.6);
            setTimeout(() => this._sirenLoop(), 600);
        }
    }
    stopSiren() {
        this.sirenOn = false;
        if (this.sirenOsc) {
            try { this.sirenOsc.stop(); } catch(e) {}
            this.sirenOsc = null;
        }
        if (this.sirenGain) {
            this.sirenGain.disconnect();
            this.sirenGain = null;
        }
    }
    setSirenVolume(vol) { if (this.sirenGain) this.sirenGain.gain.value = Math.max(0, Math.min(0.15, vol)); }
    startMusic() { if (this.on) return; this.init(); this.on = true; this.beat = 0; this.next = this.ctx.currentTime + 0.05; this._s(); }
    stopMusic() { this.on = false; if (this.tid) clearTimeout(this.tid); this.stopSiren(); }
    stopEngine() { if (this.engGain) this.engGain.gain.value = 0; }
    startEngine() { if (this.engGain && !this.muted) this.engGain.gain.value = 0.02; }
    mute() {
        this.muted = true;
        if (this.ctx) this.ctx.suspend();
    }
    unmute() {
        this.muted = false;
        if (this.ctx) this.ctx.resume();
    }
    toggleMute() {
        if (this.muted) this.unmute(); else this.mute();
        return this.muted;
    }
    _s() { if (!this.on) return; while (this.next < this.ctx.currentTime + 0.1) { this._b(this.next); this.next += 60/this.bpm/2; this.beat++; } this.tid = setTimeout(() => this._s(), 20); }
    _b(t) {
        const b = this.beat % 32;
        // Смена трека каждые 4 бара (128 ударов)
        this.trackBars++;
        if (this.trackBars >= 128) { this.trackBars = 0; this.trackIdx = (this.trackIdx + 1) % 4; }
        // Общий ритм
        if (b%8===0||b%8===4) this._kick(t);
        if (b%2===0) this._hh(t);
        if (b%8===2||b%8===6) this._snare(t);
        // 4 разных трека — разные басовые и мелодии
        const tracks = [
            {bass:[55,55,73.4,73.4,82.4,82.4,73.4,73.4, 49,49,65.4,65.4,82.4,82.4,98,98, 55,55,73.4,73.4,98,98,82.4,82.4, 49,49,55,55,58.3,58.3,65.4,65.4],
             mel:[330,0,392,0,440,0,392,0, 523,0,440,0,392,0,330,0, 294,0,330,0,392,0,440,0, 523,0,587,0,523,0,440,0]},
            {bass:[65.4,65.4,82.4,82.4,98,98,82.4,82.4, 73.4,73.4,98,98,110,110,98,98, 65.4,65.4,73.4,73.4,82.4,82.4,98,98, 55,55,65.4,65.4,73.4,73.4,82.4,82.4],
             mel:[440,0,523,0,587,0,523,0, 659,0,587,0,523,0,440,0, 392,0,440,0,523,0,587,0, 659,0,784,0,659,0,587,0]},
            {bass:[49,49,55,55,65.4,65.4,73.4,73.4, 82.4,82.4,73.4,73.4,65.4,65.4,55,55, 49,49,65.4,65.4,82.4,82.4,98,98, 82.4,82.4,73.4,73.4,65.4,65.4,55,55],
             mel:[523,0,587,0,659,0,784,0, 659,0,587,0,523,0,440,0, 349,0,392,0,440,0,523,0, 587,0,659,0,587,0,523,0]},
            {bass:[73.4,73.4,98,98,110,110,98,98, 82.4,82.4,110,110,130.8,130.8,110,110, 73.4,73.4,82.4,82.4,98,98,110,110, 65.4,65.4,73.4,73.4,82.4,82.4,98,98],
             mel:[262,0,330,0,392,0,440,0, 523,0,440,0,330,0,262,0, 220,0,262,0,330,0,440,0, 523,0,659,0,523,0,440,0]}
        ];
        const trk = tracks[this.trackIdx];
        if(b%2===0) this._bass(t,trk.bass[b]);
        if(b%4===0&&trk.mel[b]>0) this._mel(t,trk.mel[b]);
    }
    _kick(t){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(160,t);o.frequency.exponentialRampToValueAtTime(25,t+0.1);g.gain.setValueAtTime(0.7,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.12);o.connect(g);g.connect(this.mg);o.start(t);o.stop(t+0.12);}
    _snare(t){const n=this.ctx.sampleRate*0.07,buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=this.ctx.createBufferSource();s.buffer=buf;const g=this.ctx.createGain();g.gain.setValueAtTime(0.3,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.07);const f=this.ctx.createBiquadFilter();f.type='highpass';f.frequency.value=1500;s.connect(f);f.connect(g);g.connect(this.mg);s.start(t);s.stop(t+0.07);}
    _hh(t){const n=this.ctx.sampleRate*0.025,buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=this.ctx.createBufferSource();s.buffer=buf;const g=this.ctx.createGain();g.gain.setValueAtTime(0.05,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.02);const f=this.ctx.createBiquadFilter();f.type='highpass';f.frequency.value=7000;s.connect(f);f.connect(g);g.connect(this.mg);s.start(t);s.stop(t+0.025);}
    _bass(t,freq){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='square';o.frequency.value=freq;g.gain.setValueAtTime(0.12,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.15);const f=this.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=180;o.connect(f);f.connect(g);g.connect(this.mg);o.start(t);o.stop(t+0.15);}
    _mel(t,freq){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='square';o.frequency.value=freq;g.gain.setValueAtTime(0.05,t);g.gain.setValueAtTime(0.05,t+0.08);g.gain.exponentialRampToValueAtTime(0.001,t+0.2);o.connect(g);g.connect(this.mg);o.start(t);o.stop(t+0.2);}
    coin(){this.init();const t=this.ctx.currentTime;[880,1320,1760].forEach((f,i)=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0.2,t+i*0.04);g.gain.exponentialRampToValueAtTime(0.001,t+i*0.04+0.12);o.connect(g);g.connect(this.sg);o.start(t+i*0.04);o.stop(t+i*0.04+0.12);});}
    nearMiss(){this.init();const t=this.ctx.currentTime;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(600,t);o.frequency.exponentialRampToValueAtTime(1200,t+0.08);g.gain.setValueAtTime(0.15,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.1);o.connect(g);g.connect(this.sg);o.start(t);o.stop(t+0.1);}
    crash(){this.init();const t=this.ctx.currentTime;const n=this.ctx.sampleRate*0.6,buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(n*0.15));const s=this.ctx.createBufferSource();s.buffer=buf;const g=this.ctx.createGain();g.gain.setValueAtTime(0.6,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.6);s.connect(g);g.connect(this.sg);s.start(t);const o=this.ctx.createOscillator(),g2=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(15,t+0.4);g2.gain.setValueAtTime(0.6,t);g2.gain.exponentialRampToValueAtTime(0.001,t+0.4);o.connect(g2);g2.connect(this.sg);o.start(t);o.stop(t+0.4);}
    lane(){this.init();const t=this.ctx.currentTime;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(300,t);o.frequency.exponentialRampToValueAtTime(500,t+0.04);g.gain.setValueAtTime(0.08,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.05);o.connect(g);g.connect(this.sg);o.start(t);o.stop(t+0.05);}
    biome(){this.init();const t=this.ctx.currentTime;[523,659,784].forEach((f,i)=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0.1,t+i*0.06);g.gain.exponentialRampToValueAtTime(0.001,t+i*0.06+0.18);o.connect(g);g.connect(this.sg);o.start(t+i*0.06);o.stop(t+i*0.06+0.18);});}
    speedUp(){this.init();const t=this.ctx.currentTime;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(200,t);o.frequency.exponentialRampToValueAtTime(800,t+0.15);g.gain.setValueAtTime(0.12,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.2);o.connect(g);g.connect(this.sg);o.start(t);o.stop(t+0.2);}
    victory(){this.init();const t=this.ctx.currentTime;[523,659,784,1047].forEach((f,i)=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0.15,t+i*0.1);g.gain.exponentialRampToValueAtTime(0.001,t+i*0.1+0.3);o.connect(g);g.connect(this.sg);o.start(t+i*0.1);o.stop(t+i*0.1+0.3);});}
    defeat(){this.init();const t=this.ctx.currentTime;[440,330,262].forEach((f,i)=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sawtooth';o.frequency.value=f;g.gain.setValueAtTime(0.12,t+i*0.15);g.gain.exponentialRampToValueAtTime(0.001,t+i*0.15+0.25);o.connect(g);g.connect(this.sg);o.start(t+i*0.15);o.stop(t+i*0.15+0.25);});}
}

export const sfx = new GameAudio();
