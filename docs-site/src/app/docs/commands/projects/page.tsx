import { Folder, FolderOpen, RotateCcw, Archive, CheckCircle, Clock } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const projectFeatures = [
  {
    title: "List All Projects",
    description: "View comprehensive project registry with metadata",
    icon: Folder,
    actions: ["View all projects", "Check status", "See creation dates", "View agent assignments"]
  },
  {
    title: "Switch Active Project",
    description: "Seamlessly switch context between different projects",
    icon: FolderOpen,
    actions: ["Set active project", "Context switching", "Auto-activation", "Persistent state"]
  },
  {
    title: "View Project Status",
    description: "Detailed insights into project progress and health",
    icon: CheckCircle,
    actions: ["Progress tracking", "Agent status", "Task completion", "Error monitoring"]
  },
  {
    title: "Archive Old Projects",
    description: "Clean up workspace by archiving completed projects",
    icon: Archive,
    actions: ["Archive projects", "Backup creation", "Storage cleanup", "Registry maintenance"]
  }
]

const projectStates = [
  { status: "Active", description: "Currently being worked on", color: "text-green-600", badge: "default" },
  { status: "Completed", description: "Successfully finished project", color: "text-blue-600", badge: "secondary" },
  { status: "Paused", description: "Temporarily suspended", color: "text-yellow-600", badge: "outline" },
  { status: "Error", description: "Encountered issues", color: "text-red-600", badge: "destructive" }
]

const sampleProjects = [
  {
    name: "todo-react-app",
    status: "Active",
    created: "2024-01-15",
    agents: ["Frontend", "Database", "Testing"],
    phase: "Development",
    progress: "75%"
  },
  {
    name: "ecommerce-platform",
    status: "Completed",
    created: "2024-01-10",
    agents: ["Frontend", "Backend", "Database", "DevOps"],
    phase: "Deployed",
    progress: "100%"
  },
  {
    name: "blog-cms",
    status: "Paused",
    created: "2024-01-12",
    agents: ["Backend", "Frontend"],
    phase: "Planning",
    progress: "25%"
  }
]

export default function ProjectsCommandPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Folder className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">/projects Command</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Comprehensive project management and workspace organization for multi-project workflows.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Usage */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400">Command Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock language="bash">
/projects
          </CodeBlock>
          <p className="text-sm text-muted-foreground mt-3">
            Opens interactive project selector with full project management capabilities.
          </p>
        </CardContent>
      </Card>

      {/* Project Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📋 Project Management Features</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {projectFeatures.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-accent" />
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {feature.actions.map((action, actionIndex) => (
                      <div key={actionIndex} className="text-xs bg-muted/50 p-2 rounded text-center">
                        {action}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Project States */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🟢 Project Status Types</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          {projectStates.map((state, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Badge variant={state.badge as any} className="text-xs">
                    {state.status}
                  </Badge>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${state.color}`}>{state.status}</h3>
                    <p className="text-sm text-muted-foreground">{state.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sample Projects */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📏 Sample Project Registry</h2>
        <p className="text-muted-foreground">
          Example of how your projects will appear in the registry with full metadata.
        </p>
        
        <div className="space-y-4">
          {sampleProjects.map((project, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-accent" />
                    <div>
                      <h3 className="font-semibold text-foreground">{project.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={
                            project.status === "Active" ? "default" :
                            project.status === "Completed" ? "secondary" :
                            project.status === "Paused" ? "outline" : "destructive"
                          }
                          className="text-xs"
                        >
                          {project.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Created: {project.created}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">{project.progress}</div>
                    <div className="text-xs text-muted-foreground">{project.phase}</div>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Agents:</span> {project.agents.join(", ")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {project.agents.length} agents assigned
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Advanced Features */}
      <Card className="bg-gradient-to-r from-success/5 to-accent/5 border-success/20">
        <CardHeader>
          <CardTitle className="text-success-700 dark:text-success-400 flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Advanced Project Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Context Management</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Persistent project context for 24 hours</li>
                <li>• Automatic context switching</li>
                <li>• Smart agent reactivation</li>
                <li>• Cross-project resource sharing</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Workspace Organization</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Isolated project environments</li>
                <li>• Automatic backup creation</li>
                <li>• Registry synchronization</li>
                <li>• Performance analytics per project</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
