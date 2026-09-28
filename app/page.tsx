export default function Home() {
  return (
    <main className="shell">
      <section className="card">
        <div className="badge">MCP SERVER</div>
        <h1>Learn Stuff</h1>
        <p className="lede">
          Adaptive teaching with server-graded knowledge checks through native MCP elicitation.
        </p>

        <div className="statusGrid">
          <div>
            <span className="label">MCP endpoint</span>
            <code>/mcp</code>
          </div>
          <div>
            <span className="label">Quiz interaction</span>
            <strong>Native elicitation</strong>
          </div>
        </div>

        <div className="steps">
          <h2>After deploying</h2>
          <ol>
            <li>Copy this deployment&apos;s URL and append <code>/mcp</code>.</li>
            <li>Add that MCP URL to ChatGPT&apos;s developer/plugin connection flow.</li>
            <li>Install the bundled teaching skill and start with “Teach me …”.</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
