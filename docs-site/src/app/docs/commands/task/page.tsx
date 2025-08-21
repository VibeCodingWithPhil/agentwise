export default function TaskCommandPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>/task Command</h1>
      <p>Add features to your active project.</p>
      
      <h2>Syntax</h2>
      <pre><code>/task "feature description"</code></pre>
      
      <h2>Examples</h2>
      <ul>
        <li><code>/task "add user authentication"</code></li>
        <li><code>/task "create responsive navigation"</code></li>
        <li><code>/task "implement payment processing"</code></li>
      </ul>
    </div>
  );
}
