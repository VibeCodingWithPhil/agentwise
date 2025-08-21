import { Sidebar } from "@/components/layout/sidebar"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-background/50 backdrop-blur">
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex-1">
        <div className="container max-w-4xl py-8">
          <Breadcrumbs />
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}