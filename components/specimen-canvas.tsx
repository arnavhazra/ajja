"use client";

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_mouse;
uniform float u_time;
uniform vec2 u_res;
uniform float u_imgAspect;
uniform vec2 u_focal;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // Cursor ripple: a small radial displacement breathing around the pointer.
  vec2 d = v_uv - u_mouse;
  d.x *= u_res.x / u_res.y;
  float dist = length(d);
  float ripple = sin(dist * 26.0 - u_time * 3.0) * exp(-dist * 6.5) * 0.004;
  vec2 dir = dist > 1e-5 ? d / dist : vec2(0.0);
  vec2 uv = v_uv + dir * ripple;
  uv += vec2(sin(u_time * 0.32) * 0.0012, cos(u_time * 0.26) * 0.0012);

  // object-cover mapping with object-position focal point.
  float ca = u_res.x / u_res.y;
  vec2 imgUv;
  if (u_imgAspect > ca) {
    float visW = ca / u_imgAspect;
    float x0 = clamp(u_focal.x - visW * 0.5, 0.0, 1.0 - visW);
    imgUv = vec2(x0 + uv.x * visW, uv.y);
  } else {
    float visH = u_imgAspect / ca;
    float y0 = clamp(u_focal.y - visH * 0.5, 0.0, 1.0 - visH);
    imgUv = vec2(uv.x, 1.0 - y0 - (1.0 - uv.y) * visH);
  }

  vec4 col = texture2D(u_tex, imgUv);

  // Animated film grain, held low so pigment reads true.
  float g = hash(uv + fract(u_time * 0.61));
  col.rgb += (g - 0.5) * 0.045;

  float vg = smoothstep(1.0, 0.42, length(v_uv - 0.5));
  col.rgb *= mix(0.965, 1.0, vg);

  gl_FragColor = col;
}
`;

/**
 * WebGL treatment for the hero specimen: the same photograph drawn through a
 * fragment shader — a quiet cursor ripple, animated grain, and a slow drift.
 * Sits over the <img>, which remains the no-JS/reduced-motion fallback and
 * the LCP element. Removed entirely if WebGL or the texture fails.
 */
export function SpecimenCanvas({
  src,
  focalX,
  focalY,
}: {
  src: string;
  focalX: number;
  focalY: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const canvas = canvasRef.current;
    const holder = canvas?.parentElement;
    if (!canvas || !holder) return;
    const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (!gl) {
      canvas.remove();
      return;
    }

    let raf = 0;
    let running = true;
    let onScreen = true;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    const compile = (type: number, source: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) {
      canvas.remove();
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      canvas.remove();
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_res");
    const uAspect = gl.getUniformLocation(prog, "u_imgAspect");
    const uFocal = gl.getUniformLocation(prog, "u_focal");
    gl.uniform2f(uFocal, focalX, focalY);

    const resize = () => {
      const rect = holder.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(holder);
    resize();

    const onMove = (event: PointerEvent) => {
      const rect = holder.getBoundingClientRect();
      mouse.tx = (event.clientX - rect.left) / rect.width;
      mouse.ty = 1 - (event.clientY - rect.top) / rect.height;
    };
    holder.addEventListener("pointermove", onMove, { passive: true });

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });
    io.observe(holder);
    const onVis = () => {
      running = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      } catch {
        canvas.remove();
        return;
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1f(uAspect, img.naturalWidth / img.naturalHeight);
      canvas.dataset.ready = "true";

      const t0 = performance.now();
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (!running || !onScreen) return;
        mouse.x += (mouse.tx - mouse.x) * 0.075;
        mouse.y += (mouse.ty - mouse.y) * 0.075;
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.uniform1f(uTime, (now - t0) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      raf = requestAnimationFrame(frame);
    };
    img.onerror = () => canvas.remove();
    img.src = src;

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      holder.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [src, focalX, focalY]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700 data-[ready=true]:opacity-100"
    />
  );
}
