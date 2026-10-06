/* ═══════════════════════════════════════════════════════════
   RIBBONS — WebGL-achtergrond voor de hero en contactsectie.
   Lichtende, draaiende linten in een zacht spectrum (knipoog naar
   inclusie) die naar de cursor toe buigen: verbinding, letterlijk.
   - Geen textures of ruis nodig: puur wiskunde, licht voor de GPU
   - Rendert op begrensde resolutie
   - Pauzeert buiten beeld en in een verborgen tabblad
   - "still: true" tekent één statisch frame (prefers-reduced-motion)
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;
uniform float uSeed;
uniform vec3  uBg;
uniform float uGain;
uniform vec2  uFocus;
uniform float uPull;
uniform float uTilt;

#define RIBBONS 7
#define THREADS 9

vec3 spectrum(float x) {
  x = fract(x) * 5.0;
  vec3 c0 = vec3(0.98, 0.70, 0.42); // amber
  vec3 c1 = vec3(0.95, 0.52, 0.62); // roze
  vec3 c2 = vec3(0.66, 0.57, 0.98); // lila
  vec3 c3 = vec3(0.45, 0.72, 0.95); // hemelsblauw
  vec3 c4 = vec3(0.55, 0.84, 0.66); // salie
  float f = smoothstep(0.0, 1.0, fract(x));
  if (x < 1.0) return mix(c0, c1, f);
  if (x < 2.0) return mix(c1, c2, f);
  if (x < 3.0) return mix(c2, c3, f);
  if (x < 4.0) return mix(c3, c4, f);
  return mix(c4, c0, f);
}

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = (frag - 0.5 * uRes) / uRes.y;
  vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0);
  float t = uTime;
  float px = 1.0 / uRes.y;

  // Kantel het veld zodat de linten diagonaal omhoog stromen
  p = rot(uTilt) * p;
  m = rot(uTilt) * m;

  // Compositie: de linten concentreren zich rond uFocus
  vec2 fp = uv - uFocus;
  fp.x *= aspect;
  float mask = (1.0 - smoothstep(0.15, 1.35, length(fp))) * uGain;

  vec3 col = uBg;

  // Zachte gloed op de achtergrond voor diepte
  col += spectrum(p.x * 0.1 + t * 0.01 + uSeed * 0.2) * 0.07 * mask * (1.0 - smoothstep(0.0, 0.9, abs(p.y + 0.05)));

  // Cursor trekt alles naar zich toe
  // (geen pow() met negatieve basis: dat is ongedefinieerd in GLSL ES)
  float gx = (p.x - m.x) * 2.0;
  float g = exp(-gx * gx) * uPull;

  // Fijne draden (achter de linten)
  for (int j = 0; j < THREADS; j++) {
    float fj = float(j);
    float sd = uSeed * 1.7 + fj * 2.399;
    float k = fj / float(THREADS - 1);
    float cy = mix(-0.42, 0.42, k)
      + 0.14 * sin(p.x * (1.3 + 0.2 * sin(sd)) + t * 0.19 + sd)
      + 0.05 * sin(p.x * 3.1 - t * 0.27 + sd * 2.0);
    float dy = 0.14 * (1.3 + 0.2 * sin(sd)) * cos(p.x * (1.3 + 0.2 * sin(sd)) + t * 0.19 + sd)
      + 0.05 * 3.1 * cos(p.x * 3.1 - t * 0.27 + sd * 2.0);
    cy = mix(cy, m.y + (k - 0.5) * 0.08, g * 0.85);
    float d = abs(p.y - cy) / sqrt(1.0 + dy * dy);
    float line = 1.0 - smoothstep(0.0, px * 1.6, d);
    vec3 c = spectrum(p.x * 0.14 + k * 0.7 + uSeed * 0.31);
    col += c * (line * 0.22 + exp(-d * 90.0) * 0.05) * mask;
  }

  // Linten: brede, draaiende banden met glans
  for (int i = 0; i < RIBBONS; i++) {
    float fi = float(i);
    float k = fi / float(RIBBONS - 1);
    float sd = uSeed + fi * 1.618;
    float f1 = 1.05 + 0.3 * sin(sd * 2.1);
    float f2 = 2.2 + 0.5 * cos(sd * 1.3);
    float ph1 = p.x * f1 + t * 0.21 + sd * 3.0;
    float ph2 = p.x * f2 - t * 0.29 + sd * 5.0;
    float cy = mix(-0.3, 0.3, k) + 0.17 * sin(ph1) + 0.06 * sin(ph2);
    float dy = 0.17 * f1 * cos(ph1) + 0.06 * f2 * cos(ph2);
    cy = mix(cy, m.y + (k - 0.5) * 0.05, g * 0.6);

    float d = (p.y - cy) / sqrt(1.0 + dy * dy);

    // Draaiing langs het lint: breedte = |cos(hoek)|
    float tw = sin(p.x * (1.5 + 0.5 * k) + t * 0.42 + sd * 4.0);
    float face = abs(tw);
    float hw = 0.004 + 0.042 * face;
    float inside = 1.0 - smoothstep(hw - px, hw + px, abs(d));
    float u = clamp(d / hw, -1.0, 1.0);

    vec3 base = spectrum(p.x * 0.11 + k * 0.62 + t * 0.012 + uSeed * 0.2);
    vec3 c = mix(base * 0.55, base, smoothstep(-0.35, 0.35, tw)); // achterkant iets donkerder

    float light = 0.36 + 0.74 * face * (1.0 - 0.45 * u * u);
    float hl = pow(max(0.0, 1.0 - abs(u + 0.4 * tw)), 7.0) * face; // basis is >= 0
    vec3 ribbon = c * light + vec3(1.0, 0.97, 0.93) * hl * 0.65;

    float a = inside * mask;
    col = mix(col, ribbon, a * 0.94);
    col += base * (exp(-abs(d) * 26.0) * 0.11 + exp(-abs(d) * 7.0) * 0.03) * mask;
  }

  // Dither tegen banding
  col += (hash(frag + fract(t * 7.0)) - 0.5) / 180.0;
  gl_FragColor = vec4(col, 1.0);
}`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error('Shader compile error: ' + log);
    }
    return s;
  }

  class Ribbons {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.o = Object.assign({
        seed: 0,
        speed: 1,
        gain: 1,
        pull: 1,
        tilt: -0.32,
        focus: [0.68, 0.5],
        bg: [0.055, 0.047, 0.043],
        still: false,
        maxPixels: 1400000
      }, opts || {});

      const gl = canvas.getContext('webgl', {
        antialias: false, alpha: false, depth: false, stencil: false,
        premultipliedAlpha: false, preserveDrawingBuffer: false
      });
      if (!gl) throw new Error('WebGL niet beschikbaar');
      this.gl = gl;

      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);

      // Eén driehoek die het hele scherm bedekt
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      this.u = {};
      ['uRes', 'uTime', 'uMouse', 'uSeed', 'uBg', 'uGain', 'uFocus', 'uPull', 'uTilt'].forEach(n => {
        this.u[n] = gl.getUniformLocation(prog, n);
      });
      gl.uniform1f(this.u.uSeed, this.o.seed);
      gl.uniform3fv(this.u.uBg, this.o.bg);
      gl.uniform2fv(this.u.uFocus, this.o.focus);
      gl.uniform1f(this.u.uTilt, this.o.tilt);

      this.time = 6 + this.o.seed * 11;
      // Zonder cursor rust het "trekpunt" op het focuspunt
      this.mouse = this.o.focus.slice();
      this.target = this.mouse.slice();
      this.pull = 0;
      this.pullTarget = 0;
      this.gain = this.o.gain;
      this.visible = false;
      this.running = false;
      this.loop = this.loop.bind(this);

      this.resize();
      this.render();

      // Valt de GPU-context weg, dan blijft de CSS-gradient eronder gewoon staan
      canvas.addEventListener('webglcontextlost', () => {
        this.lost = true;
        this.running = false;
        cancelAnimationFrame(this.raf);
        canvas.classList.remove('is-on');
      });

      if ('ResizeObserver' in window) {
        this.ro = new ResizeObserver(() => { this.resize(); if (!this.running) this.render(); });
        this.ro.observe(canvas);
      }
      this.io = new IntersectionObserver(entries => {
        this.visible = entries[0].isIntersecting;
        this.update();
      }, { rootMargin: '80px' });
      this.io.observe(canvas);
      document.addEventListener('visibilitychange', () => this.update());

      if (!this.o.still) {
        const host = canvas.parentElement;
        host.addEventListener('pointermove', e => {
          if (e.pointerType !== 'mouse') return;
          const r = canvas.getBoundingClientRect();
          this.target[0] = (e.clientX - r.left) / r.width;
          this.target[1] = 1 - (e.clientY - r.top) / r.height;
          this.pullTarget = this.o.pull;
        }, { passive: true });
        host.addEventListener('pointerleave', () => {
          this.pullTarget = 0;
        });
      }
    }

    resize() {
      const cw = this.canvas.clientWidth || 1;
      const ch = this.canvas.clientHeight || 1;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Schaal zodat we nooit meer dan maxPixels renderen
      const scale = Math.min(dpr, Math.sqrt(this.o.maxPixels / (cw * ch)));
      const w = Math.max(1, Math.round(cw * scale));
      const h = Math.max(1, Math.round(ch * scale));
      if (w !== this.canvas.width || h !== this.canvas.height) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.gl.viewport(0, 0, w, h);
      }
    }

    update() {
      const should = this.visible && !document.hidden && !this.o.still && !this.lost;
      if (should && !this.running) {
        this.running = true;
        this.last = performance.now();
        this.raf = requestAnimationFrame(this.loop);
      } else if (!should && this.running) {
        this.running = false;
        cancelAnimationFrame(this.raf);
      }
    }

    loop(now) {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, 0.05);
      this.last = now;
      this.time += dt * this.o.speed;
      const k = 1 - Math.pow(0.045, dt); // framerate-onafhankelijke demping
      this.mouse[0] += (this.target[0] - this.mouse[0]) * k;
      this.mouse[1] += (this.target[1] - this.mouse[1]) * k;
      this.pull += (this.pullTarget - this.pull) * k * 0.6;
      this.render();
      this.raf = requestAnimationFrame(this.loop);
    }

    setGain(g) {
      this.gain = g;
      if (!this.running) this.render();
    }

    render() {
      if (this.lost) return;
      const gl = this.gl;
      gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height);
      gl.uniform1f(this.u.uTime, this.time);
      gl.uniform2f(this.u.uMouse, this.mouse[0], this.mouse[1]);
      gl.uniform1f(this.u.uGain, this.gain);
      gl.uniform1f(this.u.uPull, this.pull);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!this.shown) {
        this.shown = true;
        this.canvas.classList.add('is-on');
      }
    }
  }

  window.Ribbons = Ribbons;
})();
