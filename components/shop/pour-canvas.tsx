"use client";

import { useEffect, useRef, useState } from "react";

const VERTEX = `
attribute vec2 p;
varying vec2 v;
void main() { v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }
`;

/* The painting's own pixels, nudged by a slow flow field and by the pointer, like pigment that is still wet. */
const FRAGMENT = `
precision highp float;
varying vec2 v;
uniform sampler2D img;
uniform vec2 res;
uniform vec2 imgRes;
uniform vec2 focal;
uniform vec2 mouse;
uniform float strength;
uniform float t;

vec2 cover(vec2 uv) {
  float rs = res.x / res.y;
  float ri = imgRes.x / imgRes.y;
  vec2 scale = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return (uv - 0.5) * scale + mix(vec2(0.5), focal, 1.0 - scale) ;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

void main() {
  vec2 uv = vec2(v.x, 1.0 - v.y);
  vec2 aspect = vec2(res.x / res.y, 1.0);
  float n1 = noise(uv * 3.0 + vec2(t * 0.05, -t * 0.04));
  float n2 = noise(uv * 3.0 + vec2(-t * 0.04, t * 0.05) + 7.3);
  vec2 flow = (vec2(n1, n2) - 0.5) * 0.012;
  vec2 d = (uv - mouse) * aspect;
  float fall = exp(-dot(d, d) * 18.0) * strength;
  vec2 swirl = vec2(-d.y, d.x) * fall * 0.22 + d * fall * -0.05;
  vec2 offset = flow + swirl;

  /* Subtle viscous chromatic refraction and glossy wet-paint sheen */
  vec2 stR = cover(uv + offset * 1.018);
  vec2 stG = cover(uv + offset);
  vec2 stB = cover(uv + offset * 0.982);
  float r = texture2D(img, stR).r;
  float g = texture2D(img, stG).g;
  float b = texture2D(img, stB).b;
  vec3 col = vec3(r, g, b);

  /* Gloss specular highlight along the pointer's fluid wake */
  float sheen = fall * 0.05 + pow(fall, 2.5) * 0.09;
  col += sheen;
  gl_FragColor = vec4(col, 1.0);
}
`;

type Props = { src: string; focalX: number; focalY: number; className?: string };

export function PourCanvas({ src, focalX, focalY, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Mount the GL work only after the page is idle (post-LCP) and the canvas is on screen.
  const [mount, setMount] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let idle = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const idleWindow = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
      if (idleWindow.requestIdleCallback) {
        idle = idleWindow.requestIdleCallback(() => setMount(true), { timeout: 2500 });
      } else {
        idle = window.setTimeout(() => setMount(true), 300);
      }
    });
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      if (idle) window.clearTimeout(idle as number);
    };
  }, []);

  useEffect(() => {
    if (!mount) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uRes = u("res");
    const uImgRes = u("imgRes");
    const uMouse = u("mouse");
    const uStrength = u("strength");
    const uTime = u("t");
    gl.uniform2f(u("focal"), focalX, focalY);

    let frame = 0;
    let visible = true;
    let ready = false;
    let checked = false;
    /** Some drivers draw a blank frame; keep the photograph unless the shader really shows the painting. */
    const paints = () => {
      const px = new Uint8Array(4);
      const seen = new Set<string>();
      for (const [x, y] of [[0.3, 0.3], [0.7, 0.3], [0.5, 0.5], [0.3, 0.7], [0.7, 0.7]]) {
        gl.readPixels(Math.floor(canvas.width * x), Math.floor(canvas.height * y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        seen.add(`${px[0] >> 4}-${px[1] >> 4}-${px[2] >> 4}`);
      }
      return seen.size > 1;
    };
    const target = { x: 0.5, y: 0.5, s: 0 };
    const current = { x: 0.5, y: 0.5, s: 0 };
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    const render = () => {
      frame = 0;
      if (!visible || !ready || document.hidden) return;
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      current.s += (target.s - current.s) * 0.06;
      gl.uniform2f(uMouse, current.x, current.y);
      gl.uniform1f(uStrength, current.s);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!checked) {
        checked = true;
        if (!paints()) {
          canvas.dataset.ready = "false";
          ready = false;
          return;
        }
        canvas.dataset.ready = "true";
      }
      frame = requestAnimationFrame(render);
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    let texture: WebGLTexture | null = null;
    image.onload = () => {
      if (gl.isContextLost()) return;
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      } catch {
        return;
      }
      gl.uniform2f(uImgRes, image.naturalWidth, image.naturalHeight);
      resize();
      ready = true;
      kick();
    };
    image.src = src.startsWith("/") ? src : `/_next/image?url=${encodeURIComponent(src)}&w=1920&q=75`;

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      target.x = (event.clientX - rect.left) / rect.width;
      target.y = (event.clientY - rect.top) / rect.height;
      target.s = 1;
      kick();
    };
    const onLeave = () => {
      target.s = 0;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });
    observer.observe(canvas);
    const onVisibility = () => kick();
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      image.onload = null;
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [mount, src, focalX, focalY]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 size-full opacity-0 transition-opacity duration-700 data-[ready=true]:opacity-100 ${className ?? ""}`}
    />
  );
}
