"use client"

import ScrambleText from "@/_components/ui/ScrambleText"

export const BLOCK_LABELS = [
    "GRILZZ",
    "CREDIT CARD",
    "DIAMOND",
    "SNEAKER",
    "GLOCK",
    "CAR KEY",
]

interface OverlayProps {
    activeBlock: number
    visible: boolean
}

export default function Overlay({ activeBlock, visible }: OverlayProps) {
    const label = BLOCK_LABELS[activeBlock] ?? BLOCK_LABELS[0]

    return (
        <div
            className={`pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-8 text-white transition-opacity duration-1000 xl:p-12 ${
                visible ? "opacity-100" : "opacity-0"
            }`}
        >
            <header className="flex items-start justify-between text-xs uppercase tracking-[0.3em] text-white">
                <span className="text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight drop-shadow-[0_0_15px_rgba(0,0,0,0.1)]">NZX0</span>
            </header>
            <div className="flex flex-col gap-2">
                <ScrambleText
                    key={label}
                    text={label}
                    className="text-4xl font-black tracking-tight md:text-6xl drop-shadow-[0_0_15px_rgba(0,0,0,0.12)]"
                />
            </div>
            <footer className="flex items-end justify-between text-xs uppercase tracking-[0.3em] text-white">
                <span className="text-lg lg:text-xl xl:text-2xl font-black tracking-tight drop-shadow-[0_0_15px_rgba(0,0,0,0.1)]">by caiovisuals</span>
            </footer>
        </div>
    )
}