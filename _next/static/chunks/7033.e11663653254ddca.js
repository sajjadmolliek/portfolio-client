"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[7033],{37033:(e,t,o)=>{o.r(t),o.d(t,{default:()=>f});var n=o(95155),u=o(22634),a=o(16748),r=o(373),i=o(41519),l=o(10204),s=o(12115);let c=`
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`,v=`
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
`;function f({focal:e=[.5,.5],rotation:t=[1,0],starSpeed:o=.5,density:m=1,hueShift:d=140,disableAnimation:p=!1,speed:h=1,mouseInteraction:w=!0,glowIntensity:R=.3,saturation:y=0,mouseRepulsion:x=!0,repulsionStrength:g=2,twinkleIntensity:S=.3,rotationSpeed:b=.1,autoCenterRepulsion:A=0,transparent:C=!0,...F}){let L=(0,s.useRef)(null),T=(0,s.useRef)({x:.5,y:.5}),E=(0,s.useRef)({x:.5,y:.5}),_=(0,s.useRef)(0),O=(0,s.useRef)(0);return(0,s.useEffect)(()=>{let n;if(!L.current)return;let s=L.current,f=1e3/30,F=!1,M=null,U=()=>{let n,U;if(F||!L.current)return;F=!0;let I=new u.A({alpha:C,premultipliedAlpha:!1,dpr:.6}),k=I.gl;function z(){I.setSize(s.offsetWidth,s.offsetHeight),n&&(n.uniforms.uResolution.value=new a.Q(k.canvas.width,k.canvas.height,k.canvas.width/k.canvas.height))}C?(k.enable(k.BLEND),k.blendFunc(k.SRC_ALPHA,k.ONE_MINUS_SRC_ALPHA),k.clearColor(0,0,0,0)):k.clearColor(0,0,0,1),window.addEventListener("resize",z,!1),z();let D=new r.l(k);n=new i.B(k,{vertex:c,fragment:v,uniforms:{uTime:{value:0},uResolution:{value:new a.Q(k.canvas.width,k.canvas.height,k.canvas.width/k.canvas.height)},uFocal:{value:new Float32Array(e)},uRotation:{value:new Float32Array(t)},uStarSpeed:{value:o},uDensity:{value:m},uHueShift:{value:d},uSpeed:{value:h},uMouse:{value:new Float32Array([E.current.x,E.current.y])},uGlowIntensity:{value:R},uSaturation:{value:y},uMouseRepulsion:{value:x},uTwinkleIntensity:{value:S},uRotationSpeed:{value:b},uRepulsionStrength:{value:g},uMouseActiveFactor:{value:0},uAutoCenterRepulsion:{value:A},uTransparent:{value:C}}});let N=new l.e(k,{geometry:D,program:n}),P=!1,H=!1,V=!1,G=0;function K(e){!P||(U=requestAnimationFrame(K),e-G<f||(G=e,p||(n.uniforms.uTime.value=.001*e,n.uniforms.uStarSpeed.value=.001*e*o/10),E.current.x+=(T.current.x-E.current.x)*.05,E.current.y+=(T.current.y-E.current.y)*.05,O.current+=(_.current-O.current)*.05,n.uniforms.uMouse.value[0]=E.current.x,n.uniforms.uMouse.value[1]=E.current.y,n.uniforms.uMouseActiveFactor.value=O.current,I.render({scene:N})))}function B(){V&&H&&!document.hidden?P||(P=!0,U=requestAnimationFrame(K)):(P=!1,cancelAnimationFrame(U))}I.render({scene:N}),s.appendChild(k.canvas);let q=["pointerdown","pointermove","wheel","touchstart","keydown"],Y=()=>{if(!V){for(let e of(V=!0,q))window.removeEventListener(e,Y);B()}};for(let e of q)window.addEventListener(e,Y,{once:!0,passive:!0});let Q=new IntersectionObserver(([e])=>{H=e.isIntersecting,B()},{threshold:0});Q.observe(s);let W=()=>B();function j(e){let t=s.getBoundingClientRect();T.current={x:(e.clientX-t.left)/t.width,y:1-(e.clientY-t.top)/t.height},_.current=1}function X(){_.current=0}document.addEventListener("visibilitychange",W),w&&(s.addEventListener("mousemove",j),s.addEventListener("mouseleave",X)),M=()=>{for(let e of(Q.disconnect(),document.removeEventListener("visibilitychange",W),q))window.removeEventListener(e,Y);cancelAnimationFrame(U),window.removeEventListener("resize",z),w&&(s.removeEventListener("mousemove",j),s.removeEventListener("mouseleave",X)),k.canvas.parentNode===s&&s.removeChild(k.canvas),k.getExtension("WEBGL_lose_context")?.loseContext()}},I=()=>{let e=window.requestIdleCallback;n=e?e(U,{timeout:1500}):window.setTimeout(U,200)};return"complete"===document.readyState?I():window.addEventListener("load",I,{once:!0}),()=>{if(window.removeEventListener("load",I),void 0!==n){let e=window.cancelIdleCallback;e?e(n):clearTimeout(n)}M?.()}},[e,t,o,m,d,p,h,w,R,y,x,S,b,g,A,C]),(0,n.jsx)("div",{ref:L,className:"w-full h-full relative",...F})}}}]);
//# sourceMappingURL=7033.e11663653254ddca.js.map