import Lenis from "lenis"
import { gsap } from "gsap"

export interface ScrollState {
    /** Scroll contínuo em px (monotônico, sem saltos no loop). */
    scroll: number
    /** Velocidade instantânea do Lenis. */
    velocity: number
}

/**
 * Smooth scroll infinito.
 * O Lenis (`infinite: true`) faz o scroll dar a volta sem fim; aqui
 * "desenrolamos" os saltos do wrap para entregar um valor contínuo,
 * que a cena 3D usa como deslocamento do treadmill.
 */
export class SmoothScroll {
    private lenis: Lenis
    private continuous = 0
    private last = 0
    private onUpdate: (state: ScrollState) => void
    private rafCallback: (time: number) => void

    constructor(onUpdate: (state: ScrollState) => void) {
        this.onUpdate = onUpdate
        this.lenis = new Lenis({
            infinite: true,
            lerp: 0.1,
            wheelMultiplier: 1,
            smoothWheel: true,
        })

        this.last = this.lenis.scroll

        this.lenis.on("scroll", (e: { scroll: number; velocity: number }) => {
            const limit = this.lenis.limit || 1
            let delta = e.scroll - this.last
            // corrige o salto quando o scroll dá a volta (infinite)
            if (delta > limit / 2) delta -= limit
            else if (delta < -limit / 2) delta += limit
            this.continuous += delta
            this.last = e.scroll
            this.onUpdate({ scroll: this.continuous, velocity: e.velocity })
        })

        // um único RAF compartilhado via gsap.ticker
        this.rafCallback = (time: number) => this.lenis.raf(time * 1000)
        gsap.ticker.add(this.rafCallback)
        gsap.ticker.lagSmoothing(0)
    }

    destroy() {
        gsap.ticker.remove(this.rafCallback)
        this.lenis.destroy()
    }
}