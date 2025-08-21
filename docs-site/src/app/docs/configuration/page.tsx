export default function ConfigurationPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>Configuration</h1>
      <p>Configure Agentwise to suit your development workflow.</p>
      
      <h2>Configuration Files</h2>
      <ul>
        <li><code>projects.json</code> - Project registry</li>
        <li><code>config/settings.json</code> - Global settings</li>
        <li><code>.claude/</code> - Agent and command definitions</li>
      </ul>
      
      <h2>Environment Variables</h2>
      <p>Set these variables for enhanced functionality:</p>
      <ul>
        <li><code>AGENTWISE_HOME</code> - Installation directory</li>
        <li><code>CLAUDE_FLAGS</code> - Default Claude flags</li>
      </ul>
    </div>
  );
}
