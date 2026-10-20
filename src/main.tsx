import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

function App() {
  return (
    <main className="shell">
      <section className="hero" aria-labelledby="app-title">
        <p className="eyebrow">QIVORANT / FRONTIER BUILDATHON 2026</p>
        <h1 id="app-title">From intent to execution.</h1>
        <p className="hero-copy">
          Turn a meaningful goal into a clear, prioritized plan you can actually finish.
        </p>
        <div className="status-pill" role="status">
          <span className="status-dot" aria-hidden="true" />
          Planning workspace is ready
        </div>
      </section>

      <section className="empty-card" aria-label="Getting started">
        <div className="card-icon" aria-hidden="true">✦</div>
        <h2>Your next goal starts here</h2>
        <p>Describe what you want to accomplish and Qivorant will help map the path forward.</p>
        <button type="button" className="primary-button">Create your first goal</button>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
