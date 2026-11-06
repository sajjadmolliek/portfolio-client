'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';

/**
 * The hero banner of the original site is not a still image: it renders a WebGL
 * starfield that slowly drifts, twinkles and repels away from the cursor. The
 * capture could not keep that (it is a canvas appended at runtime), so the
 * shader is replayed here, mounted into the empty box the banner ships:
 *
 *   [data-slot="hero-banner"] .banner-frame > div   ← the component's host
 *
 * The GLSL, the uniform defaults and the frame budget below are the original's;
 * its `<StarField mouseRepulsion mouseInteraction density={1.5}
 * glowIntensity={.2} saturation={.1} hueShift={240} />` call is what the prop
 * defaults here reproduce, so the banner looks the way the original did.
 */

const VERT = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const FRAG = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;

varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare) {
  float d = length(uv);
  float m = (0.05 * uGlowIntensity) / d;
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uGlowIntensity;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0);

  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + vec2(float(x), float(y));
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

      float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
      float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
      float grn = min(red, blu) * seed;
      vec3 base = vec3(red, grn, blu);

      float hue = atan(base.g - base.r, base.b - base.r) / (2.0 * 3.14159) + 0.5;
      hue = fract(hue + uHueShift / 360.0);
      float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation;
      float val = max(max(base.r, base.g), base.b);
      base = hsv2rgb(vec3(hue, sat, val));

      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;

      float star = Star(gv - offset - pad, flareSize);
      vec3 color = base;

      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      star *= twinkle;

      col += star * size * color;
    }
  }

  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;

  vec2 mouseNorm = uMouse - vec2(0.5);

  if (uAutoCenterRepulsion > 0.0) {
    vec2 centerUV = vec2(0.0, 0.0); // Center in UV space
    float centerDist = length(uv - centerUV);
    vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
    uv += repulsion * 0.05;
  } else if (uMouseRepulsion) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    float mouseDist = length(uv - mousePosUV);
    vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
    uv += repulsion * 0.05 * uMouseActiveFactor;
  } else {
    vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
    uv += mouseOffset;
  }

  float autoRotAngle = uTime * uRotationSpeed;
  mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
  uv = autoRot * uv;

  uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

  vec3 col = vec3(0.0);

  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
    float depth = fract(i + uStarSpeed * uSpeed);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv * scale + i * 453.32) * fade;
  }

  if (uTransparent) {
    float alpha = length(col);
    alpha = smoothstep(0.0, 0.3, alpha); // Enhance contrast
    alpha = min(alpha, 1.0); // Clamp to maximum 1.0
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

/** The original rendered at 0.6 device pixels per CSS pixel and 30fps. */
const DPR = 0.6;
const FRAME_MS = 1000 / 30;

type StarfieldProps = {
  focal?: [number, number];
  rotation?: [number, number];
  starSpeed?: number;
  density?: number;
  hueShift?: number;
  speed?: number;
  glowIntensity?: number;
  saturation?: number;
  repulsionStrength?: number;
  twinkleIntensity?: number;
  rotationSpeed?: number;
};

const UNIFORM_NAMES = [
  'uTime',
  'uResolution',
  'uFocal',
  'uRotation',
  'uStarSpeed',
  'uDensity',
  'uHueShift',
  'uSpeed',
  'uMouse',
  'uGlowIntensity',
  'uSaturation',
  'uMouseRepulsion',
  'uTwinkleIntensity',
  'uRotationSpeed',
  'uRepulsionStrength',
  'uMouseActiveFactor',
  'uAutoCenterRepulsion',
  'uTransparent',
] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('could not create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(log || 'shader failed to compile');
  }
  return shader;
}

function link(gl: WebGLRenderingContext) {
  const program = gl.createProgram();
  if (!program) throw new Error('could not create program');
  const vert = compile(gl, gl.VERTEX_SHADER, VERT);
  const frag = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(log || 'program failed to link');
  }
  return program;
}

function quadBuffer(gl: WebGLRenderingContext, data: number[]) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  return buffer;
}

/**
 * Starts the original's render loop on `canvas`. Returns the teardown, or a
 * no-op when WebGL is unavailable — the banner already has its black background
 * and copy, so a missing GPU context degrades to a plain hero.
 */
