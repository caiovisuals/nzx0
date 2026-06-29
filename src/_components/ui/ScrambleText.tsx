"use client"

import { useEffect, useRef, useState } from "react"

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>*#"

interface ScrambleTextProps {
    text: string
    className?: string
    duration?: number
}

export default function ScrambleText({ text, className, duration = 700 }: ScrambleTextProps) {
    const [display, setDisplay] = useState(text)
    const frame = useRef(0)

    useEffect(() => {
        const reduced =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        if (reduced) {
            setDisplay(text)
            return
        }

        const start = performance.now()
        const run = (now: number) => {
            const p = Math.min(1, (now - start) / duration)
            const revealed = Math.floor(p * text.length)

            let out = ""
            
            for (let i = 0; i < text.length; i++) {
                if (i < revealed || text[i] === " ") out += text[i]
                else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
            }

            setDisplay(out)
            if (p < 1) frame.current = requestAnimationFrame(run)
        }
        frame.current = requestAnimationFrame(run)
        return () => cancelAnimationFrame(frame.current)
    }, [text, duration])

    return <span className={className}>{display}</span>
}