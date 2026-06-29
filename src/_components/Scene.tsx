"use client"

import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"
import { Experience, BLOCK_COUNT } from "@/_lib/three/Experience"
import { SmoothScroll } from "@/_lib/scroll/SmoothScroll"
import Loader from "@/_components/ui/Loader"
import Overlay from "@/_components/Overlay"

export default function Scene() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [progress, setProgress] = useState(0)
    const [done, setDone] = useState(false)
    const [activeBlock, setActiveBlock] = useState(0)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const exp = new Experience(container, {
            reducedMotion: reduced,
            onActiveBlock: setActiveBlock,
        })
        let scroller: SmoothScroll | null = null
        let killed = false

        let p = 0
        const ramp = window.setInterval(() => {
            p = Math.min(0.85, p + Math.random() * 0.12)
            setProgress(p)
        }, 120)

        ;(async () => {
            await exp.warmup()
            if (killed) return
            window.clearInterval(ramp)
            setProgress(1)
            exp.start()
            scroller = new SmoothScroll(({ scroll, velocity }) => exp.setScroll(scroll, velocity))

            window.setTimeout(() => !killed && setDone(true), 250)

            if (reduced) {
                exp.intro = 1
            } else {
                gsap.to(exp, { intro: 1, duration: 2.6, ease: "power2.out", delay: 0.25 })
            }
        })()

        return () => {
            killed = true
            window.clearInterval(ramp)
            scroller?.destroy()
            exp.dispose()
        }
    }, [])

    return (
        <>
            {/* canvas WebGL fixo cobrindo a viewport */}
            <div ref={containerRef} className="pointer-events-none fixed inset-0 z-10" />

            <Overlay activeBlock={activeBlock} visible={done} />
            <Loader progress={progress} done={done} />

            {/* spacer que dá altura ao documento para o scroll infinito do Lenis */}
            <div aria-hidden style={{ height: `${(BLOCK_COUNT + 1) * 100}vh` }} />
        </>
    )
}