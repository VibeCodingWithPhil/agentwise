import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: "Agentwise - Multi-Agent Orchestration for Claude Code",
  description: "Transform your development workflow with parallel AI agent execution, intelligent task distribution, and seamless Claude Code integration.",
  keywords: "Agentwise, Claude Code, AI agents, orchestration, development tools",
  authors: [{ name: "Philip Ritmeester" }],
  openGraph: {
    title: "Agentwise - Multi-Agent Orchestration for Claude Code",
    description: "Transform your development workflow with parallel AI agent execution",
    type: "website",
    url: "https://vibecodingwithphil.github.io/agentwise/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agentwise - Multi-Agent Orchestration",
    description: "Transform your development workflow with parallel AI agent execution",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}