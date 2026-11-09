"use client";

import { useEffect, useRef } from "react";

type Props = { src: string; focalX: number; focalY: number };

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Object-fit: cover with the same focal point as the <Image> underneath, then a
// wet ripple around the pointer and a thin specular sheen on its crests.
const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uFocal;
uniform vec2 uMouse;
uniform float uStrength;
uniform float uTime;
void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  float s = max(uRes.x / uImg.x, uRes.y / uImg.y);
  vec2 shown = uImg * s;
  vec2 offset = (uRes - shown) * uFocal;
  vec2 delta = px - uMouse;
  float d = length(delta);
  float reach = 160.0 * (uRes.x / 900.0 + 0.4);
  float fall = exp(-(d * d) / (2.0 * reach * reach));
  float wave = sin(d * 0.055 - uTime * 3.2) * fall * uStrength;
  vec2 dir = d > 0.001 ? delta / d : vec2(0.0);
  vec2 uv = (px - offset + dir * wave * 7.0) / shown;
  vec4 colour = texture2D(uTex, clamp(uv, 0.0, 1.0));
  float sheen = pow(max(wave, 0.0), 3.0) * 0.16;
  gl_FragColor = vec4(colour.rgb + sheen, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
  return shader;
}

/**
 * Wet-pigment ripple over the hero photograph. Fine pointers only, never with
 * reduced motion; the optimised <Image> underneath is always the fallback, and
 * the canvas only shows once its texture is ready.
 */
export function PourCanvas({ src, focalX, focalY }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false, antialias: false });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
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
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uRes = u("uRes");
    const uImg = u("uImg");
    const uMouse = u("uMouse");
    const uStrength = u("uStrength");
    const uTime = u("uTime");
    gl.uniform2f(u("uFocal"), focalX, focalY);

    let raf = 0;
    let ready = false;
    let strength = 0;
    let target = 0;
    const mouse = { x: 0, y: 0 };
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const start = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    const frame = () => {
      strength += (target - strength) * 0.08;
      gl.uniform1f(uStrength, strength);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform2f(uMouse, mouse.x * dpr, mouse.y * dpr);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = strength > 0.002 || target > 0 ? requestAnimationFrame(frame) : 0;
    };
    const wake = () => {
      if (ready && !raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
      const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right);
      const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom);
      target = Math.hypot(dx, dy) <= 120 ? 1 : 0;
      wake();
    };
    const onLeave = () => {
      target = 0;
      wake();
    };

    const image = new window.Image();
    image.decoding = "async";
    image.src = `/_next/image?url=${encodeURIComponent(src)}&w=1920&q=75`;
    image.onload = () => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      gl.uniform2f(uImg, image.naturalWidth, image.naturalHeight);
      resize();
      ready = true;
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      canvas.dataset.ready = "true";
    };

    const observer = new ResizeObserver(() => {
      resize();
      if (ready) gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
    observer.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      image.onload = null;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [src, focalX, focalY]);

  return <canvas ref={ref} className="pr-canvas" aria-hidden="true" />;
}
