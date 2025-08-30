"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { motion } from "framer-motion"
import { 
  Zap, Users, Code2, Sparkles, GitBranch, Shield, 
  Rocket, ChevronRight, Star, Download, BookOpen,
  Terminal, Cpu, Globe, ArrowRight, Check, FileText, BarChart3
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <Sparkles className="h-8 w-8 text-violet-600" />
                <span className="text-xl font-bold">Agentwise</span>
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <Link href="/docs" className="hover:text-violet-600 transition-colors">Documentation</Link>
                <Link href="/docs/commands" className="hover:text-violet-600 transition-colors">Commands</Link>
                <Link href="/docs/agents" className="hover:text-violet-600 transition-colors">Agents</Link>
                <Link href="/docs/api" className="hover:text-violet-600 transition-colors">API</Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link 
                href="https://github.com/VibeCodingWithPhil/agentwise"
                className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
              >
                <Star className="h-4 w-4" />
                <span>Star on GitHub</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">v2.2.0 - Self-Improving Agents & 99.3% Token Optimization</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Multi-Agent Orchestration
              <span className="block bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                for Claude Code
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Transform your development workflow with parallel AI agent execution, 
              intelligent task distribution, and seamless Claude Code integration.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                href="/docs/getting-started"
                className="flex items-center space-x-2 px-8 py-4 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-all transform hover:scale-105"
              >
                <Rocket className="h-5 w-5" />
                <span>Get Started</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link 
                href="/docs"
                className="flex items-center space-x-2 px-8 py-4 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-violet-600 dark:hover:border-violet-600 transition-all"
              >
                <BookOpen className="h-5 w-5" />
                <span>Read Docs</span>
              </Link>
            </div>
          </motion.div>

          {/* Feature Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-6 mt-20"
          >
            <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">99.3% Token Optimization</h3>
              <p className="text-gray-600 dark:text-gray-400">Verified token reduction through Context 3.0 + Knowledge Graph combined systems.</p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Parallel Agent Execution</h3>
              <p className="text-gray-600 dark:text-gray-400">Run multiple specialized agents simultaneously for faster development.</p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Enterprise Security</h3>
              <p className="text-gray-600 dark:text-gray-400">Built-in security validation and code review for production-ready output.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-center mb-12">Quick Start</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold mb-4">Installation</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gray-900 dark:bg-black">
                    <p className="text-sm text-gray-400 mb-2"># macOS/Linux</p>
                    <code className="text-green-400">curl -fsSL https://raw.githubusercontent.com/VibeCodingWithPhil/agentwise/main/installers/install.sh | bash</code>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-900 dark:bg-black">
                    <p className="text-sm text-gray-400 mb-2"># Start Claude Code with required flag</p>
                    <code className="text-green-400">claude --dangerously-skip-permissions</code>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold mb-4">Your First Project</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gray-900 dark:bg-black">
                    <p className="text-sm text-gray-400 mb-2"># Create a new project</p>
                    <code className="text-green-400">/create "an e-commerce platform with Next.js"</code>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-900 dark:bg-black">
                    <p className="text-sm text-gray-400 mb-2"># Monitor progress</p>
                    <code className="text-green-400">/monitor</code>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">Everything you need for AI-powered development</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Terminal, title: "27+ MCP Servers", desc: "Figma, GitHub, databases, and more" },
              { icon: Cpu, title: "Smart Model Routing", desc: "Automatic selection of optimal models" },
              { icon: Globe, title: "Local Model Support", desc: "Ollama, LM Studio integration" },
              { icon: Code2, title: "Dynamic Agents", desc: "Create custom specialized agents" },
              { icon: GitBranch, title: "Version Control", desc: "Git integration and PR management" },
              { icon: FileText, title: "Document Upload", desc: "Process PDFs, Word docs, Figma files" },
              { icon: BarChart3, title: "Real-time Monitor", desc: "Track progress with live dashboard" },
              { icon: Download, title: "Website Cloning", desc: "Clone and customize any website" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start space-x-4 p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <feature.icon className="h-6 w-6 text-violet-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-violet-600 to-indigo-600">
        <div className="container mx-auto max-w-4xl text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Workflow?</h2>
          <p className="text-xl mb-8 opacity-90">Join developers using Agentwise to build faster and smarter.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link 
              href="/docs/getting-started"
              className="flex items-center space-x-2 px-8 py-4 rounded-lg bg-white text-violet-600 hover:bg-gray-100 transition-all"
            >
              <span className="font-semibold">Get Started Now</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="https://github.com/VibeCodingWithPhil/agentwise"
              className="flex items-center space-x-2 px-8 py-4 rounded-lg border-2 border-white text-white hover:bg-white hover:text-violet-600 transition-all"
            >
              <span className="font-semibold">View on GitHub</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-6 w-6 text-violet-600" />
                <span className="font-bold">Agentwise</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Multi-agent orchestration for Claude Code
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Documentation</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/docs/getting-started" className="hover:text-violet-600">Getting Started</Link></li>
                <li><Link href="/docs/commands" className="hover:text-violet-600">Commands</Link></li>
                <li><Link href="/docs/agents" className="hover:text-violet-600">Agents</Link></li>
                <li><Link href="/docs/api" className="hover:text-violet-600">API Reference</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="https://github.com/VibeCodingWithPhil/agentwise" className="hover:text-violet-600">GitHub</a></li>
                <li><a href="https://github.com/VibeCodingWithPhil/agentwise/issues" className="hover:text-violet-600">Issues</a></li>
                <li><a href="https://github.com/VibeCodingWithPhil/agentwise/discussions" className="hover:text-violet-600">Discussions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/license" className="hover:text-violet-600">License</Link></li>
                <li><Link href="/privacy" className="hover:text-violet-600">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>© 2025 Agentwise. Built with ❤️ by Philip Ritmeester</p>
          </div>
        </div>
      </footer>
    </div>
  )
}