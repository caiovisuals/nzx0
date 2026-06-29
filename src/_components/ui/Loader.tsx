"use client"

interface LoaderProps {
    progress: number
    done: boolean
}

export default function Loader({ progress, done }: LoaderProps) {
    return (
        <div
            aria-hidden={done}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070d] transition-opacity duration-700 ${
                done ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
        >
            <span className="mb-6 text-5xl font-black tracking-tight text-white md:text-7xl">
                NZX0
            </span>
            <div className="h-[2px] w-60 lg:w-80 xl:w-100 overflow-hidden bg-white/15 md:w-64">
                <div
                    className="h-full bg-white transition-[width] duration-300 ease-out"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                />
            </div>
            <span className="mt-4 text-xs tracking-[0.4em] text-white/50">
                {Math.round(progress * 100).toString().padStart(3, "0")}
            </span>
        </div>
    )
}