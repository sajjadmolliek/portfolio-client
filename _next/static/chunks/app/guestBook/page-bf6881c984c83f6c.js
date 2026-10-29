(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9516],{18437:(e,t,a)=>{Promise.resolve().then(a.bind(a,87530))},78545:(e,t,a)=>{"use strict";a.d(t,{AuroraText:()=>s});var o=a(95155);let s=(0,a(12115).memo)(({children:e,className:t="",colors:a=["#FF0080","#9D6EF5","#4DA6FF","#38bdf8"],speed:s=1})=>{let l={backgroundImage:`linear-gradient(135deg, ${a.join(", ")}, ${a[0]})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animationDuration:`${10/s}s`,paddingTop:"6px",paddingBottom:"18px",lineHeight:"1.8"};return(0,o.jsxs)("span",{className:`relative inline-block ${t}`,children:[(0,o.jsx)("span",{className:"sr-only",children:e}),(0,o.jsx)("span",{className:"relative animate-aurora bg-[length:200%_auto] bg-clip-text text-transparent",style:l,"aria-hidden":"true",children:e})]})});s.displayName="AuroraText"},87530:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>A});var o=a(95155),s=a(12115),l=a(5772),r=a(37882),i=a(45049),n=a(54452),c=a(41313),d=a(56204),f=a(65770),m=a(67233),g=a(92289),u=a(78545),x=a(66609),h=a(91337);let p={wave:`precision highp float;
uniform vec2 iResolution; uniform float iTime;
const float PI = 3.14159265359;
const float AMPLITUDE   = 0.32;
const float FREQ        = 1.1;
const float ABER_FREQ   = 1.0;
const float SPEED       = 2.4;
const float WAVE_SCALE  = 0.6;
const float ABERRATION  = 2.6;
const float THICKNESS   = 3.0;
const float INTENSITY   = 2.;
const float FALLOFF     = 1.7;
const float EDGE_MASK   = 0.4;
const float EDGE_INSET  = 0.0;
const float BAND_FILL   = 30000.0;
const float BAND_THICK  = 0.08;
const float SOFTNESS    = 2.5;
const float LOW_AMP     = 6.0;
const float LOW_INT     = 1.5;
const float MID_ABER    = 0.8;
const float MID_ABAMP   = 0.05;
const float MID_BAND    = 20.0;
const float MID_SOFT    = 0.4;
const float HIGH_ABER   = 0.5;
const float HIGH_ABAMP  = 0.06;
const float RESOLVED    = 1.0;
const float UNRES_SCALE = 0.14;

vec3 spectral4(int s){
    float x = float(s);
    return clamp(vec3(abs(x-3.0)-1.0, 2.0-abs(x-2.0), 2.0-abs(x-4.0)), 0.0, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 R = iResolution.xy;
    float aspect = R.x / R.y;
    vec2 p = (fragCoord + 0.5) * 2.0 / R - 1.0;
    p.x *= aspect;
    float yScreen = p.y;
    p /= max(WAVE_SCALE, 0.1);

    float t   = iTime;
    float low  = clamp(0.45 + 0.45*sin(t*0.8)*sin(t*0.37+1.0), 0.0, 1.0);
    float mid  = clamp(0.40 + 0.40*sin(t*1.7+2.0)*sin(t*0.53), 0.0, 1.0);
    float high = clamp(0.30 + 0.30*sin(t*2.9+4.0)*sin(t*0.71+2.0), 0.0, 1.0);

    float res   = clamp(RESOLVED, 0.0, 1.0);
    float drift = mod(t, 20.0*PI) * SPEED;

    float xN  = p.x / max(aspect, 1.0);
    float env = cos(PI*0.5 * min(abs(0.9*xN), 1.0));
    env *= env;

    float A1    = AMPLITUDE + 0.01*low*LOW_AMP;
    float A2    = A1 + mid*MID_ABAMP + high*HIGH_ABAMP;
    float AB    = (ABERRATION + mid*MID_ABER + high*HIGH_ABER)*res;
    float th    = mix(0.1, 0.01*THICKNESS, res);
    float inten = mix(0.1, 0.01*(INTENSITY + low*LOW_INT), res);
    float soft  = 0.01*res*max(0.0, SOFTNESS + mid*MID_SOFT);

    float dUnres = max(length(p) - mix(0.14, UNRES_SCALE, res), 0.0);
    float yMain = A1 * env * res * sin(p.x*FREQ + drift);

    float bandFillTh = max(BAND_THICK, 1e-4);
    float bandAmt    = 1e-4 * BAND_FILL * inten;
    vec3 num = vec3(0.0), den = vec3(0.0);
    for(int s = 0; s < 4; s++){
        vec3 hue = mix(vec3(1.0), spectral4(s), res);
        den += hue;
        float ab = mix(-AB, AB, float(s)/3.0);
        float yL = A2 * env * res * sin(p.x*ABER_FREQ + drift + ab);
        float d   = mix(dUnres, abs(p.y - yL), res);
        float lor = mix(1.0/(1.0 + (0.02*d)*(0.02*d)), 1.0, res);
        float line = inten / (sqrt(d*d + soft*soft) + th);
        float lo = min(yMain, yL), hi = max(yMain, yL);
        float dBand = max(0.0, max(p.y - hi, lo - p.y));
        float band  = bandAmt / (dBand + bandFillTh);
        num += hue * lor * (line + band);
    }
    vec3 col = num / den;

    float dM    = mix(dUnres, abs(p.y - yMain), res);
    float lorM  = mix(1.0/(1.0 + (0.02*dM)*(0.02*dM)), 1.0, res);
    float boost = (1.0 - res) * (14.0*low + 4.0);
    col += 0.5 * inten * (lorM + boost) / (sqrt(dM*dM + soft*soft) + th);

    col = pow(max(col, 0.0), vec3(1.5));
    float emT = clamp((abs(yScreen) - 1.0 + EDGE_INSET) / (-max(EDGE_MASK, 1e-4)), 0.0, 1.0);
    float em  = emT*emT*(3.0 - 2.0*emT);
    float gauss = exp(-pow(xN*FALLOFF, 2.0));
    col *= mix(1.0, em*gauss, res);
    col *= res;
    fragColor = vec4(col, 1.0);
}
void main(){ mainImage(gl_FragColor, gl_FragCoord.xy); }`,"fluid-dots":`precision highp float;
uniform vec2 iResolution; uniform float iTime;
const float TAU = 6.28318530718;
const int   N   = 6;
const float SMOOTH_K = 0.08;
const float INTENSITY  = 0.0025;
const float FALLOFF_P  = 1.35;
const float FADE_START = 0.02;
const float FADE_END   = 0.56;
const float ABERR = 0.005;
const vec3  SPECTRAL = vec3(0.0, 0.5, 1.0) * ABERR;
const float HUE_SPEED = 0.06;
const float COLOR_K   = 0.5;
const float SAT       = 0.01;
const float HUE_SPAN  = 0.667;
const float MERGE_PERIOD = 6.0;
const float T_MOVE   = 1.25;
const float STAGGER  = 0.33;
const float HOLD     = 0.0;
const float W = 4.6;
const float L = 3.2;
const float PIERCE  = 0.12;
const float RECOIL  = 0.035;
const float REC_LAG = 0.11;
const float GATHER_PERIOD = 12.0;
const float GATHER_START  = 9.2;
const float GATHER_HOLD   = 0.8;
const float GATHER_R      = 0.008;
const float GATHER_DIM    = 0.85;
const float GATHER_IN     = 1.8;
const float GATHER_IN_L   = 7.5;
const float BURST_W = 6.5;
const float BURST_L = 4.0;
const float CHARGE_T     = 0.30;
const float CHARGE_SHRK  = 0.18;
const float CHARGE_GLOW  = 0.35;
const float FLASH_GAIN   = 1.2;
const float FLASH_DECAY  = 7.0;

float hash11(float n){ return fract(sin(n*127.1 + 311.7)*43758.5453); }
float settleWL(float tau, float w, float l){
    if(tau <= 0.0) return 0.0;
    return 1.0 - exp(-l*tau)*cos(w*tau);
}
float settle(float tau){ return settleWL(tau, W, L); }
float settleCrit(float tau, float l){
    if(tau <= 0.0) return 0.0;
    return 1.0 - exp(-l*tau)*(1.0 + l*tau);
}
float smin(float a, float b, float k){
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h*h*k*0.25;
}
vec3 hue2rgb(float h){
    h = fract(h);
    float r = clamp(abs(h*6.0 - 3.0) - 1.0, 0.0, 1.0);
    float g = clamp(2.0 - abs(h*6.0 - 2.0), 0.0, 1.0);
    float b = clamp(2.0 - abs(h*6.0 - 4.0), 0.0, 1.0);
    return vec3(r, g, b);
}
float dotR(float fi, float seed, float t){
    return 0.036 + 0.010*sin(t*1.3 + seed*TAU) + 0.005*sin(t*2.4 + fi*1.3);
}
float dotSD(vec2 p, vec2 pos, float r, float t, float fi, float shapeDamp){
    vec2 d = p - pos;
    float sq = 0.075 * (0.5 + 0.5*sin(t*0.9 + fi*2.0)) * shapeDamp;
    float ca = cos(t*0.35 + fi), sa = sin(t*0.35 + fi);
    d = mat2(ca,-sa,sa,ca) * d;
    d *= vec2(1.0+sq, 1.0-sq);
    return length(d) - r;
}
vec3 scene(vec2 p, float t){
    float k  = floor(t/MERGE_PERIOD);
    float u  = fract(t/MERGE_PERIOD);
    float te = u * MERGE_PERIOD;
    float tg = mod(t, GATHER_PERIOD);
    float g  = settleCrit((tg - GATHER_START) * GATHER_IN, GATHER_IN_L)
             - settleWL(tg - GATHER_START - GATHER_HOLD, BURST_W, BURST_L);
    float gC = clamp(g, 0.0, 1.0);
    float tb     = tg - (GATHER_START + GATHER_HOLD);
    float charge = smoothstep(-CHARGE_T, 0.0, min(tb, 0.0)) * gC;
    float flash  = tb > 0.0 ? exp(-tb * FLASH_DECAY) : 0.0;
    float gBright = mix(1.0, GATHER_DIM, gC) * (1.0 + CHARGE_GLOW*charge + FLASH_GAIN*flash);
    vec3  total3 = vec3(1e5);
    vec3  cAcc   = vec3(0.0);
    float wAcc   = 1e-6;
    for(int i=0; i<N; i++){
        float fi   = float(i);
        float seed = hash11(fi);
        float ang = fi/float(N)*TAU + t*0.35;
        vec2 dir  = vec2(cos(ang), sin(ang));
        float R = 0.17 + 0.010*sin(t*1.0) + 0.007*sin(t*1.3 + seed*TAU);
        float pairId   = mod(fi, 3.0);
        float moverLow = mod(k + pairId, 2.0);
        float isMover  = (fi < 2.5) ? step(moverLow, 0.5) : step(0.5, moverLow);
        float goStart  = pairId * STAGGER;
        float retStart = 3.0*STAGGER + HOLD + pairId * STAGGER;
        float m   = (settle(te - goStart)           - settle(te - retStart))           * isMover;
        float rec = (settle(te - goStart - REC_LAG) - settle(te - retStart - REC_LAG)) * (1.0 - isMover);
        float rSelf = dotR(fi, seed, t);
        rSelf = mix(rSelf, 0.036, gC);
        rSelf *= 1.0 - CHARGE_SHRK * charge;
        float fj    = mod(fi + 3.0, 6.0);
        float rPart = dotR(fj, hash11(fj), t);
        float deep   = -(R + RECOIL) - PIERCE * rPart;
        float radial = mix(R, deep, m) + RECOIL * rec;
        radial = mix(radial, GATHER_R, g);
        vec2  pos    = radial * dir;
        float sdR = dotSD(p - SPECTRAL.r*dir, pos, rSelf, t, fi, 1.0 - gC);
        float sdG = dotSD(p - SPECTRAL.g*dir, pos, rSelf, t, fi, 1.0 - gC);
        float sdB = dotSD(p - SPECTRAL.b*dir, pos, rSelf, t, fi, 1.0 - gC);
        total3 = vec3( smin(total3.r, sdR, SMOOTH_K),
                       smin(total3.g, sdG, SMOOTH_K),
                       smin(total3.b, sdB, SMOOTH_K) );
        float hue = fract(fi/float(N) + t*HUE_SPEED) * HUE_SPAN;
        vec3 dotCol = mix(vec3(1.0), hue2rgb(hue), SAT);
        float w = exp(-sdG * COLOR_K);
        cAcc += w * dotCol;
        wAcc += w;
    }
    vec3 sd3    = max(total3, vec3(0.0)) + 1e-4;
    vec3 core3  = clamp(INTENSITY / pow(sd3, vec3(FALLOFF_P)), 0.0, 1.0);
    vec3 edge3  = 1.0 - smoothstep(vec3(FADE_START), vec3(FADE_END), sd3);
    vec3 bright = core3 * edge3 * gBright;
    return bright * (cAcc / wAcc);
}
void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 res = iResolution.xy;
    vec2 p = (2.0*fragCoord - res) / min(res.x, res.y);
    float t = iTime;
    p /= 1.0 + 0.03*sin(t*1.0);
    vec3 col = scene(p, t);
    col *= 1.0 + 0.05*sin(t*1.0 + 1.0);
    col = pow(col, vec3(1.0/1.2));
    col = min(col, 1.0);
    float n = fract(sin(dot(fragCoord, vec2(12.9898,78.233)))*43758.5453);
    col += (n - 0.5)/255.0;
    fragColor = vec4(col, 1.0);
}
void main(){ mainImage(gl_FragColor, gl_FragCoord.xy); }`};function b({variant:e="wave",size:t=420,renderScale:a=.75,className:l,style:r,...i}){let n=s.useRef(null);return s.useEffect(()=>{let o=n.current;if(!o)return;let s=o.getContext("webgl");if(!s)return;let l=(e,t)=>{let a=s.createShader(e);if(s.shaderSource(a,t),s.compileShader(a),!s.getShaderParameter(a,s.COMPILE_STATUS)){let e=s.getShaderInfoLog(a);throw s.deleteShader(a),Error(e??"shader compile error")}return a},r=s.createProgram(),i=l(s.VERTEX_SHADER,"attribute vec2 aPos; void main(){ gl_Position=vec4(aPos,0.0,1.0); }"),c=l(s.FRAGMENT_SHADER,p[e]);s.attachShader(r,i),s.attachShader(r,c),s.linkProgram(r),s.useProgram(r);let d=s.createBuffer();s.bindBuffer(s.ARRAY_BUFFER,d),s.bufferData(s.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),s.STATIC_DRAW);let f=s.getAttribLocation(r,"aPos");s.enableVertexAttribArray(f),s.vertexAttribPointer(f,2,s.FLOAT,!1,0,0);let m=s.getUniformLocation(r,"iResolution"),g=s.getUniformLocation(r,"iTime"),u=Math.round(t*a);o.width=u,o.height=u,s.viewport(0,0,u,u);let x="u">typeof performance?performance.now():Date.now(),h=0,b=()=>{let e="u">typeof performance?performance.now():Date.now();s.uniform2f(m,u,u),s.uniform1f(g,(e-x)/1e3),s.drawArrays(s.TRIANGLES,0,3),h=requestAnimationFrame(b)};return b(),()=>{cancelAnimationFrame(h),s.deleteProgram(r),s.deleteShader(i),s.deleteShader(c),s.deleteBuffer(d)}},[e,t,a]),(0,o.jsx)("canvas",{ref:n,className:(0,h.cn)("block rounded-[20px] bg-black",l),style:{width:t,height:t,...r},...i})}let v=()=>{let{data:e,status:t}=(0,r.useSession)(),[a,h]=(0,s.useState)([]),[p,v]=(0,s.useState)({message:""}),[A,E]=(0,s.useState)("desc"),[y,S]=(0,s.useState)(!1),[R,N]=(0,s.useState)(!1),[_,w]=(0,s.useState)(!1),[T,j]=(0,s.useState)(""),L=async()=>{try{N(!0);let e=await fetch("/api/comments");if(!e.ok)throw Error("Failed to fetch comments");let{data:t}=await e.json(),a=t.map(e=>({id:e._id,author:e.user?.name||"Anonymous",avatar:e.user?.image||null,date:new Date(e.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}),daysAgo:Math.floor((new Date-new Date(e.createdAt))/864e5),message:e.text,platform:e.user?.provider||"api",featured:!1,replies:e.replies?e.replies.map(e=>({id:e._id,author:e.user?.name||"Anonymous",avatar:e.user?.image||null,date:new Date(e.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}),daysAgo:Math.floor((new Date-new Date(e.createdAt))/864e5),message:e.text,platform:e.user?.provider||"api"})):[]}));h(a),j("")}catch(e){x.o.error("Failed to load messages",{description:"Please try again later"})}finally{N(!1)}},C=async()=>{if(!e||!p.message.trim())return void x.o.error("Message is empty",{description:"Please write something before submitting"});try{w(!0),j("");let t=await fetch("/api/comments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:p.message})});if(!t.ok)throw Error("Failed to submit comment");let{data:o}=await t.json(),s={id:o._id,author:o.user?.name||e.user.name,avatar:o.user?.image||e.user.image||null,date:new Date(o.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}),daysAgo:0,message:o.text,platform:o.user?.provider||e.user.provider||"api",featured:!1,replies:[]};h([s,...a]),v({message:""}),x.o.success("Message added",{description:"Your message is now visible in the guestbook"})}catch(e){x.o.error("Failed to submit message",{description:"Please try again in a moment"})}finally{w(!1)}};(0,s.useEffect)(()=>{L()},[]);let I=[...a].sort((e,t)=>"desc"===A?e.daysAgo-t.daysAgo:t.daysAgo-e.daysAgo);return(0,o.jsx)("div",{className:"min-h-screen bg-gradient-to-b from-black to-neutral-800 text-white",children:(0,o.jsxs)("div",{className:"pt-20 md:pt-32 mx-auto px-4 py-8",children:[(0,o.jsxs)("div",{className:"text-center mb-12 max-w-3xl mx-auto",children:[(0,o.jsx)("h1",{className:"text-sm text-gray-400 uppercase tracking-wide mb-4",children:"THE GUESTBOOK"}),(0,o.jsxs)("h2",{className:"text-4xl md:text-6xl font-bold mb-6",children:[(0,o.jsx)(u.AuroraText,{children:(0,o.jsx)("span",{style:{fontFamily:"'Pacifico'"},children:"Got a message? \xa0"})}),"I'd love to hear from you!"]}),(0,o.jsx)("p",{className:"text-gray-300 text-lg mb-8",children:"Sign my guestbook and share your idea. You can tell me anything here!"})]}),e?(0,o.jsxs)("div",{className:"bg-gray-900/50 max-w-3xl mx-auto rounded-xl p-6 mb-8 border border-gray-800",children:[(0,o.jsxs)("div",{className:"flex items-center justify-between mb-4",children:[(0,o.jsxs)("div",{className:"flex items-center gap-3",children:[(0,o.jsx)("img",{src:e.user.image||"/avatar.webp",alt:"User Avatar",className:"w-8 h-8 rounded-full"}),(0,o.jsxs)("div",{children:[(0,o.jsx)("div",{className:"font-semibold",children:e.user.name}),(0,o.jsx)("div",{className:"text-sm text-gray-400",children:"Write your message"})]})]}),(0,o.jsxs)("button",{onClick:()=>{x.o.success("Logged out successfully"),(0,r.signOut)()},className:"flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white text-sm transition-colors",children:[(0,o.jsx)(c.A,{size:16}),"Logout"]})]}),(0,o.jsx)("textarea",{value:p.message,onChange:e=>v({...p,message:e.target.value}),placeholder:"Share your thoughts...",className:"w-full bg-black/50 border border-gray-700 rounded-lg p-3 mb-4 resize-none focus:border-purple-500 focus:outline-none",rows:2,maxLength:100}),(0,o.jsxs)("div",{className:"flex items-center justify-between",children:[(0,o.jsxs)("span",{className:"text-xs text-gray-400",children:[p.message.length,"/100 characters"]}),(0,o.jsxs)("button",{onClick:C,disabled:!p.message.trim()||_,className:"bg-black border focus:border-purple-500 focus:outline-none  disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2",children:[(0,o.jsx)(d.A,{size:16}),_?"Submitting...":"Submit Message"]})]})]}):(0,o.jsx)("div",{className:"bg-gradient-to-br from-black mx-auto max-w-3xl to-purple-700 hover:from-black hover:to-blue-600 rounded-xl p-6 mb-8",children:(0,o.jsxs)("div",{className:"flex items-start gap-4",children:[(0,o.jsx)("div",{className:"w-8 h-8 bg-white/20 rounded-full flex items-center justify-center",children:(0,o.jsx)(i.A,{size:16})}),(0,o.jsxs)("div",{className:"flex-1",children:[(0,o.jsx)("h3",{className:"font-semibold mb-2",children:"Pinned"}),(0,o.jsx)("p",{className:"text-sm text-white/90 mb-4",children:"Hey there! Thanks for visiting my website. If you have a moment, I'd love to hear your thoughts on my work. Please log in with your account to leave a comment. Thanks!"}),(0,o.jsxs)("div",{className:"flex items-center space-x-3",children:[(0,o.jsxs)("button",{onClick:()=>S(!0),className:"flex items-center space-x-3 gap-2 bg-black border focus:border-purple-500 focus:outline-none px-6 py-2 rounded-lg font-medium transition-all duration-200",children:["Login",(0,o.jsx)(n.A,{size:16})]}),(0,o.jsx)("h3",{className:"font-semibold",children:"to continue leaving a message"})]})]})]})}),(0,o.jsxs)("div",{className:"flex items-center max-w-3xl mx-auto justify-between mb-6",children:[(0,o.jsxs)("h3",{className:"text-xl font-bold",children:["All Messages (",R?"...":a.length,")"]}),(0,o.jsxs)("button",{onClick:()=>E("desc"===A?"asc":"desc"),className:"flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-sm hover:border-purple-500 transition-all",children:[(0,o.jsx)(f.A,{size:16}),"desc"===A?"Latest First":"Oldest First"]})]}),R?(0,o.jsxs)("div",{className:"flex flex-col items-center justify-center py-8 max-w-3xl mx-auto",children:[(0,o.jsx)(b,{variant:"wave",size:240,className:"shadow-[0_20px_60px_rgba(0,0,0,0.6)]"}),(0,o.jsx)("div",{className:"text-gray-400 mt-4",children:"Loading messages..."})]}):(0,o.jsx)("div",{className:"max-w-6xl mx-auto px-4 pb-16",children:(0,o.jsx)("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",children:I.map((e,t)=>{let a=["from-[#0f766e] via-[#0891b2] to-[#0e7490]","from-[#4c1d95] via-[#6d28d9] to-[#312e81]","from-[#020617] via-[#0f171a] to-[#020617]","from-[#1e293b] via-[#334155] to-[#0f172a]","from-[#064e3b] via-[#047857] to-[#022c22]","from-[#581c87] via-[#7c3aed] to-[#3b0764]","from-[#1e1b4b] via-[#312e81] to-[#020617]","from-[#0e7490] via-[#0369a1] to-[#082f49]","from-[#14532d] via-[#166534] to-[#052e16]","from-[#020617] via-[#020617] to-[#020617]"],s=a[t%a.length];return(0,o.jsxs)("div",{className:`bg-gradient-to-br ${s} rounded-2xl p-6 border border-gray-700  relative overflow-hidden`,children:[(0,o.jsx)("div",{className:"absolute top-0 right-0 w-2 h-16 bg-white/20 rounded-bl-lg"}),(0,o.jsx)("div",{className:"absolute bottom-0 left-0 w-2 h-16 bg-white/20 rounded-tr-lg"}),(0,o.jsxs)("div",{className:"flex flex-col h-full",children:[(0,o.jsxs)("p",{className:"text-white text-lg font-medium mb-6 line-clamp-3 break-words flex-grow leading-relaxed hover:scale-105 transition-transform duration-200",children:['"',e.message,'"']}),(0,o.jsxs)("div",{className:"flex items-center gap-3 mt-auto",children:[e.avatar?(0,o.jsx)("img",{src:e.avatar,alt:`${e.author}'s avatar`,className:"w-10 h-10 rounded-full object-cover border-2 border-white/30",onError:e=>{e.target.style.display="none",e.target.nextElementSibling.style.display="block"}}):null,(0,o.jsx)("div",{className:"w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl",style:{display:e.avatar?"none":"flex"},children:"\uD83D\uDC64"}),(0,o.jsxs)("div",{className:"flex-1",children:[(0,o.jsxs)("div",{className:"flex items-center gap-2",children:[(0,o.jsx)("span",{className:"font-semibold text-white text-sm",children:e.author}),"github"===e.platform&&(0,o.jsx)(m.A,{size:14,className:"text-white/70"}),"google"===e.platform&&(0,o.jsx)(g.A,{size:14,className:"text-white/70"})]}),(0,o.jsxs)("div",{className:"text-white/70 text-xs",children:[e.date," • ",0===e.daysAgo?"Today":`${e.daysAgo} d ago`]})]})]})]}),(0,o.jsx)("div",{className:"absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded-2xl pointer-events-none"})]},e.id)})})}),0===a.length&&!R&&(0,o.jsx)("div",{className:"text-center py-8",children:(0,o.jsx)("div",{className:"text-gray-400",children:"No messages yet. Be the first to leave one!"})}),y&&(0,o.jsx)("div",{className:"fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4",children:(0,o.jsxs)("div",{className:"bg-gradient-to-br from-gray-800 to-black rounded-xl p-6 w-full max-w-sm border border-gray-800 shadow-2xl",children:[(0,o.jsxs)("h3",{className:"text-lg font-semibold text-white mb-1 text-center",children:["Sign In to Continue to"," ",(0,o.jsx)("span",{children:(0,o.jsx)("a",{href:"http://localhost:5000",className:"underline",children:"localhost:5000"})})]}),(0,o.jsx)("p",{className:"text-gray-400 text-xs mb-4 text-center",children:"Choose a secure sign-in method to leave your message"}),(0,o.jsxs)("div",{className:"space-y-3",children:[(0,o.jsxs)("button",{onClick:()=>{x.o.message("Redirecting to GitHub login..."),(0,r.signIn)("github"),S(!1)},disabled:"loading"===t,className:"w-full bg-black hover:bg-gray-800 cursor-pointer disabled:opacity-50 rounded-full py-2 px-3 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 border border-gray-700",children:[(0,o.jsx)(l.default,{src:"/svg/github2.png",alt:"GitHub",width:20,height:20,className:"w-5 h-5 invert"}),"loading"===t?"Connecting...":"Continue with GitHub"]}),(0,o.jsxs)("button",{onClick:()=>{x.o.message("Redirecting to Google login..."),(0,r.signIn)("google"),S(!1)},disabled:"loading"===t,className:"w-full bg-white text-black cursor-pointer hover:bg-gray-100 disabled:opacity-50 rounded-full py-2 px-3 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-sm",children:[(0,o.jsx)(l.default,{src:"/svg/google.png",alt:"Google",width:16,height:16,className:"w-4 h-4"}),"loading"===t?"Connecting...":"Continue with Google"]})]}),(0,o.jsx)("button",{onClick:()=>S(!1),className:"w-full mt-4 text-gray-400 cursor-pointer hover:text-white py-1 transition-colors text-xs",children:"Cancel"})]})})]})})};function A(){return(0,o.jsx)(r.SessionProvider,{children:(0,o.jsx)(v,{})})}},91337:(e,t,a)=>{"use strict";a.d(t,{cn:()=>l});var o=a(29722),s=a(622);function l(...e){return(0,s.QP)((0,o.$)(e))}}},e=>{e.O(0,[8437,4412,6609,1471,8441,3794,7358],()=>e(e.s=18437)),_N_E=e.O()}]);
//# sourceMappingURL=page-bf6881c984c83f6c.js.map