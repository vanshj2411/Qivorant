import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import './styles.css'

type PlannedTask = {
  id: number
  title: string
  priority: 'High' | 'Medium' | 'Low'
}

function buildFallbackPlan(goal: string): PlannedTask[] {
  return [
    { id: 1, title: `Define what success means for “${goal}”`, priority: 'High' },
    { id: 2, title: `Break “${goal}” into a first concrete step`, priority: 'High' },
    { id: 3, title: 'Schedule time to review and continue progress', priority: 'Medium' },
  ]
}

export function App() {
  const [isCreating, setIsCreating] = useState(false)
  const [goal, setGoal] = useState('')
  const [tasks, setTasks] = useState<PlannedTask[]>([])
  const [error, setError] = useState('')

  function createPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedGoal = goal.trim()

    if (!trimmedGoal) {
      setError('Please enter a goal before creating a plan.')
      return
    }

    setError('')
    setTasks(buildFallbackPlan(trimmedGoal))
  }

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
        {tasks.length === 0 ? (
          <>
            <h2>Your next goal starts here</h2>
            <p>Describe what you want to accomplish and Qivorant will help map the path forward.</p>
            {!isCreating ? (
              <button type="button" className="primary-button" onClick={() => setIsCreating(true)}>
                Create your first goal
              </button>
            ) : (
              <form className="goal-form" onSubmit={createPlan}>
                <label htmlFor="goal-input">What do you want to accomplish?</label>
                <input
                  id="goal-input"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="e.g. Launch my portfolio website"
                  autoFocus
                />
                {error && <p className="form-error" role="alert">{error}</p>}
                <button type="submit" className="primary-button">Generate plan</button>
              </form>
            )}
          </>
        ) : (
          <div className="plan" aria-label="Generated plan">
            <p className="plan-label">FALLBACK PLAN / READY TO EDIT</p>
            <h2>{goal}</h2>
            <ol className="task-list">
              {tasks.map((task) => (
                <li key={task.id}>
                  <span>{task.title}</span>
                  <strong className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</strong>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>
    </main>
  )
}

const rootElement = document.getElementById('root')

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
