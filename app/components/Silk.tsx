"use client";

import { useEffect, useRef } from "react";

export default function Silk() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const VS = `
      attribute vec2 a_pos;
      void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;

    const FS = `
      precision mediump float;
      uniform float u_time;
      uniform vec2  u_res;

      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float smoothNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = noise(i);
        float b = noise(i + vec2(1.0, 0.0));
        float c = noise(i + vec2(0.0, 1.0));
        float d = noise(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float val = 0.0;
        float amp = 0.5;
        for (int i = 0; i < 5; i++) {
          val += amp * smoothNoise(p);
          p   *= 2.0;
          amp *= 0.5;
        }
        return val;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_res;
        float t  = u_time * 0.08;

        vec2 q = vec2(fbm(uv + t * 0.3), fbm(uv + vec2(1.0)));
        vec2 r = vec2(
          fbm(uv + 4.0 * q + vec2(1.7, 9.2) + 0.15 * t),
          fbm(uv + 4.0 * q + vec2(8.3, 2.8) + 0.126 * t)
        );
        float f = fbm(uv + 4.0 * r);

        // indigo / violet palette on near-black
        vec3 col = mix(
          vec3(0.03, 0.03, 0.07),          // #080810 base
          vec3(0.24, 0.25, 0.72),           // indigo mid
          clamp(f * f * 4.0, 0.0, 1.0)
        );
        col = mix(col, vec3(0.45, 0.18, 0.65), clamp(length(q), 0.0, 1.0)); // violet
        col = mix(col, vec3(0.08, 0.08, 0.18), f * f * f);

        gl_FragColor = vec4(col * 0.55, 1.0); // keep it dark
      }
    `;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_res");

    let raf: number;
    let start = performance.now();

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }

    function draw() {
      const t = (performance.now() - start) / 1000;
      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
