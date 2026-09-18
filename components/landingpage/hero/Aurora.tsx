'use client';

import { useEffect, useRef, useState } from 'react';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  
  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);
  
  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);
  
  float freqX = mix(1.4, 2.0, clamp(aspect, 0.0, 1.0));
  float noiseVal = snoise(vec2(uv.x * freqX + uTime * 0.14, uv.y * 1.3 + uTime * 0.18));
  float height = noiseVal * 0.65 * uAmplitude;
  height = exp(height);
  
  float wave = (uv.y * 1.9 - height + 0.30 * uv.x);
  float intensity = clamp(0.9 * wave, 0.0, 1.8);
  
  float midPoint = 0.16;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  // Start from extreme right (uv.x = 1.0) and spread gracefully towards the left
  float minX = mix(0.05, 0.15, clamp((aspect - 0.45) / 0.75, 0.0, 1.0));
  float maxX = mix(0.55, 0.80, clamp((aspect - 0.45) / 0.75, 0.0, 1.0));
  float horizontalSpread = smoothstep(minX, maxX, uv.x);
  
  auroraAlpha *= horizontalSpread;
  
  // Smooth bottom & left fade without clipping the right edge/corner
  float bottomFade = smoothstep(0.0, 0.30, uv.y);
  float edgeFadeLeft = smoothstep(0.0, 0.08, uv.x);
  auroraAlpha *= (bottomFade * edgeFadeLeft);
  
  vec3 vibrantColor = mix(vec3(0.145, 0.388, 0.922), vec3(0.22, 0.741, 0.973), uv.y);
  vec3 finalColor = mix(rampColor, vibrantColor, 0.35);
  
  fragColor = vec4(finalColor * auroraAlpha, auroraAlpha);
}
`;

export interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  time?: number;
  speed?: number;
  className?: string;
}

export default function Aurora(props: AuroraProps) {
  const { colorStops = ['#2563EB', '#38BDF8', '#0052FF'], amplitude = 1.0, blend = 0.5, className = '' } = props;
  const propsRef = useRef<AuroraProps>(props);
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  const ctnDom = useRef<HTMLDivElement>(null);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn || typeof window === 'undefined') return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Probe WebGL context on canvas element before passing to Renderer
    const canvas = document.createElement('canvas');
    let hasWebGL = false;
    
    try {
      const testCtx = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (testCtx) {
        hasWebGL = true;
      }
    } catch {
      hasWebGL = false;
    }

    if (!hasWebGL) {
      queueMicrotask(() => {
        setHasWebGLError(true);
      });
      return;
    }

    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const dpr = isTouch ? 1.0 : Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.25);

    let renderer: Renderer | undefined;

    try {
      renderer = new Renderer({
        canvas,
        alpha: true,
        premultipliedAlpha: true,
        antialias: !isTouch,
        dpr,
      });
    } catch {
      queueMicrotask(() => {
        setHasWebGLError(true);
      });
      return;
    }

    const gl = renderer.gl;
    if (!gl) {
      queueMicrotask(() => {
        setHasWebGLError(true);
      });
      return;
    }

    try {
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.canvas.style.backgroundColor = 'transparent';
      gl.canvas.style.width = '100%';
      gl.canvas.style.height = '100%';
      gl.canvas.style.display = 'block';

      const geometry = new Triangle(gl);
      if (geometry.attributes.uv) {
        delete geometry.attributes.uv;
      }

      const colorStopsArray = colorStops.map(hex => {
        const c = new Color(hex);
        return [c.r, c.g, c.b];
      });

      const program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms: {
          uTime: { value: 0 },
          uAmplitude: { value: amplitude },
          uColorStops: { value: colorStopsArray },
          uResolution: { value: [ctn.offsetWidth || window.innerWidth, ctn.offsetHeight || window.innerHeight] },
          uBlend: { value: blend }
        }
      });

      function resize() {
        if (!ctn || !renderer) return;
        const width = ctn.offsetWidth || window.innerWidth;
        const height = ctn.offsetHeight || window.innerHeight;
        renderer.setSize(width, height);
        program.uniforms.uResolution.value = [width, height];
      }

      const resizeObserver = new ResizeObserver(() => {
        resize();
      });
      resizeObserver.observe(ctn);
      window.addEventListener('resize', resize, { passive: true });

      const mesh = new Mesh(gl, { geometry, program });
      ctn.appendChild(gl.canvas);

      let animateId = 0;
      let isVisible = true;
      let isPageVisible = !document.hidden;

      const renderScene = (timeVal: number) => {
        if (program && renderer) {
          const speed = propsRef.current.speed ?? 1.0;
          program.uniforms.uTime.value = timeVal * speed * 0.1;
          program.uniforms.uAmplitude.value = propsRef.current.amplitude ?? 1.0;
          program.uniforms.uBlend.value = propsRef.current.blend ?? blend;
          const stops = propsRef.current.colorStops ?? colorStops;
          program.uniforms.uColorStops.value = stops.map((hex: string) => {
            const c = new Color(hex);
            return [c.r, c.g, c.b];
          });
          renderer.render({ scene: mesh });
        }
      };

      const startLoop = () => {
        if (animateId !== 0 || prefersReducedMotion) return;

        const update = (t: number) => {
          if (!isVisible || !isPageVisible) {
            animateId = 0;
            return;
          }
          animateId = requestAnimationFrame(update);
          const time = propsRef.current.time ?? t * 0.01;
          renderScene(time);
        };
        animateId = requestAnimationFrame(update);
      };

      const stopLoop = () => {
        if (animateId !== 0) {
          cancelAnimationFrame(animateId);
          animateId = 0;
        }
      };

      // Intersection Observer: Only render when Hero is on screen!
      const observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && isPageVisible) {
          startLoop();
        } else {
          stopLoop();
        }
      }, { threshold: 0.05 });

      observer.observe(ctn);

      const handleVisibilityChange = () => {
        isPageVisible = !document.hidden;
        if (isVisible && isPageVisible) {
          startLoop();
        } else {
          stopLoop();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      resize();
      renderScene(0);
      startLoop();

      return () => {
        stopLoop();
        observer.disconnect();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        resizeObserver.disconnect();
        window.removeEventListener('resize', resize);
        if (ctn && gl.canvas && gl.canvas.parentNode === ctn) {
          ctn.removeChild(gl.canvas);
        }
        try {
          gl.getExtension('WEBGL_lose_context')?.loseContext();
        } catch {}
      };
    } catch {
      queueMicrotask(() => {
        setHasWebGLError(true);
      });
    }
  }, [amplitude, blend, colorStops]);

  return (
    <div ref={ctnDom} className={`w-full h-full relative overflow-hidden ${className}`.trim()}>
      {hasWebGLError && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 via-sky-400/25 to-blue-700/20 blur-3xl animate-pulse pointer-events-none" />
      )}
    </div>
  );
}
