import { runWhileVisible } from "./loop";

/**
 * Raw WebGL plasma for PlasmaHero (design.md §9.1). Loaded with a dynamic import after idle so it
 * never competes with the hero text (the LCP element). Domain-warped value noise in saffron,
 * magenta and violet over the page background, with a vignette to keep copy readable.
 */

const RENDER_SCALE = 0.6;
const FPS = 30;

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = rot * p * 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.05;

  vec2 q = vec2(fbm(p * 1.4 + vec2(0.0, t)), fbm(p * 1.4 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p * 1.4 + 3.0 * q + vec2(1.7, 9.2) + 1.3 * t),
                fbm(p * 1.4 + 3.0 * q + vec2(8.3, 2.8) - 0.9 * t));
  float f = fbm(p * 1.4 + 3.2 * r);

  vec3 bg = vec3(0.027, 0.024, 0.059);
  vec3 saffron = vec3(0.961, 0.620, 0.043);
  vec3 magenta = vec3(0.859, 0.153, 0.467);
  vec3 violet = vec3(0.486, 0.227, 0.929);

  vec3 col = mix(violet, magenta, smoothstep(0.25, 0.85, q.x));
  col = mix(col, saffron, smoothstep(0.5, 0.95, r.y) * 0.8);
  float glow = smoothstep(0.3, 0.95, f);
  col = mix(bg, col, glow * 0.7);

  float vignette = smoothstep(1.25, 0.15, length(p * vec2(0.75, 1.0)));
  col = mix(bg, col, vignette * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export interface PlasmaCallbacks {
  onReady: () => void;
  onLost: () => void;
}

/**
 * Creates its own canvas inside `host` (a fresh canvas per mount keeps StrictMode's double
 * effect from reusing a context we already released). Returns a disposer; a no-op when WebGL
 * is unavailable, in which case the caller's static gradient simply stays visible.
 */
export function startPlasma(host: HTMLElement, callbacks: PlasmaCallbacks): () => void {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";

  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "low-power",
  });
  if (!gl) return () => {};

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  const release = () => {
    if (vs) gl.deleteShader(vs);
    if (fs) gl.deleteShader(fs);
    if (program) gl.deleteProgram(program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
  if (!vs || !fs || !program) {
    release();
    return () => {};
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    release();
    return () => {};
  }
  gl.useProgram(program);

  // One oversized triangle covers the viewport with fewer vertices than a quad.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(program, "uRes");
  const uTime = gl.getUniformLocation(program, "uTime");

  host.appendChild(canvas);

  let width = 0;
  let height = 0;
  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 1) * RENDER_SCALE;
    const w = Math.max(1, Math.round(host.clientWidth * scale));
    const h = Math.max(1, Math.round(host.clientHeight * scale));
    if (w === width && h === height) return;
    width = w;
    height = h;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  // Start mid-flow so the first frame already looks developed.
  const t0 = performance.now() - 40_000;
  let ready = false;
  let stopLoop = runWhileVisible(host, FPS, (now) => {
    if (gl.isContextLost()) return;
    gl.uniform2f(uRes, width, height);
    gl.uniform1f(uTime, (now - t0) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!ready) {
      ready = true;
      callbacks.onReady();
    }
  });

  const onLost = () => {
    stopLoop();
    stopLoop = () => {};
    callbacks.onLost();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  return () => {
    stopLoop();
    ro.disconnect();
    canvas.removeEventListener("webglcontextlost", onLost);
    if (buffer) gl.deleteBuffer(buffer);
    release();
    canvas.remove();
  };
}
