import { StrictMode, useEffect, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

type Priority = 'High' | 'Medium' | 'Low'

type PlannedTask = {
  id: number
  title: string
  priority: Priority
  completed: boolean
}

type StoredPlan = {
  goal: string
  tasks: PlannedTask[]
}

const STORAGE_KEY = 'qivorant-active-plan'

function buildFallbackPlan(goal: string): PlannedTask[] {
  return [
    { id: 1, title: `Define what success means for “${goal}”`, priority: 'High', completed: false },
    { id: 2, title: `Break “${goal}” into a first concrete step`, priority: 'High', completed: false },
    { id: 3, title: 'Schedule time to review and continue progress', priority: 'Medium', completed: false },
  ]
}

function readStoredPlan(): StoredPlan {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { goal: '', tasks: [] }

    const parsed = JSON.parse(stored) as StoredPlan
    if (!parsed.goal || !Array.isArray(parsed.tasks)) return { goal: '', tasks: [] }
    return parsed
  } catch {
    return { goal: '', tasks: [] }
  }
}

export function App() {
  const [{ goal, tasks }, setPlan] = useState<StoredPlan>(readStoredPlan)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)

  useEffect(() => {
    if (goal && tasks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ goal, tasks }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [goal, tasks])

  function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const trimmedGoal = String(formData.get('new-goal') ?? '').trim()

    if (!trimmedGoal) {
      setError('Please enter a goal before creating a plan.')
      return
    }

    setError('')
    setPlan({ goal: trimmedGoal, tasks: buildFallbackPlan(trimmedGoal) })
    setIsCreating(false)
  }

  function toggleTask(taskId: number) {
    setPlan((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === taskId ? { ...task, completed: !task.completed } : task),
    }))
  }

  function updateTask(taskId: number, updates: Partial<PlannedTask>) {
    setPlan((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === taskId ? { ...task, ...updates } : task),
    }))
    setEditingTaskId(null)
  }

  function deleteTask(taskId: number) {
    setPlan((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== taskId),
    }))
  }

  function startNewGoal() {
    setPlan({ goal: '', tasks: [] })
    setIsCreating(true)
    setError('')
  }

  const completedCount = tasks.filter((task) => task.completed).length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <main className="shell">
      <section className="hero" aria-labelledby="app-title">
        <p className="eyebrow">QIVORANT / FRONTIER BUILDATHON 2026</p>
        <h1 id="app-title">From intent to execution.</h1>
        <p className="hero-copy">Turn a meaningful goal into a clear, prioritized plan you can actually finish.</p>
        <div className="status-pill" role="status">
          <span className="status-dot" aria-hidden="true" />
          {tasks.length > 0 ? `${completedCount} of ${tasks.length} tasks complete` : 'Planning workspace is ready'}
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
                <input id="goal-input" name="new-goal" placeholder="e.g. Launch my portfolio website" autoFocus />
                {error && <p className="form-error" role="alert">{error}</p>}
                <button type="submit" className="primary-button">Generate plan</button>
              </form>
            )}
          </>
        ) : (
          <div className="plan" aria-label="Generated plan">
            <div className="plan-toolbar">
              <p className="plan-label">FALLBACK PLAN / EXECUTE STEP BY STEP</p>
              <button type="button" className="text-button" onClick={startNewGoal}>New goal</button>
            </div>
            <h2>{goal}</h2>
            <div className="progress-summary" aria-label="Plan progress">
              <div className="progress-heading"><span>{completedCount} of {tasks.length} tasks complete</span><strong>{progress}%</strong></div>
              <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            </div>
            <ol className="task-list">
              {tasks.map((task) => (
                <li key={task.id} className={task.completed ? 'task-complete' : ''}>
                  {editingTaskId === task.id ? (
                    <form className="task-edit-form" onSubmit={(event) => {
                      event.preventDefault()
                      const formData = new FormData(event.currentTarget)
                      updateTask(task.id, {
                        title: String(formData.get('title') ?? '').trim() || task.title,
                        priority: String(formData.get('priority') ?? task.priority) as Priority,
                      })
                    }}>
                      <input name="title" defaultValue={task.title} aria-label="Task title" />
                      <select name="priority" defaultValue={task.priority} aria-label="Task priority">
                        <option>High</option><option>Medium</option><option>Low</option>
                      </select>
                      <button type="submit" className="text-button">Save</button>
                    </form>
                  ) : (
                    <>
                      <label className="task-label">
                        <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
                        <span>{task.title}</span>
                      </label>
                      <div className="task-actions">
                        <strong className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</strong>
                        <button type="button" className="icon-button" aria-label={`Edit ${task.title}`} onClick={() => setEditingTaskId(task.id)}>Edit</button>
                        <button type="button" className="icon-button danger" aria-label={`Delete ${task.title}`} onClick={() => deleteTask(task.id)}>Delete</button>
                      </div>
                    </>
                  )}
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
  createRoot(rootElement).render(<StrictMode><App /></StrictMode>)
}