function startStarfield(canvas: HTMLCanvasElement, props: Required<StarfieldProps>, still: boolean) {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false });
  } catch {
    gl = null;
  }
  if (!gl) return () => {};

  const ctx = gl;
  let program: WebGLProgram;
  try {
    program = link(ctx);
  } catch {
    return () => {};
  }

  // OGL's Triangle: a single oversized triangle that covers the viewport.
  const position = quadBuffer(ctx, [-1, -1, 3, -1, -1, 3]);
  const uv = quadBuffer(ctx, [0, 0, 2, 0, 0, 2]);
  const positionLoc = ctx.getAttribLocation(program, 'position');
  const uvLoc = ctx.getAttribLocation(program, 'uv');

  const locations = {} as Record<UniformName, WebGLUniformLocation | null>;
  for (const name of UNIFORM_NAMES) locations[name] = ctx.getUniformLocation(program, name);

  const target = { x: 0.5, y: 0.5 };
  const smooth = { x: 0.5, y: 0.5 };
  const active = { wants: 0, value: 0 };
  const resolution: [number, number, number] = [1, 1, 1];

  ctx.enable(ctx.BLEND);
  ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);
  ctx.clearColor(0, 0, 0, 0);
  ctx.useProgram(program);

  const resize = () => {
    const host = canvas.parentElement;
    const width = Math.max(1, host?.offsetWidth || canvas.offsetWidth || 1);
    const height = Math.max(1, host?.offsetHeight || canvas.offsetHeight || 1);
    canvas.width = Math.round(width * DPR);
    canvas.height = Math.round(height * DPR);
    resolution[0] = canvas.width;
    resolution[1] = canvas.height;
    resolution[2] = canvas.width / canvas.height;
    ctx.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();

  const draw = (time: number) => {
    if (!canvas.isConnected) return;
    ctx.useProgram(program);
    ctx.bindBuffer(ctx.ARRAY_BUFFER, position);
    ctx.enableVertexAttribArray(positionLoc);
    ctx.vertexAttribPointer(positionLoc, 2, ctx.FLOAT, false, 0, 0);
    ctx.bindBuffer(ctx.ARRAY_BUFFER, uv);
    ctx.enableVertexAttribArray(uvLoc);
    ctx.vertexAttribPointer(uvLoc, 2, ctx.FLOAT, false, 0, 0);

    ctx.uniform1f(locations.uTime, time * 0.001);
    ctx.uniform1f(locations.uStarSpeed, time * 0.001 * props.starSpeed / 10);
    ctx.uniform3f(locations.uResolution, resolution[0], resolution[1], resolution[2]);
    ctx.uniform2f(locations.uFocal, props.focal[0], props.focal[1]);
    ctx.uniform2f(locations.uRotation, props.rotation[0], props.rotation[1]);
    ctx.uniform2f(locations.uMouse, smooth.x, smooth.y);
    ctx.uniform1f(locations.uDensity, props.density);
    ctx.uniform1f(locations.uHueShift, props.hueShift);
    ctx.uniform1f(locations.uSpeed, props.speed);
    ctx.uniform1f(locations.uGlowIntensity, props.glowIntensity);
    ctx.uniform1f(locations.uSaturation, props.saturation);
    ctx.uniform1i(locations.uMouseRepulsion, 1);
    ctx.uniform1f(locations.uTwinkleIntensity, props.twinkleIntensity);
    ctx.uniform1f(locations.uRotationSpeed, props.rotationSpeed);
    ctx.uniform1f(locations.uRepulsionStrength, props.repulsionStrength);
    ctx.uniform1f(locations.uMouseActiveFactor, active.value);
    ctx.uniform1f(locations.uAutoCenterRepulsion, 0);
    ctx.uniform1i(locations.uTransparent, 1);

    ctx.clear(ctx.COLOR_BUFFER_BIT);
    ctx.drawArrays(ctx.TRIANGLES, 0, 3);
  };

  // first frame, so the banner never shows an empty box while waiting a tick
  draw(1);

  // NOTE: the context is deliberately kept alive on teardown. `loseContext()`
  // is permanent, and React strict mode mounts this effect twice — the second
  // mount would inherit a dead context and draw nothing.
  if (still) {
    const onResize = () => { resize(); draw(1); };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }

  let raf = 0;
  let last = 0;
  let playing = false;
  let visible = true;

  const frame = (time: number) => {
    if (!playing) return;
    raf = requestAnimationFrame(frame);
    if (time - last < FRAME_MS) return;
    last = time;
    // the cursor position/repulsion ease in over a few frames, as it did live
    smooth.x += (target.x - smooth.x) * 0.05;
    smooth.y += (target.y - smooth.y) * 0.05;
    active.value += (active.wants - active.value) * 0.05;
    draw(time);
  };

  const play = () => {
    if (playing) return;
    playing = true;
    raf = requestAnimationFrame(frame);
  };
  const pause = () => {
    playing = false;
    cancelAnimationFrame(raf);
  };
  const sync = () => {
    if (visible && !document.hidden) play();
    else pause();
  };

  const onPointerMove = (event: PointerEvent) => {
    const host = canvas.parentElement;
    if (!host) return;
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    target.x = (event.clientX - rect.left) / rect.width;
    target.y = 1 - (event.clientY - rect.top) / rect.height;
    active.wants = 1;
  };
  const onPointerLeave = () => {
    active.wants = 0;
  };
  const onVisibility = () => sync();
  const onResize = () => resize();

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { threshold: 0 });

  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  canvas.parentElement?.addEventListener('pointermove', onPointerMove);
  canvas.parentElement?.addEventListener('pointerleave', onPointerLeave);
  observer.observe(canvas.parentElement ?? canvas);
  sync();

  return () => {
    observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('resize', onResize);
    canvas.parentElement?.removeEventListener('pointermove', onPointerMove);
    canvas.parentElement?.removeEventListener('pointerleave', onPointerLeave);
    pause();
    ctx.deleteBuffer(position);
    ctx.deleteBuffer(uv);
    ctx.deleteProgram(program);
  };
}

export default function BannerStarfield({
  focal = [0.5, 0.5],
  rotation = [1, 0],
  starSpeed = 0.5,
  density = 1.5,
  hueShift = 240,
  speed = 1,
  glowIntensity = 0.2,
  saturation = 0.1,
  repulsionStrength = 2,
  twinkleIntensity = 0.3,
  rotationSpeed = 0.1,
}: StarfieldProps) {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);

  // the banner is part of the captured markup, so the canvas is portalled into
  // the empty box it already ships instead of rendering it loose in the layout
  useEffect(() => {
    setHost(document.querySelector<HTMLElement>('[data-slot="hero-banner"] .banner-frame > div'));
  }, [pathname]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return startStarfield(
      canvas,
      {
        focal,
        rotation,
        starSpeed,
        density,
        hueShift,
        speed,
        glowIntensity,
        saturation,
        repulsionStrength,
        twinkleIntensity,
        rotationSpeed,
      },
      still,
    );
    // the uniforms never change at runtime; re-initialising on every parent
    // render would drop and rebuild the GL context
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host]);

  if (!host) return null;
  return createPortal(
    <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />,
    host,
  );
}
