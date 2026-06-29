import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { createBlocks, type Block } from "./Blocks"
import { ChromaticAberrationShader } from "./shaders/ChromaticAberrationShader"

const BLOCK_COUNT = 6
const SPACING = 9
const PERIOD = BLOCK_COUNT * SPACING
const CAM_Z = 8
const BEHIND = 2.5 // ponto de reciclagem, logo atrás da câmera (invisível)

export interface ExperienceOptions {
    reducedMotion?: boolean
    onActiveBlock?: (index: number) => void
}

export class Experience {
    private container: HTMLElement
    private renderer: THREE.WebGLRenderer
    private scene: THREE.Scene
    private camera: THREE.PerspectiveCamera
    private composer: EffectComposer
    private aberration: ShaderPass
    private bloom: UnrealBloomPass
    private blocks: Block[] = []
    private clock = new THREE.Clock()
    private reducedMotion: boolean
    private onActiveBlock?: (index: number) => void

    private scroll = 0 // valor contínuo (mundo) vindo do scroll
    private renderScroll = 0 // versão suavizada usada no render
    private velocity = 0
    private pointer = new THREE.Vector2(0, 0)
    private pointerTarget = new THREE.Vector2(0, 0)
    private activeIndex = -1

    /** 0 = começo da intro, 1 = experiência totalmente revelada. */
    intro = 0

    private tick = () => this.render()
    private boundResize = () => this.resize()
    private boundPointer = (e: PointerEvent) => this.onPointerMove(e)

    constructor(container: HTMLElement, options: ExperienceOptions = {}) {
        this.container = container
        this.reducedMotion = options.reducedMotion ?? false
        this.onActiveBlock = options.onActiveBlock

        const width = container.clientWidth
        const height = container.clientHeight

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" })
        this.renderer.setSize(width, height)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        this.renderer.toneMappingExposure = 0.92
        container.appendChild(this.renderer.domElement)

        this.scene = new THREE.Scene()
        const bg = new THREE.Color(0x05070d)
        this.scene.background = bg
        this.scene.fog = new THREE.Fog(bg, PERIOD * 0.5, PERIOD * 0.95)

        this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200)
        this.camera.position.set(0, 0, CAM_Z)

        // HDRI procedural (sem assets externos) para reflexos/refrações no gelo
        const pmrem = new THREE.PMREMGenerator(this.renderer)
        const envScene = new RoomEnvironment()
        this.scene.environment = pmrem.fromScene(envScene, 0.04).texture
        pmrem.dispose()

        // luzes de apoio (rim light fria + key sutil)
        const key = new THREE.DirectionalLight(0xbfd8ff, 1.6)
        key.position.set(3, 5, 6)
        const rim = new THREE.DirectionalLight(0x4466ff, 1.2)
        rim.position.set(-4, -2, -6)
        this.scene.add(key, rim, new THREE.AmbientLight(0x223044, 0.6))

        // blocos
        for (let i = 0; i < BLOCK_COUNT; i++) {
            const block = createBlocks(i)
            this.scene.add(block.group)
            this.blocks.push(block)
        }

        // post-processing
        this.composer = new EffectComposer(this.renderer)
        this.composer.setSize(width, height)
        this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.composer.addPass(new RenderPass(this.scene, this.camera))

        this.bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.42, 0.45, 0.9)
        this.composer.addPass(this.bloom)

        this.aberration = new ShaderPass(ChromaticAberrationShader)
        this.aberration.uniforms.uReducedMotion.value = this.reducedMotion ? 1 : 0
        this.composer.addPass(this.aberration)

        this.composer.addPass(new OutputPass())

        window.addEventListener("resize", this.boundResize)
        window.addEventListener("pointermove", this.boundPointer)
    }

    /** Recebe o scroll contínuo (px) + velocidade vindos do Lenis. */
    setScroll(scrollPx: number, velocity: number) {
        this.scroll = scrollPx * 0.012 // px -> unidades de mundo
        this.velocity = velocity
    }

    private onPointerMove(e: PointerEvent) {
        this.pointerTarget.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1)
    }

    private positionBlocks(travel: number, time: number) {
        let bestDist = Infinity
        let bestIndex = -1
        for (let i = 0; i < this.blocks.length; i++) {
            const block = this.blocks[i]
            const baseZ = -i * SPACING
            // treadmill: mantém z dentro de (CAM_Z+BEHIND-PERIOD, CAM_Z+BEHIND]
            const rel = ((CAM_Z + BEHIND - (baseZ + travel)) % PERIOD + PERIOD) % PERIOD
            const z = CAM_Z + BEHIND - rel

            // caminho sinuoso: a câmera passa ao lado de cada bloco
            block.group.position.set(Math.sin(z * 0.18) * 2.3, Math.cos(z * 0.15) * 1.5, z)

            const spin = this.reducedMotion ? 0 : time * 0.25
            block.inner.rotation.set(time * 0.2 + i, spin + i * 0.7, 0)
            block.shell.rotation.y = -time * 0.05 + i

            // o bloco mais à frente da câmera é o "ativo"
            const dist = Math.abs(z - (CAM_Z - SPACING))
            if (z < CAM_Z && dist < bestDist) {
                bestDist = dist
                bestIndex = i
            }
        }
        if (bestIndex !== -1 && bestIndex !== this.activeIndex) {
            this.activeIndex = bestIndex
            this.onActiveBlock?.(bestIndex)
        }
    }

    private render() {
        const dt = Math.min(this.clock.getDelta(), 0.05)
        const time = this.clock.elapsedTime

        // suaviza o scroll para o render (inércia extra além do Lenis)
        this.renderScroll += (this.scroll - this.renderScroll) * Math.min(1, dt * 8)
        const travel = this.renderScroll + this.intro * -PERIOD * 0.15

        this.positionBlocks(travel, time)

        // parallax de mouse + leve respiração da câmera
        this.pointer.lerp(this.pointerTarget, Math.min(1, dt * 4))
        const sway = this.reducedMotion ? 0 : 1
        this.camera.position.x = this.pointer.x * 0.6 * sway
        this.camera.position.y = -this.pointer.y * 0.4 * sway
        this.camera.position.z = CAM_Z + (1 - this.intro) * 14
        this.camera.lookAt(0, 0, CAM_Z - SPACING)

        // aberração cromática: base + reação à velocidade do scroll + intro
        const speed = Math.min(Math.abs(this.velocity) * 0.0015, 1)
        const introBoost = (1 - this.intro) * 1.2
        const target = 0.12 + speed * 0.9 + introBoost
        const a = this.aberration.uniforms.uStrength
        a.value += (target - a.value) * Math.min(1, dt * 6)

        this.bloom.strength = 0.38 + this.intro * 0.1

        this.composer.render()
    }

    /** Inicia o loop de render. */
    start() {
        this.clock.start()
        this.renderer.setAnimationLoop(this.tick)
    }

    resize() {
        const width = this.container.clientWidth
        const height = this.container.clientHeight
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(width, height)
        this.composer.setSize(width, height)
    }

    /** Pré-compila shaders/materiais para um load sem travadas. */
    async warmup() {
        await this.renderer.compileAsync(this.scene, this.camera)
    }

    dispose() {
        this.renderer.setAnimationLoop(null)
        window.removeEventListener("resize", this.boundResize)
        window.removeEventListener("pointermove", this.boundPointer)
        this.blocks.forEach((b) => b.dispose())
        this.scene.environment?.dispose()
        this.composer.dispose()
        this.renderer.dispose()
        this.renderer.domElement.remove()
    }
}

export { BLOCK_COUNT }