export default function MonitorCommandPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>/monitor Command</h1>
      <p>Real-time monitoring dashboard for agent progress.</p>
      
      <h2>Usage</h2>
      <pre><code>/monitor</code></pre>
      
      <h2>Features</h2>
      <ul>
        <li>Real-time agent status</li>
        <li>Task completion tracking</li>
        <li>Performance metrics</li>
        <li>Token usage statistics</li>
      </ul>
      
      <h2>Dashboard URL</h2>
      <p>Opens at: <code>http://localhost:3001</code></p>
    </div>
  );
}
