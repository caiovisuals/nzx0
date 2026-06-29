import * as THREE from "three"

/**
 * Aberração cromática radial.
 * Desloca os canais R/G/B em direção ao centro da tela; a intensidade
 * cresce do centro para as bordas (distorção tipo lente) e é modulada
 * em tempo real por `uStrength` (velocidade do scroll / transições).
 */
export const ChromaticAberrationShader = {
    uniforms: {
        tDiffuse: { value: null as THREE.Texture | null },
        uStrength: { value: 0.0 },
        uReducedMotion: { value: 0.0 },
    },
    vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform float uStrength;
        uniform float uReducedMotion;
        varying vec2 vUv;

        void main() {
            vec2 center = vec2(0.5);
            vec2 dir = vUv - center;
            float dist = length(dir);

            // queda radial: quase zero no centro, máxima nas bordas
            float falloff = smoothstep(0.0, 0.75, dist);
            float amount = uStrength * falloff * (1.0 - uReducedMotion);

            vec2 offset = dir * amount;

            float r = texture2D(tDiffuse, vUv + offset * 1.0).r;
            float g = texture2D(tDiffuse, vUv).g;
            float b = texture2D(tDiffuse, vUv - offset * 1.0).b;
            float a = texture2D(tDiffuse, vUv).a;

            gl_FragColor = vec4(r, g, b, a);
        }
    `,
}