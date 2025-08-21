export default function CreateCommandPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>/create Command</h1>
      <p>Create new projects with intelligent agent orchestration.</p>
      
      <h2>Syntax</h2>
      <pre><code>/create "project description"</code></pre>
      
      <h2>Examples</h2>
      <ul>
        <li><code>/create "todo app with React and Firebase"</code></li>
        <li><code>/create "e-commerce platform with Next.js"</code></li>
        <li><code>/create "blog with WordPress theme"</code></li>
      </ul>
      
      <h2>How It Works</h2>
      <ol>
        <li>Analyzes your project description</li>
        <li>Selects appropriate specialized agents</li>
        <li>Creates project structure</li>
        <li>Orchestrates parallel development</li>
      </ol>
    </div>
  );
}
