import {
  WebGLRenderer, Scene, OrthographicCamera, PlaneGeometry, Mesh, ShaderMaterial,
  CanvasTexture, Vector2, Vector3, Vector4, LinearFilter,
} from 'three';
import { gsap } from 'gsap';

/**
 * Logotipo "líquido": el ZORVO se mueve como cold brew.
 *  - respiración con ruido (siempre, muy sutil)
 *  - ondas al tocar / click
 *  - lupa al pasar el puntero
 *  - al scrollear, las letras "gotean" hacia abajo
 *  - con velocidad, ecos amarillo/bordó (split)
 */

const VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uTime, uDrip, uIntro, uSplit, uHover, uAspect;
uniform vec2 uMouse;
uniform vec4 uLogo;           // x, y(abajo), w, h del logo en uv
uniform vec3 uRip[6];         // x, y, t0
uniform vec3 uInk, uYellow, uBordo;

vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.); m=m*m; m=m*m;
  vec3 x=2.*fract(p*C.www)-1.; vec3 h=abs(x)-.5; vec3 ox=floor(x+.5); vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.*dot(m,g);
}

float alphaAt(vec2 uv){
  if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.) return 0.;
  return texture2D(uTex, uv).a;
}

void main(){
  vec2 uv = vUv;
  vec2 p = vec2(uv.x * uAspect, uv.y);
  vec2 off = vec2(0.);

  // respiración líquida
  float n1 = snoise(vec2(uv.x*2.6, uv.y*1.8) + vec2(0., uTime*.22));
  float n2 = snoise(vec2(uv.x*2.6 + 7.3, uv.y*1.8) - vec2(uTime*.18, 0.));
  off += vec2(n1, n2) * .0042;

  // ondas
  for(int i=0;i<6;i++){
    vec3 r = uRip[i];
    float age = uTime - r.z;
    if(age < 0. || age > 2.6) continue;
    vec2 d = p - vec2(r.x*uAspect, r.y);
    float dist = length(d);
    float wave = sin(dist*34. - age*10.) * exp(-dist*4.5) * exp(-age*1.9);
    off += (d / (dist + 1e-4)) * wave * .02 * vec2(1./uAspect, 1.);
  }

  // lupa del puntero
  vec2 md = p - vec2(uMouse.x*uAspect, uMouse.y);
  float mdist = length(md);
  off -= (md / (mdist + 1e-4)) * exp(-mdist*mdist*30.) * .035 * uHover * vec2(1./uAspect, 1.);

  // goteo: columnas que se estiran hacia abajo
  float top = uLogo.y + uLogo.w;
  float c1 = pow(snoise(vec2(uv.x*7.5, 1.7)) * .5 + .5, 2.6);
  float c2 = pow(snoise(vec2(uv.x*21., 4.3)) * .5 + .5, 4.);
  float intro = clamp(uIntro*1.55 - uv.x*.55, 0., 1.);
  float e = 1. - pow(1. - intro, 3.);
  float drip = uDrip + (1. - e) * .32;
  float w = clamp((top - uv.y) / top, 0., 1.);
  vec2 suv = uv + off;
  suv.y += drip * (c1*.85 + c2*.35 + .04) * w * w;
  suv.y += (1. - e) * .55;                         // entrada: sube desde abajo

  // una sola tinta: sin ecos de color (en mobile se leían como un ZORVO duplicado)
  float a = smoothstep(.38, .62, alphaAt(suv));
  gl_FragColor = vec4(uInk * a, a);
}
`;

export function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

export async function initHeroGL(host, svgEl, { ink = '#161513', yellow = '#FFC744', bordo = '#76262F' } = {}) {
  if (!host || !svgEl || !supportsWebGL()) return null;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' });
  } catch {
    canvas.remove();
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const tex2d = document.createElement('canvas');
  const texture = new CanvasTexture(tex2d);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;

  const uniforms = {
    uTex: { value: texture },
    uTime: { value: 0 },
    uDrip: { value: 0 },
    uIntro: { value: 1 },
    uSplit: { value: 0 },
    uHover: { value: 0 },
    uAspect: { value: 1 },
    uMouse: { value: new Vector2(0.5, 0.5) },
    uLogo: { value: new Vector4(0, 0, 1, 1) },
    uRip: { value: Array.from({ length: 6 }, () => new Vector3(0, 0, -99)) },
    uInk: { value: colorVec(ink) },
    uYellow: { value: colorVec(yellow) },
    uBordo: { value: colorVec(bordo) },
  };
  const mat = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthTest: false });
  scene.add(new Mesh(new PlaneGeometry(2, 2), mat));

  // ---- layout: el canvas se extiende alrededor del logo (márgenes + espacio de goteo)
  const svgSrc = new XMLSerializer().serializeToString(svgEl);
  let img = await svgImage(svgSrc, ink);
  const box = { padX: 0, padT: 0, drip: 0, w: 0, h: 0 };

  function layout() {
    const r = svgEl.getBoundingClientRect();
    const hostR = host.getBoundingClientRect();
    if (!r.width) return;
    box.w = r.width; box.h = r.height;
    box.padX = r.width * 0.05;
    box.padT = r.height * 0.18;
    box.drip = r.height * 1.25;
    const cw = box.w + box.padX * 2;
    const ch = box.h + box.padT + box.drip;
    Object.assign(canvas.style, {
      left: `${r.left - hostR.left - box.padX}px`,
      top: `${r.top - hostR.top - box.padT}px`,
      width: `${cw}px`,
      height: `${ch}px`,
    });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(cw, ch, false);
    // textura con el logo en su lugar
    const s = Math.min(dpr, 2048 / cw);
    tex2d.width = Math.round(cw * s);
    tex2d.height = Math.round(ch * s);
    const ctx = tex2d.getContext('2d');
    ctx.clearRect(0, 0, tex2d.width, tex2d.height);
    ctx.drawImage(img, box.padX * s, box.padT * s, box.w * s, box.h * s);
    texture.needsUpdate = true;
    uniforms.uAspect.value = cw / ch;
    uniforms.uLogo.value.set(box.padX / cw, box.drip / ch, box.w / cw, box.h / ch);
  }
  layout();

  // ---- interacción
  let ripIdx = 0;
  const toUv = (e) => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
  };
  const onDown = (e) => {
    const [x, y] = toUv(e);
    uniforms.uRip.value[ripIdx % 6].set(x, y, uniforms.uTime.value);
    ripIdx++;
  };
  const qMouseX = gsap.quickTo(uniforms.uMouse.value, 'x', { duration: 0.5, ease: 'power3.out' });
  const qMouseY = gsap.quickTo(uniforms.uMouse.value, 'y', { duration: 0.5, ease: 'power3.out' });
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const [x, y] = toUv(e);
    qMouseX(x); qMouseY(y);
    gsap.to(uniforms.uHover, { value: 1, duration: 0.4, overwrite: true });
  };
  const onLeave = () => gsap.to(uniforms.uHover, { value: 0, duration: 0.6, overwrite: true });
  canvas.addEventListener('click', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);

  // ---- loop solo si está en pantalla
  let visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { rootMargin: '80px' });
  io.observe(canvas);
  const start = performance.now();
  const tick = () => {
    if (!visible || document.hidden) return;
    uniforms.uTime.value = (performance.now() - start) / 1000;
    renderer.render(scene, camera);
  };
  gsap.ticker.add(tick);

  let rT;
  const ro = new ResizeObserver(() => { clearTimeout(rT); rT = setTimeout(layout, 120); });
  ro.observe(host);

  host.classList.add('is-gl');

  return {
    uniforms,
    ripple(x = 0.5, y = 0.6) {
      uniforms.uRip.value[ripIdx % 6].set(x, y, uniforms.uTime.value);
      ripIdx++;
    },
    intro(duration = 1.6) {
      return gsap.fromTo(uniforms.uIntro, { value: 0 }, { value: 1, duration, ease: 'none' });
    },
    setDrip(v) { uniforms.uDrip.value = v; },
    setSplit(v) { uniforms.uSplit.value = v; },
    destroy() {
      gsap.ticker.remove(tick);
      io.disconnect(); ro.disconnect();
      renderer.dispose(); texture.dispose(); mat.dispose();
      canvas.remove();
      host.classList.remove('is-gl');
    },
  };
}

// valores sRGB crudos: el shader escribe directo al canvas, sin gestión de color
function colorVec(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function svgImage(src, fill) {
  return new Promise((resolve, reject) => {
    let s = src.replace(/currentColor/g, fill);
    // tamaño explícito para que todos los navegadores la rastericen bien
    const vb = s.match(/viewBox="([^"]+)"/);
    if (vb && !/\swidth="/.test(s.slice(0, s.indexOf('>')))) {
      const [, , w, h] = vb[1].split(/\s+/).map(Number);
      s = s.replace('<svg', `<svg width="${w * 4}" height="${h * 4}"`);
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;
  });
}
