"use client"

export default function NotFoundOverlay() {
    return (
        <div className={`pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-8 text-white transition-opacity duration-1000 xl:p-12`}>
            <header className="flex items-start justify-between text-xs uppercase tracking-[0.3em] text-white">
                <span className="text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight drop-shadow-[0_0_15px_rgba(0,0,0,0.15)]">NZX0</span>
            </header>
            <div className="max-w-150 flex flex-col gap-2">
                <span className="text-4xl font-black tracking-tight md:text-6xl drop-shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                    ERRO 404
                </span>
                <span className="text-xl md:text-2xl drop-shadow-[0_0_15px_rgba(0,0,0,0.2)] leading-none">
                    SENTIMOS MUITO, MAS A PÁGINA NÃO FOI ENCONTRADA
                </span>
            </div>
            <footer className="flex items-end justify-start text-xs uppercase tracking-[0.3em] text-white">
                <span className="text-base lg:text-lg xl:text-xl font-black tracking-tight drop-shadow-[0_0_15px_rgba(0,0,0,0.15)]">by caiovisuals</span>
            </footer>
        </div>
    )
}