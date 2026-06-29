import type { Metadata } from "next"
import { Dela_Gothic_One } from "next/font/google"
import "./globals.css"

export const metadata: Metadata = {
    title: "nzx0",
    description: "",
}

const delaGothicOne = Dela_Gothic_One({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-dela-gothic-one",
    display: "swap",
})

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="pt-BR" className={`h-full antialiased ${delaGothicOne.variable}`}>
            <body className="min-h-full flex flex-col">
                {children}
            </body>
        </html>
    )
}
