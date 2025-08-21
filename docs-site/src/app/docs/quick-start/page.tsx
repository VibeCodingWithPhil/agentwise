export default function QuickStartPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Quick Start Guide</h1>
      <p>Get up and running with Agentwise in minutes.</p>
      
      <h2>Prerequisites</h2>
      <ul>
        <li>Node.js 18+</li>
        <li>Claude Code CLI</li>
        <li>Git (recommended)</li>
      </ul>
      
      <h2>Installation</h2>
      <pre><code className="language-bash">
curl -fsSL https://raw.githubusercontent.com/VibeCodingWithPhil/agentwise/main/installers/install.sh | bash
      </code></pre>
      
      <h2>Your First Project</h2>
      <ol>
        <li>Start Claude Code: <code>claude --dangerously-skip-permissions</code></li>
        <li>Create a project: <code>/create "your project idea"</code></li>
        <li>Monitor progress: <code>/monitor</code></li>
      </ol>
    </div>
  );
}
