export default function FigmaCommandPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <h1>/figma Command</h1>
      <p>Convert Figma designs to code.</p>
      
      <h2>Syntax</h2>
      <pre><code>/figma "figma-url"</code></pre>
      
      <h2>Requirements</h2>
      <ul>
        <li>Figma Dev Mode access</li>
        <li>API token configured</li>
      </ul>
    </div>
  );
}
