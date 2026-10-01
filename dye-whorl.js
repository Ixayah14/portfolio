/**
 * 21st.dev Dye Whorl Fluid Dynamic Background
 * Exact physics & WebGL2 Navier-Stokes shader solver extracted from:
 * https://21st.dev/@nikolas-sapa/components/dye-whorl
 */

(function (global) {
  'use strict';

  // Constants & tuning parameters from the original 21st.dev component
  const Fi = 0.012;
  const Sh = 0.06;
  const Pi = 26;
  const j0 = 11;
  const Eh = 0.016;
  const Th = 6;
  const _a = 12; // Total splat buffer size
  const ph = 5;  // Autonomous source points
  const Q0 = 5;  // Fresh bead drop splat slot
  const L0 = 6;  // Pointer trail splats start index
  const Ah = 1.5;
  const xh = 1.7;
  const Z0 = [0.12, 0.66, 0.34, 0.22, 0.53, 0.82, 0.74, 0.34, 0.92, 0.7]; // Natural plume anchors
  const Yh = 260;
  const Xh = 380;
  const V0 = 1 / 60;

  // Vertex Shader: Fullscreen triangle
  const Mh = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

  // Shared Splat Uniform Block
  const J0 = `
uniform vec4 u_sp[${_a}];  // xy = uv centre, z = radius (uv-x units), w = dye amount
uniform vec4 u_sf[${_a}];  // xy = force (cells/s), z = accent amount, w = unused
uniform float u_aspect;

float splatFall(vec2 uv, vec2 c, float r) {
  vec2 d = (uv - c) * vec2(u_aspect, 1.0);
  return exp(-dot(d, d) / max(1e-5, r * r));
}`;

  // Advection Shader for Velocity
  const Dh = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_vel;
uniform vec2 u_texel;
uniform float u_dt;
uniform float u_diss;
void main() {
  vec2 v = texture(u_vel, v_uv).xy;
  vec2 src = v_uv - u_dt * v * u_texel;
  fragColor = vec4(texture(u_vel, src).xy * u_diss, 0.0, 1.0);
}`;

  // Velocity Forces, Vorticity Confinement, Buoyancy & Curl-Noise Ambient Stirring
  const Rh = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_vel;
uniform sampler2D u_dye;
uniform vec2 u_texel;
uniform float u_dt;
uniform float u_time;
uniform float u_curlAmt;
uniform float u_buoy;
uniform float u_ambient;
${J0}

float curlAt(vec2 uv) {
  float r = texture(u_vel, uv + vec2(u_texel.x, 0.0)).y;
  float l = texture(u_vel, uv - vec2(u_texel.x, 0.0)).y;
  float t = texture(u_vel, uv + vec2(0.0, u_texel.y)).x;
  float b = texture(u_vel, uv - vec2(0.0, u_texel.y)).x;
  return 0.5 * ((r - l) - (t - b));
}

float hash21(vec2 p) {
  p = fract(p * vec2(287.13, 419.71));
  p += dot(p, p + 27.31);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  return vnoise(p) * 0.62 + vnoise(p * 2.13 + 7.3) * 0.28;
}

void main() {
  vec2 v = texture(u_vel, v_uv).xy;

  // Vorticity confinement: maintains tendrils curling instead of diffusing
  float c = curlAt(v_uv);
  float cr = abs(curlAt(v_uv + vec2(u_texel.x, 0.0)));
  float cl = abs(curlAt(v_uv - vec2(u_texel.x, 0.0)));
  float ct = abs(curlAt(v_uv + vec2(0.0, u_texel.y)));
  float cb = abs(curlAt(v_uv - vec2(0.0, u_texel.y)));
  vec2 g = vec2(cr - cl, ct - cb) * 0.5;
  float gl = length(g);
  if (gl > 1e-5) {
    vec2 n = g / gl;
    v += vec2(n.y, -n.x) * c * u_curlAmt * u_dt;
  }

  // Buoyancy against a local mean
  float wide = 6.0;
  float d0 = texture(u_dye, v_uv).x;
  float dAvg = 0.25 * (
    texture(u_dye, v_uv + vec2(u_texel.x * wide, 0.0)).x +
    texture(u_dye, v_uv - vec2(u_texel.x * wide, 0.0)).x +
    texture(u_dye, v_uv + vec2(0.0, u_texel.y * wide)).x +
    texture(u_dye, v_uv - vec2(0.0, u_texel.y * wide)).x
  );
  float excess = d0 - dAvg;
  v.y -= excess * u_buoy * u_dt;
  v.x += excess * u_buoy * 0.22 * u_dt * (vnoise(v_uv * 9.0 + u_time * 0.15) - 0.5);

  // Divergence-free curl-noise stirring
  vec2 q = v_uv * vec2(u_aspect, 1.0) * 1.7 + vec2(u_time * 0.031, -u_time * 0.024);
  float e = 0.035;
  float px = fbm(q + vec2(e, 0.0)) - fbm(q - vec2(e, 0.0));
  float py = fbm(q + vec2(0.0, e)) - fbm(q - vec2(0.0, e));
  v += vec2(py, -px) / (2.0 * e) * u_ambient * u_dt;

  // Splat injections
  for (int i = 0; i < ${_a}; i++) {
    if (u_sp[i].z <= 0.0) continue;
    v += u_sf[i].xy * splatFall(v_uv, u_sp[i].xy, u_sp[i].z) * u_dt;
  }

  // Soft boundary damping
  vec2 e2 = min(v_uv, 1.0 - v_uv);
  float wall = smoothstep(0.0, 0.045, min(e2.x, e2.y));
  v *= mix(0.86, 1.0, wall);

  fragColor = vec4(v, 0.0, 1.0);
}`;

  // Divergence Shader
  const zh = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_vel;
uniform vec2 u_texel;
void main() {
  float r = texture(u_vel, v_uv + vec2(u_texel.x, 0.0)).x;
  float l = texture(u_vel, v_uv - vec2(u_texel.x, 0.0)).x;
  float t = texture(u_vel, v_uv + vec2(0.0, u_texel.y)).y;
  float b = texture(u_vel, v_uv - vec2(0.0, u_texel.y)).y;
  fragColor = vec4(0.5 * ((r - l) + (t - b)), 0.0, 0.0, 1.0);
}`;

  // Pressure Poisson Solver (Jacobi iteration)
  const Oh = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_pressure;
uniform sampler2D u_div;
uniform vec2 u_texel;
void main() {
  float r = texture(u_pressure, v_uv + vec2(u_texel.x, 0.0)).x;
  float l = texture(u_pressure, v_uv - vec2(u_texel.x, 0.0)).x;
  float t = texture(u_pressure, v_uv + vec2(0.0, u_texel.y)).x;
  float b = texture(u_pressure, v_uv - vec2(0.0, u_texel.y)).x;
  float d = texture(u_div, v_uv).x;
  fragColor = vec4((l + r + b + t - d) * 0.25, 0.0, 0.0, 1.0);
}`;

  // Gradient Subtraction (Projection Step)
  const Uh = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_pressure;
uniform sampler2D u_vel;
uniform vec2 u_texel;
void main() {
  float r = texture(u_pressure, v_uv + vec2(u_texel.x, 0.0)).x;
  float l = texture(u_pressure, v_uv - vec2(u_texel.x, 0.0)).x;
  float t = texture(u_pressure, v_uv + vec2(0.0, u_texel.y)).x;
  float b = texture(u_pressure, v_uv - vec2(0.0, u_texel.y)).x;
  vec2 v = texture(u_vel, v_uv).xy - 0.5 * vec2(r - l, t - b);
  fragColor = vec4(v, 0.0, 1.0);
}`;

  // Simple Advection Sampler
  const Nh = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_src;
uniform sampler2D u_vel;
uniform vec2 u_simTexel;
uniform float u_dt;
uniform float u_dir;
void main() {
  vec2 v = texture(u_vel, v_uv).xy;
  vec2 src = v_uv - u_dir * u_dt * v * u_simTexel;
  fragColor = vec4(texture(u_src, src).xy, 0.0, 1.0);
}`;

  // MacCormack Advection for High-Fidelity Dye
  const Hh = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_src;
uniform sampler2D u_fwd;
uniform sampler2D u_back;
uniform sampler2D u_vel;
uniform vec2 u_texel;
uniform vec2 u_simTexel;
uniform float u_dt;
uniform float u_diss;
uniform float u_accentDiss;
uniform float u_correct;
${J0}

void main() {
  vec2 fwd = texture(u_fwd, v_uv).xy;
  vec2 phi = texture(u_src, v_uv).xy;
  vec2 back = texture(u_back, v_uv).xy;
  vec2 outv = fwd + 0.5 * (phi - back) * u_correct;

  vec2 v = texture(u_vel, v_uv).xy;
  vec2 src = v_uv - u_dt * v * u_simTexel;
  vec2 a = texture(u_src, src + vec2(u_texel.x, u_texel.y)).xy;
  vec2 b = texture(u_src, src + vec2(-u_texel.x, u_texel.y)).xy;
  vec2 c = texture(u_src, src + vec2(u_texel.x, -u_texel.y)).xy;
  vec2 d = texture(u_src, src + vec2(-u_texel.x, -u_texel.y)).xy;
  vec2 lo = min(min(a, b), min(c, d));
  vec2 hi = max(max(a, b), max(c, d));
  outv = clamp(outv, lo, hi);

  outv.x *= u_diss;
  outv.y *= u_accentDiss;

  for (int i = 0; i < ${_a}; i++) {
    if (u_sp[i].z <= 0.0) continue;
    float f = splatFall(v_uv, u_sp[i].xy, u_sp[i].z);
    outv.x += u_sp[i].w * f;
    outv.y += u_sf[i].z * f;
  }

  fragColor = vec4(clamp(outv, vec2(0.0), vec2(1.05, 1.0)), 0.0, 1.0);
}`;

  // Final Render & Color Ramp Shader
  const Bh = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_dye;
uniform vec2 u_dyeTexel;
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec3 u_c4;
uniform vec3 u_accent;
uniform float u_gamma;
uniform float u_rim;
uniform float u_ink;

vec3 ramp(float x) {
  vec3 c = mix(u_c0, u_c1, smoothstep(0.0, 0.22, x));
  c = mix(c, u_c2, smoothstep(0.18, 0.48, x));
  c = mix(c, u_c3, smoothstep(0.45, 0.78, x));
  c = mix(c, u_c4, smoothstep(0.76, 1.0, x));
  return c;
}

void main() {
  vec2 s = texture(u_dye, v_uv).xy;
  float d = s.x;

  float dr = texture(u_dye, v_uv + vec2(u_dyeTexel.x, 0.0)).x;
  float dl = texture(u_dye, v_uv - vec2(u_dyeTexel.x, 0.0)).x;
  float dt = texture(u_dye, v_uv + vec2(0.0, u_dyeTexel.y)).x;
  float db = texture(u_dye, v_uv - vec2(0.0, u_dyeTexel.y)).x;
  float grad = length(vec2(dr - dl, dt - db)) * 0.5;

  float cov = 1.0 - exp(-d * u_ink);
  cov = pow(clamp(cov, 0.0, 1.0), u_gamma);
  cov = clamp(cov + grad * u_rim, 0.0, 1.0);

  vec3 col = ramp(cov);

  float fresh = clamp(s.y * 1.05, 0.0, 1.0) * smoothstep(0.05, 0.28, cov);
  col = mix(col, mix(col, u_accent, 0.42), fresh);

  vec2 vp = v_uv - 0.5;
  float vig = smoothstep(0.42, 0.95, length(vp * vec2(1.0, 1.25)) * 1.6);
  col = mix(col, u_c0, vig * 0.30);

  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * 0.0055;

  fragColor = vec4(col, 1.0);
}`;

  // Helper utilities
  function parseHex(hexStr) {
    if (!hexStr) return null;
    const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hexStr.trim());
    if (!match) return null;
    let s = match[1];
    if (s.length === 3) s = s.split('').map(ch => ch + ch).join('');
    const val = parseInt(s, 16);
    return [(val >> 16 & 255) / 255, (val >> 8 & 255) / 255, (val & 255) / 255];
  }

  function mixRGB(a, b, t) {
    return [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t
    ];
  }

  function luminance([r, g, b]) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // WebGL2 Solver Engine
  class Solver {
    constructor(canvas) {
      this.canvas = canvas;
      this.gl = null;
      this.vao = null;
      this.buffer = null;
      this.programs = [];
      this.locs = new WeakMap();
      this.fbos = [];
      this.active = null;
    }

    init() {
      const gl = this.canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance'
      });

      if (!gl) return false;
      if (!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))) {
        return false;
      }
      gl.getExtension('OES_texture_float_linear');

      this.gl = gl;
      this.buffer = gl.createBuffer();
      this.vao = gl.createVertexArray();
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.disable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      return true;
    }

    compile(type, src) {
      const gl = this.gl;
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    }

    program(fragSrc) {
      const gl = this.gl;
      if (!gl) return null;
      const vs = this.compile(gl.VERTEX_SHADER, Mh);
      const fs = this.compile(gl.FRAGMENT_SHADER, fragSrc);
      if (!vs || !fs) return null;

      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.bindAttribLocation(prog, 0, 'a_pos');
      gl.linkProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);

      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(prog));
        gl.deleteProgram(prog);
        return null;
      }
      this.programs.push(prog);
      this.locs.set(prog, new Map());
      return prog;
    }

    use(prog) {
      if (this.gl && prog) this.gl.useProgram(prog);
      this.active = prog;
    }

    loc(name) {
      const prog = this.active;
      if (!prog || !this.gl) return null;
      const map = this.locs.get(prog);
      if (!map.has(name)) {
        map.set(name, this.gl.getUniformLocation(prog, name));
      }
      return map.get(name) ?? null;
    }

    f(name, val) {
      if (this.gl) this.gl.uniform1f(this.loc(name), val);
    }

    v2(name, x, y) {
      if (this.gl) this.gl.uniform2f(this.loc(name), x, y);
    }

    v3(name, arr) {
      if (this.gl) this.gl.uniform3f(this.loc(name), arr[0], arr[1], arr[2]);
    }

    v4a(name, arr) {
      if (this.gl) this.gl.uniform4fv(this.loc(name), arr);
    }

    tex(name, unit, texture) {
      const gl = this.gl;
      if (gl) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(this.loc(name), unit);
      }
    }

    makeFBO(w, h, internalFormat, format) {
      const gl = this.gl;
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, gl.HALF_FLOAT, null);

      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        gl.deleteTexture(tex);
        gl.deleteFramebuffer(fbo);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return null;
      }
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      const obj = { tex, fbo, w, h, texel: [1 / w, 1 / h] };
      this.fbos.push(obj);
      return obj;
    }

    makeDouble(w, h, internalFormat, format) {
      const r = this.makeFBO(w, h, internalFormat, format);
      const wFbo = this.makeFBO(w, h, internalFormat, format);
      if (!r || !wFbo) return null;
      const doubleObj = {
        read: r,
        write: wFbo,
        swap: () => {
          const temp = doubleObj.read;
          doubleObj.read = doubleObj.write;
          doubleObj.write = temp;
        }
      };
      return doubleObj;
    }

    blit(targetFbo) {
      const gl = this.gl;
      if (!gl) return;
      if (targetFbo) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, targetFbo.fbo);
        gl.viewport(0, 0, targetFbo.w, targetFbo.h);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    free(fbo) {
      const gl = this.gl;
      if (!gl || !fbo) return;
      gl.deleteTexture(fbo.tex);
      gl.deleteFramebuffer(fbo.fbo);
      this.fbos = this.fbos.filter(item => item !== fbo);
    }

    freeDouble(doubleObj) {
      if (doubleObj) {
        this.free(doubleObj.read);
        this.free(doubleObj.write);
      }
    }

    dropTargets() {
      const gl = this.gl;
      if (gl) {
        for (const item of this.fbos) {
          gl.deleteTexture(item.tex);
          gl.deleteFramebuffer(item.fbo);
        }
        this.fbos = [];
      }
    }

    destroy() {
      const gl = this.gl;
      if (gl) {
        this.dropTargets();
        for (const prog of this.programs) {
          gl.deleteProgram(prog);
        }
        this.programs = [];
        if (this.buffer) gl.deleteBuffer(this.buffer);
        if (this.vao) gl.deleteVertexArray(this.vao);
        this.buffer = null;
        this.vao = null;
        this.gl = null;
      }
    }
  }

  /**
   * Initializes the Dye Whorl background on the given container & canvas
   */
  function initDyeWhorl(containerEl, canvasEl, options = {}) {
    if (!containerEl || !canvasEl) return null;

    const speed = options.speed ?? 1.0;
    let density = options.density ?? 1.0;
    let stir = options.stir ?? 1.0;
    let paused = options.paused ?? false;

    const solver = new Solver(canvasEl);
    if (!solver.init()) {
      console.warn('WebGL2 not supported or floating point textures unavailable for Dye Whorl.');
      return null;
    }

    const gl = solver.gl;
    const pAdvectVel = solver.program(Dh);
    const pForces = solver.program(Rh);
    const pDivergence = solver.program(zh);
    const pJacobi = solver.program(Oh);
    const pGradient = solver.program(Uh);
    const pAdvectSample = solver.program(Nh);
    const pMacCormack = solver.program(Hh);
    const pRender = solver.program(Bh);

    if (!pAdvectVel || !pForces || !pDivergence || !pJacobi || !pGradient || !pAdvectSample || !pMacCormack || !pRender) {
      console.error('Failed to compile Dye Whorl WebGL2 programs.');
      solver.destroy();
      return null;
    }

    // Adaptive Performance Tiers
    const tiers = [
      { sim: 208, dye: 768, jacobi: 18, correct: 1, scale: 1 },
      { sim: 208, dye: 640, jacobi: 12, correct: 1, scale: 1 },
      { sim: 176, dye: 512, jacobi: 10, correct: 0, scale: 0.8 },
      { sim: 144, dye: 384, jacobi: 8, correct: 0, scale: 0.65 }
    ];
    const targetFpsThreshold = 26;
    let currentTier = 0;
    let smoothFrameDelta = 16.7;
    let timeAboveThreshold = 0;
    let timeBelowThreshold = 0;
    let recoveryThreshold = 8000;

    let animFrameId = 0;
    let isRunning = false;
    let isReducedMotion = false;
    let isDestroyed = false;

    let width = 0;
    let height = 0;
    let pixelScale = 1;
    let simW = 0;
    let simH = 0;
    let simTime = 0;
    let lastTime = performance.now();

    // Simulation targets
    let fboVel = null;
    let fboDye = null;
    let fboPressure = null;
    let fboDiv = null;
    let fboFwd = null;
    let fboBack = null;

    // Splat arrays
    const splatPosRadius = new Float32Array(_a * 4);
    const splatForceAccent = new Float32Array(_a * 4);

    // Color ramp palette
    let c0 = [0.04, 0.04, 0.04];
    let c1 = [0.14, 0.14, 0.14];
    let c2 = [0.4, 0.4, 0.4];
    let c3 = [0.78, 0.78, 0.78];
    let c4 = [1.0, 1.0, 1.0];
    let accent = [0, 0.42, 1.0];
    let gamma = 1.08;
    let rim = 2.6;
    let ink = 2.5;

    function readColors() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      if (!isLight) {
        // SAMURAI DARK MODE:
        // Deep obsidian lacquer background with silvery mist, tamahagane steel & vermilion crimson accent drops
        c0 = [0.035, 0.038, 0.05];
        c1 = [0.14, 0.16, 0.22];
        c2 = [0.38, 0.44, 0.52];
        c3 = [0.75, 0.82, 0.90];
        c4 = [0.98, 0.98, 1.0];
        accent = [0.85, 0.20, 0.22]; // Traditional Samurai Vermilion Red (Shu-iro)
        gamma = 1.08;
        rim = 2.6;
        ink = 2.5;
      } else {
        // SAMURAI LIGHT MODE (Washi Scroll & Sumi-e Ink):
        // Pristine Washi paper white background, deep rich pitch black sumi ink passing through
        c0 = [0.985, 0.98, 0.965];   // Washi paper white
        c1 = [0.82, 0.82, 0.84];     // Pale misty charcoal wash
        c2 = [0.48, 0.49, 0.53];     // Medium sumi-e ink body
        c3 = [0.18, 0.19, 0.22];     // Dense dark calligraphy ink
        c4 = [0.015, 0.02, 0.025];   // Pure concentrated sumi black
        accent = [0.75, 0.15, 0.18]; // Traditional Vermilion Hanko Stamp Red
        gamma = 1.12;
        rim = 2.2;
        ink = 2.8;
      }
    }
    readColors();

    let dropTimer = 0.7;
    let rngSeed = 3;

    function clearSplats() {
      splatPosRadius.fill(0);
      splatForceAccent.fill(0);
    }

    function setSplat(idx, uvX, uvY, radius, dyeAmount, forceX, forceY, accentAmount) {
      splatPosRadius[idx * 4] = uvX;
      splatPosRadius[idx * 4 + 1] = uvY;
      splatPosRadius[idx * 4 + 2] = radius;
      splatPosRadius[idx * 4 + 3] = dyeAmount;

      splatForceAccent[idx * 4] = forceX;
      splatForceAccent[idx * 4 + 1] = forceY;
      splatForceAccent[idx * 4 + 2] = accentAmount;
    }

    // Natural fluid sources that continuously swirl autonomous dye tendrils
    function updateSources(dt) {
      const qDensity = Math.max(0, density);
      for (let j = 0; j < ph; j++) {
        const phi = j * 2.399963;
        const freq = 0.048 + j * 0.014;
        const px = Z0[j * 2] + 0.12 * Math.sin(simTime * freq + phi);
        const py = Z0[j * 2 + 1] + 0.15 * Math.sin(simTime * freq * 0.78 + phi * 1.7);
        const dir = simTime * (0.19 + j * 0.05) + phi;
        const mag = 58 + 24 * Math.sin(simTime * 0.31 + phi);

        setSplat(
          j,
          px,
          py,
          0.05 + 0.016 * Math.sin(simTime * 0.23 + phi),
          0.46 * qDensity * dt,
          Math.cos(dir) * mag * dt * 60,
          Math.sin(dir) * mag * dt * 60,
          0
        );
      }

      // Periodic autonomous bead drop
      dropTimer -= dt;
      if (dropTimer <= 0) {
        rngSeed = (rngSeed * 1103515245 + 12345) & 2147483647;
        const rx = ((rngSeed >> 7) & 1023) / 1023;
        rngSeed = (rngSeed * 1103515245 + 12345) & 2147483647;
        const ry = ((rngSeed >> 7) & 1023) / 1023;
        rngSeed = (rngSeed * 1103515245 + 12345) & 2147483647;
        const rz = ((rngSeed >> 7) & 1023) / 1023;
        const angle = rz * Math.PI * 2;

        setSplat(
          Q0,
          0.12 + rx * 0.76,
          0.18 + ry * 0.68,
          0.07 + rz * 0.045,
          1.35 * qDensity,
          Math.cos(angle) * 300,
          Math.sin(angle) * 300 - 120,
          0
        );
        dropTimer = Ah + rx * xh;
      }
    }

    // Pointer Physics Tracking
    let hasPointer = false;
    let targetX = 0, targetY = 0;
    let filterX = 0, filterY = 0;
    let velX = 0, velY = 0;
    let lastX = 0, lastY = 0;
    let trailX = 0, trailY = 0;
    let lastPointerTime = 0;
    let boundsLeft = 0, boundsTop = 0;
    let boundsDirty = true;

    function stepPointer(dt) {
      if (!hasPointer || dt <= 0 || width < 2) return;

      const alphaV = 1 - Math.exp(-dt / Sh);
      velX += ((targetX - lastX) / dt - velX) * alphaV;
      velY += ((targetY - lastY) / dt - velY) * alphaV;
      lastX = targetX;
      lastY = targetY;

      let leadX = velX * Fi;
      let leadY = velY * Fi;
      const speedMag = Math.hypot(leadX, leadY);
      if (speedMag > Pi) {
        leadX = (leadX / speedMag) * Pi;
        leadY = (leadY / speedMag) * Pi;
      }

      const alphaP = 1 - Math.exp(-dt / Fi);
      filterX += (targetX + leadX - filterX) * alphaP;
      filterY += (targetY + leadY - filterY) * alphaP;

      const dx = filterX - trailX;
      const dy = filterY - trailY;
      const dist = Math.hypot(dx, dy);
      const timeSinceLast = simTime - lastPointerTime;

      if (dist < j0 && !(timeSinceLast >= Eh && dist > 0.5)) return;

      const numSplats = Math.min(Th, Math.max(1, Math.round(dist / j0)));
      const effStir = stir;
      const simAspectScale = simW / Math.max(1, width);
      const forceX = (dx / Math.max(1e-4, timeSinceLast)) * simAspectScale * 0.55 * effStir;
      const forceY = -(dy / Math.max(1e-4, timeSinceLast)) * simAspectScale * 0.55 * effStir;
      const speedNorm = Math.min(1, Math.hypot(forceX, forceY) / 120);

      for (let s = 1; s <= numSplats; s++) {
        const factor = s / numSplats;
        const splatUvX = (trailX + dx * factor) / width;
        const splatUvY = 1 - (trailY + dy * factor) / height;

        setSplat(
          L0 + (s - 1),
          splatUvX,
          splatUvY,
          0.035,
          (0.36 + 0.72 * speedNorm) * effStir * Math.max(0.25, density) / numSplats,
          forceX / numSplats,
          forceY / numSplats,
          (0.1 + 0.2 * speedNorm) / numSplats
        );
      }

      trailX = filterX;
      trailY = filterY;
      lastPointerTime = simTime;
    }

    // Single step of Navier-Stokes simulation
    function step(dt) {
      if (!fboVel || !fboDye || !fboPressure || !fboDiv || !fboFwd || !fboBack) return;
      const tier = tiers[currentTier];
      const texel = fboVel.read.texel;
      const aspect = width / Math.max(1, height);

      // 1. Advect velocity
      solver.use(pAdvectVel);
      solver.tex('u_vel', 0, fboVel.read.tex);
      solver.v2('u_texel', texel[0], texel[1]);
      solver.f('u_dt', dt);
      solver.f('u_diss', Math.exp(-dt * 0.16));
      solver.blit(fboVel.write);
      fboVel.swap();

      // 2. Apply forces, vorticity, buoyancy, ambient noise & splats
      solver.use(pForces);
      solver.tex('u_vel', 0, fboVel.read.tex);
      solver.tex('u_dye', 1, fboDye.read.tex);
      solver.v2('u_texel', texel[0], texel[1]);
      solver.f('u_dt', dt);
      solver.f('u_time', simTime);
      solver.f('u_curlAmt', 24);
      solver.f('u_buoy', 46);
      solver.f('u_ambient', 8.5);
      solver.f('u_aspect', aspect);
      solver.v4a('u_sp', splatPosRadius);
      solver.v4a('u_sf', splatForceAccent);
      solver.blit(fboVel.write);
      fboVel.swap();

      // 3. Compute divergence
      solver.use(pDivergence);
      solver.tex('u_vel', 0, fboVel.read.tex);
      solver.v2('u_texel', texel[0], texel[1]);
      solver.blit(fboDiv);

      // 4. Pressure Poisson solve (Jacobi)
      solver.use(pJacobi);
      solver.v2('u_texel', texel[0], texel[1]);
      solver.tex('u_div', 1, fboDiv.tex);
      for (let k = 0; k < tier.jacobi; k++) {
        solver.tex('u_pressure', 0, fboPressure.read.tex);
        solver.blit(fboPressure.write);
        fboPressure.swap();
      }

      // 5. Subtract pressure gradient
      solver.use(pGradient);
      solver.tex('u_pressure', 0, fboPressure.read.tex);
      solver.tex('u_vel', 1, fboVel.read.tex);
      solver.v2('u_texel', texel[0], texel[1]);
      solver.blit(fboVel.write);
      fboVel.swap();

      // 6. Dye MacCormack Advection
      const dyeTexel = fboDye.read.texel;
      solver.use(pAdvectSample);
      solver.tex('u_vel', 1, fboVel.read.tex);
      solver.v2('u_simTexel', texel[0], texel[1]);
      solver.f('u_dt', dt);
      solver.f('u_dir', 1);
      solver.tex('u_src', 0, fboDye.read.tex);
      solver.blit(fboFwd);

      if (tier.correct > 0) {
        solver.f('u_dir', -1);
        solver.tex('u_src', 0, fboFwd.tex);
        solver.blit(fboBack);
      }

      solver.use(pMacCormack);
      solver.tex('u_src', 0, fboDye.read.tex);
      solver.tex('u_fwd', 1, fboFwd.tex);
      solver.tex('u_back', 2, tier.correct > 0 ? fboBack.tex : fboFwd.tex);
      solver.tex('u_vel', 3, fboVel.read.tex);
      solver.v2('u_texel', dyeTexel[0], dyeTexel[1]);
      solver.v2('u_simTexel', texel[0], texel[1]);
      solver.f('u_dt', dt);
      solver.f('u_diss', Math.exp(-dt * 0.1));
      solver.f('u_accentDiss', Math.exp(-dt * 2));
      solver.f('u_correct', tier.correct);
      solver.f('u_aspect', aspect);
      solver.v4a('u_sp', splatPosRadius);
      solver.v4a('u_sf', splatForceAccent);
      solver.blit(fboDye.write);
      fboDye.swap();
    }

    // Final render to canvas
    function render() {
      if (!fboDye) return;
      const dyeTexel = fboDye.read.texel;
      solver.use(pRender);
      solver.tex('u_dye', 0, fboDye.read.tex);
      solver.v2('u_dyeTexel', dyeTexel[0], dyeTexel[1]);
      solver.v3('u_c0', c0);
      solver.v3('u_c1', c1);
      solver.v3('u_c2', c2);
      solver.v3('u_c3', c3);
      solver.v3('u_c4', c4);
      solver.v3('u_accent', accent);
      solver.f('u_gamma', gamma);
      solver.f('u_rim', rim);
      solver.f('u_ink', ink);
      solver.blit(null);
    }

    function advance(dt) {
      clearSplats();
      simTime += dt;
      updateSources(dt);
      stepPointer(dt);
      step(dt);
    }

    function spin(steps) {
      for (let i = 0; i < steps; i++) {
        advance(V0);
      }
    }

    let isAllocated = false;
    function allocate() {
      if (width < 2 || height < 2 || !solver.gl) return;

      const tier = tiers[currentTier];
      const aspect = width / height;

      if (aspect >= 1) {
        simW = tier.sim;
        simH = Math.max(48, Math.round(tier.sim / aspect));
      } else {
        simH = tier.sim;
        simW = Math.max(48, Math.round(tier.sim * aspect));
      }

      const dyeW = aspect >= 1 ? tier.dye : Math.max(96, Math.round(tier.dye * aspect));
      const dyeH = aspect >= 1 ? Math.max(96, Math.round(tier.dye / aspect)) : tier.dye;

      const oldVel = fboVel;
      const oldDye = fboDye;

      const newVel = solver.makeDouble(simW, simH, gl.RG16F, gl.RG);
      const newDye = solver.makeDouble(dyeW, dyeH, gl.RG16F, gl.RG);
      const newPressure = solver.makeDouble(simW, simH, gl.R16F, gl.RED);
      const newDiv = solver.makeFBO(simW, simH, gl.R16F, gl.RED);
      const newFwd = solver.makeFBO(dyeW, dyeH, gl.RG16F, gl.RG);
      const newBack = solver.makeFBO(dyeW, dyeH, gl.RG16F, gl.RG);

      if (!newVel || !newDye || !newPressure || !newDiv || !newFwd || !newBack) {
        solver.freeDouble(newVel);
        solver.freeDouble(newDye);
        solver.freeDouble(newPressure);
        solver.free(newDiv);
        solver.free(newFwd);
        solver.free(newBack);
        return;
      }

      const canPreserve = isAllocated && oldVel && oldDye;
      if (canPreserve) {
        solver.use(pAdvectSample);
        solver.v2('u_simTexel', 1, 1);
        solver.f('u_dt', 0);
        solver.f('u_dir', 1);
        solver.tex('u_vel', 1, oldVel.read.tex);
        solver.tex('u_src', 0, oldVel.read.tex);
        solver.blit(newVel.read);
        solver.tex('u_src', 0, oldDye.read.tex);
        solver.blit(newDye.read);
      }

      solver.freeDouble(oldVel);
      solver.freeDouble(oldDye);
      solver.freeDouble(fboPressure);
      solver.free(fboDiv);
      solver.free(fboFwd);
      solver.free(fboBack);

      fboVel = newVel;
      fboDye = newDye;
      fboPressure = newPressure;
      fboDiv = newDiv;
      fboFwd = newFwd;
      fboBack = newBack;

      const warmupSteps = canPreserve ? 8 : (isReducedMotion ? Xh : Yh);
      isAllocated = true;
      spin(warmupSteps);
      clearSplats();
      render();
    }

    function applyBacking() {
      if (width < 2 || height < 2) return;
      pixelScale = Math.min(window.devicePixelRatio || 1, 2) * tiers[currentTier].scale;
      const targetW = Math.round(width * pixelScale);
      const targetH = Math.round(height * pixelScale);

      if (canvasEl.width !== targetW || canvasEl.height !== targetH) {
        canvasEl.width = targetW;
        canvasEl.height = targetH;
      }
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
    }

    function resize() {
      const rect = containerEl.getBoundingClientRect();
      const newW = rect.width || window.innerWidth;
      const newH = rect.height || window.innerHeight;
      if (newW < 2 || newH < 2) return;

      const isSubstantial = Math.abs(newW - width) > 0.5 || Math.abs(newH - height) > 0.5;
      width = newW;
      height = newH;
      boundsLeft = rect.left;
      boundsTop = rect.top;
      boundsDirty = false;

      applyBacking();
      if (isSubstantial) {
        currentTier = 0;
        timeAboveThreshold = 0;
        timeBelowThreshold = 0;
        recoveryThreshold = 8000;
        smoothFrameDelta = 16.7;
        applyBacking();
        allocate();
      }
      render();
    }

    function loop(time) {
      const deltaMs = time - lastTime;
      lastTime = time;

      const dt = Math.min(0.033, Math.max(0.001, deltaMs / 1000)) * Math.max(0.05, speed);
      advance(dt);
      render();

      // Adaptive performance scaling
      const cappedDelta = Math.min(50, deltaMs);
      smoothFrameDelta += (cappedDelta - smoothFrameDelta) * (1 - Math.exp(-cappedDelta / 120));

      if (smoothFrameDelta > targetFpsThreshold) {
        timeAboveThreshold += cappedDelta;
        timeBelowThreshold = 0;
      } else {
        timeBelowThreshold += cappedDelta;
        timeAboveThreshold = 0;
      }

      const shouldDowngrade = timeAboveThreshold > 1800 && currentTier < tiers.length - 1;
      const shouldUpgrade = timeBelowThreshold > recoveryThreshold && currentTier > 0;

      if (shouldDowngrade || shouldUpgrade) {
        currentTier += shouldDowngrade ? 1 : -1;
        if (shouldDowngrade) recoveryThreshold = Math.min(64000, recoveryThreshold * 2);
        timeAboveThreshold = 0;
        timeBelowThreshold = 0;
        smoothFrameDelta = 16.7;
        applyBacking();
        allocate();
      }

      animFrameId = requestAnimationFrame(loop);
    }

    function wake() {
      if (!isRunning && !isDestroyed && !paused) {
        isRunning = true;
        lastTime = performance.now();
        animFrameId = requestAnimationFrame(loop);
      }
    }

    function sleep() {
      cancelAnimationFrame(animFrameId);
      isRunning = false;
    }

    function syncBounds() {
      if (!boundsDirty) return;
      const rect = containerEl.getBoundingClientRect();
      boundsLeft = rect.left;
      boundsTop = rect.top;
      boundsDirty = false;
    }

    function markBoundsDirty() {
      boundsDirty = true;
    }

    function setTarget(e) {
      syncBounds();
      const coalesced = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : null;
      const pt = coalesced && coalesced.length > 0 ? coalesced[coalesced.length - 1] : e;
      targetX = pt.clientX - boundsLeft;
      targetY = pt.clientY - boundsTop;
    }

    function snapPointer() {
      filterX = targetX;
      filterY = targetY;
      velX = 0;
      velY = 0;
      lastX = targetX;
      lastY = targetY;
      trailX = targetX;
      trailY = targetY;
      lastPointerTime = simTime;
      hasPointer = true;
    }

    function staticStir() {
      if (width < 2) return;
      clearSplats();
      setSplat(L0, targetX / width, 1 - targetY / height, 0.05, 0.9 * Math.max(0.25, density), 0, 0, 0.2);
      step(V0);
      clearSplats();
      render();
    }

    function onPointerEnter(e) {
      setTarget(e);
      snapPointer();
      if (isReducedMotion) staticStir();
    }

    function onPointerLeave() {
      hasPointer = false;
    }

    function onPointerMove(e) {
      setTarget(e);
      if (!hasPointer) snapPointer();
      if (isReducedMotion) {
        filterX = targetX;
        filterY = targetY;
        staticStir();
      }
    }

    function onPointerDown(e) {
      setTarget(e);
      snapPointer();
      if (isReducedMotion) {
        staticStir();
        return;
      }
      // Drop a fresh vibrant bead on press
      const pulseAngle = simTime * 2.7;
      setSplat(
        Q0,
        targetX / width,
        1 - targetY / height,
        0.085,
        2.2 * Math.max(0.25, density),
        Math.cos(pulseAngle) * 210,
        Math.sin(pulseAngle) * 210,
        0.3
      );
    }

    function onPointerUp(e) {
      if (e.pointerType !== 'mouse') hasPointer = false;
    }

    function onPointerCancel() {
      hasPointer = false;
    }

    // Attach listeners to window so pointer interactions seamlessly stir dye across the entire page
    window.addEventListener('pointerenter', onPointerEnter);
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerCancel, { passive: true });
    window.addEventListener('scroll', markBoundsDirty, { passive: true, capture: true });
    window.addEventListener('resize', markBoundsDirty, { passive: true });

    // Reduced motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    isReducedMotion = mq.matches;
    function onReducedMotionChange() {
      isReducedMotion = mq.matches;
      if (isReducedMotion) {
        sleep();
        spin(60);
        clearSplats();
        render();
      } else {
        wake();
      }
    }
    mq.addEventListener('change', onReducedMotionChange);

    // ResizeObserver on container
    let rafResize = 0;
    const ro = new ResizeObserver(() => {
      if (!rafResize) {
        rafResize = requestAnimationFrame(() => {
          rafResize = 0;
          resize();
        });
      }
    });
    ro.observe(containerEl);
    resize();
    if (width >= 2 && !fboVel) allocate();

    // IntersectionObserver to pause when hidden
    let isIntersecting = true;
    const io = new IntersectionObserver((entries) => {
      isIntersecting = entries.some(entry => entry.isIntersecting);
      if (isIntersecting && !isReducedMotion && !document.hidden) {
        wake();
      } else {
        sleep();
      }
    }, { threshold: 0 });
    io.observe(containerEl);

    // Tab visibility
    function onVisibility() {
      if (document.hidden) {
        sleep();
      } else if (!isReducedMotion && isIntersecting) {
        wake();
      }
    }
    document.addEventListener('visibilitychange', onVisibility);

    // MutationObserver to watch theme attribute changes
    const mo = new MutationObserver(() => {
      readColors();
      if (!isRunning) render();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });

    // WebGL Context Lost / Restored
    function onContextLost(e) {
      e.preventDefault();
      sleep();
    }
    function onContextRestored() {
      if (solver.init()) {
        resize();
        allocate();
        wake();
      }
    }
    canvasEl.addEventListener('webglcontextlost', onContextLost);
    canvasEl.addEventListener('webglcontextrestored', onContextRestored);

    if (isReducedMotion) {
      clearSplats();
      render();
    } else {
      wake();
    }

    return {
      solver,
      wake,
      sleep,
      dropBead: (x, y, radius = 0.08, force = 240, accent = 0.35) => {
        if (width < 2 || height < 2) return;
        const uvX = Math.max(0, Math.min(1, x / width));
        const uvY = Math.max(0, Math.min(1, 1 - y / height));
        const ang = Math.random() * Math.PI * 2;
        setSplat(Q0, uvX, uvY, radius, 2.2 * Math.max(0.3, density), Math.cos(ang) * force, Math.sin(ang) * force, accent);
      },
      inkSplash: (x, y, count = 6, force = 360, radius = 0.09) => {
        if (width < 2 || height < 2) return;
        const cx = Math.max(0, Math.min(1, x / width));
        const cy = Math.max(0, Math.min(1, 1 - y / height));
        setSplat(Q0, cx, cy, radius * 1.3, 3.5 * Math.max(0.4, density), 0, 0, 0.75);

        let frame = 0;
        const burst = () => {
          if (frame >= 3 || isDestroyed) return;
          const stepAngle = (Math.PI * 2) / count;
          const offsetAngle = frame * 0.45;
          for (let i = 0; i < Math.min(count, 5); i++) {
            const angle = i * stepAngle + offsetAngle + (Math.random() - 0.5) * 0.3;
            const dist = (0.02 + frame * 0.035) * (0.8 + Math.random() * 0.4);
            const px = Math.max(0, Math.min(1, cx + Math.cos(angle) * dist));
            const py = Math.max(0, Math.min(1, cy + Math.sin(angle) * dist));
            const mag = force * (1 - frame * 0.22) * (0.85 + Math.random() * 0.3);
            const slot = L0 + (i % (Th - 1));
            setSplat(
              slot,
              px,
              py,
              radius * (0.85 - frame * 0.15),
              (2.2 - frame * 0.4) * Math.max(0.3, density),
              Math.cos(angle) * mag,
              Math.sin(angle) * mag,
              frame === 0 ? 0.6 : 0.2
            );
          }
          frame++;
          requestAnimationFrame(burst);
        };
        burst();
      },
      strikeSlash: (x1, y1, x2, y2, intensity = 2.0) => {
        if (width < 2 || height < 2) return;
        const startX = (x1 !== undefined ? x1 : width * 0.88) / width;
        const startY = 1 - (y1 !== undefined ? y1 : height * 0.12) / height;
        const endX = (x2 !== undefined ? x2 : width * 0.12) / width;
        const endY = 1 - (y2 !== undefined ? y2 : height * 0.88) / height;

        const dx = endX - startX;
        const dy = endY - startY;
        const len = Math.max(0.001, Math.hypot(dx, dy));
        const nx = -dy / len;
        const ny = dx / len;

        let stepIdx = 0;
        const totalSteps = 6;
        const slashLoop = () => {
          if (stepIdx >= totalSteps || isDestroyed) return;
          const t = stepIdx / (totalSteps - 1);
          const curX = startX + dx * t;
          const curY = startY + dy * t;
          const speed = 550 * intensity;
          const slotA = L0 + (stepIdx % 3);
          const slotB = L0 + 3 + (stepIdx % 3);

          setSplat(slotA, curX + nx * 0.02, curY + ny * 0.02, 0.065, 3.2 * density, nx * speed, ny * speed, 0.9);
          setSplat(slotB, curX - nx * 0.02, curY - ny * 0.02, 0.065, 3.2 * density, -nx * speed, -ny * speed, 0.5);

          stepIdx++;
          requestAnimationFrame(slashLoop);
        };
        slashLoop();
      },
      drawBrush: (x, y, vx = 0, vy = 0, radius = 0.065, dyeMult = 3.0) => {
        if (width < 2 || height < 2) return;
        const uvX = Math.max(0, Math.min(1, x / width));
        const uvY = Math.max(0, Math.min(1, 1 - y / height));
        const slot = L0 + Math.floor(Math.random() * (Th - 1));
        setSplat(
          slot,
          uvX,
          uvY,
          radius,
          dyeMult * Math.max(0.4, density),
          vx * 1.5,
          -vy * 1.5,
          Math.random() < 0.25 ? 0.7 : 0.05
        );
      },
      setDensity: (val) => { density = val; },
      setStir: (val) => { stir = val; },
      destroy: () => {
        isDestroyed = true;
        ro.disconnect();
        io.disconnect();
        cancelAnimationFrame(rafResize);
        mq.removeEventListener('change', onReducedMotionChange);
        document.removeEventListener('visibilitychange', onVisibility);
        mo.disconnect();
        canvasEl.removeEventListener('webglcontextlost', onContextLost);
        canvasEl.removeEventListener('webglcontextrestored', onContextRestored);

        window.removeEventListener('pointerenter', onPointerEnter);
        window.removeEventListener('pointerleave', onPointerLeave);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
        window.removeEventListener('scroll', markBoundsDirty, { capture: true });
        window.removeEventListener('resize', markBoundsDirty);

        sleep();
        solver.destroy();
      }
    };
  }

  global.initDyeWhorl = initDyeWhorl;
})(typeof window !== 'undefined' ? window : this);
