import { StrictMode, useEffect, useMemo, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { buildFallbackPlan, calculateProgress, getNextRecommendedTask, requestAiPlan, type PlannedTask, type PlannerMode, type Priority } from './planner'
import './styles.css'

type SavedGoal = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  plannerMode: PlannerMode
  duration?: string
  timePerDay?: string
  tasks: PlannedTask[]
}

type TaskFilter = 'all' | 'pending' | 'completed'
type PriorityFilter = 'all' | Priority

const STORAGE_KEY = 'qivorant-goals'

function readSavedGoals(): SavedGoal[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as SavedGoal[]
      if (Array.isArray(parsed)) return parsed.map(normalizeSavedGoal)
    }

    const legacy = localStorage.getItem('qivorant-active-plan')
    if (!legacy) return []
    const parsedLegacy = JSON.parse(legacy) as { goal?: string; tasks?: PlannedTask[] }
    if (!parsedLegacy.goal || !Array.isArray(parsedLegacy.tasks)) return []
    return [{
      id: `goal-${Date.now()}`,
      title: parsedLegacy.goal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      plannerMode: 'fallback',
      tasks: parsedLegacy.tasks.map(normalizeTask),
    }]
  } catch {
    return []
  }
}

function normalizeTask(task: PlannedTask): PlannedTask {
  return { ...task, description: task.description || `Complete the step: ${task.title}.`, completed: Boolean(task.completed) }
}

function normalizeSavedGoal(goal: SavedGoal): SavedGoal {
  return { ...goal, tasks: Array.isArray(goal.tasks) ? goal.tasks.map(normalizeTask) : [] }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value))
}

export function App() {
  const [goals, setGoals] = useState<SavedGoal[]>(readSavedGoals)
  const [activeGoalId, setActiveGoalId] = useState<string | null>(() => goals[0]?.id ?? null)
  const [isCreating, setIsCreating] = useState(false)
  const [plannerState, setPlannerState] = useState<'idle' | 'loading'>('idle')
  const [plannerNotice, setPlannerNotice] = useState('')
  const [error, setError] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null)

  const activeGoal = goals.find((goal) => goal.id === activeGoalId) ?? null

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
  }, [goals])

  function updateActiveGoal(updater: (goal: SavedGoal) => SavedGoal) {
    if (!activeGoalId) return
    setGoals((current) => current.map((goal) => goal.id === activeGoalId
      ? updater({ ...goal, updatedAt: new Date().toISOString() })
      : goal))
  }

  async function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const title = String(formData.get('new-goal') ?? '').trim()
    const duration = String(formData.get('duration') ?? '').trim()
    const timePerDay = String(formData.get('time-per-day') ?? '').trim()

    if (!title) {
      setError('Please enter a goal before creating a plan.')
      return
    }

    setError('')
    setPlannerState('loading')
    setPlannerNotice('')

    const endpoint = String(import.meta.env.VITE_AI_PLANNER_URL ?? '').trim()
    let tasks: PlannedTask[]
    let plannerMode: PlannerMode = 'fallback'

    if (endpoint) {
      try {
        tasks = await requestAiPlan(title, endpoint, { duration, timePerDay })
        plannerMode = 'ai'
        setPlannerNotice('Generated with your configured AI planner.')
      } catch {
        tasks = buildFallbackPlan(title, { duration, timePerDay })
        setPlannerNotice('AI planner unavailable, so Qivorant used its deterministic fallback plan.')
      }
    } else {
      tasks = buildFallbackPlan(title, { duration, timePerDay })
      setPlannerNotice('Deterministic fallback plan — configure VITE_AI_PLANNER_URL to enable AI planning.')
    }

    const now = new Date().toISOString()
    const newGoal: SavedGoal = {
      id: `goal-${Date.now()}`,
      title,
      createdAt: now,
      updatedAt: now,
      plannerMode,
      duration: duration || undefined,
      timePerDay: timePerDay || undefined,
      tasks,
    }
    setGoals((current) => [newGoal, ...current])
    setActiveGoalId(newGoal.id)
    setIsCreating(false)
    setPlannerState('idle')
    setTaskFilter('all')
    setPriorityFilter('all')
    setHighlightedTaskId(null)
  }

  function toggleTask(taskId: number) {
    updateActiveGoal((goal) => ({ ...goal, tasks: goal.tasks.map((task) => task.id === taskId ? { ...task, completed: !task.completed } : task) }))
  }

  function updateTask(taskId: number, updates: Partial<PlannedTask>) {
    updateActiveGoal((goal) => ({ ...goal, tasks: goal.tasks.map((task) => task.id === taskId ? { ...task, ...updates } : task) }))
    setEditingTaskId(null)
  }

  function deleteTask(taskId: number) {
    updateActiveGoal((goal) => ({ ...goal, tasks: goal.tasks.filter((task) => task.id !== taskId) }))
  }

  function focusNextTask() {
    if (!nextTask) return
    setTaskFilter('all')
    setPriorityFilter('all')
    setHighlightedTaskId(nextTask.id)
    window.requestAnimationFrame(() => document.getElementById(`task-${nextTask.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  function moveTask(taskId: number, direction: -1 | 1) {
    updateActiveGoal((goal) => {
      const index = goal.tasks.findIndex((task) => task.id === taskId)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= goal.tasks.length) return goal
      const tasks = [...goal.tasks]
      ;[tasks[index], tasks[nextIndex]] = [tasks[nextIndex], tasks[index]]
      return { ...goal, tasks }
    })
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const title = String(data.get('new-task') ?? '').trim()
    if (!title) return
    const priority = String(data.get('new-priority') ?? 'Medium') as Priority
    updateActiveGoal((goal) => ({
      ...goal,
      tasks: [...goal.tasks, { id: Date.now(), title, description: `Complete the step: ${title}.`, priority, completed: false }],
    }))
    form.reset()
  }

  function deleteGoal(goalId: string) {
    const remaining = goals.filter((goal) => goal.id !== goalId)
    setGoals(remaining)
    if (activeGoalId === goalId) {
      setActiveGoalId(remaining[0]?.id ?? null)
      setIsCreating(remaining.length === 0)
    }
  }

  function startNewGoal() {
    setActiveGoalId(null)
    setIsCreating(true)
    setError('')
    setPlannerNotice('')
  }

  const visibleTasks = useMemo(() => {
    if (!activeGoal) return []
    return activeGoal.tasks.filter((task) => {
      const matchesState = taskFilter === 'all' || (taskFilter === 'completed' ? task.completed : !task.completed)
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
      return matchesState && matchesPriority
    })
  }, [activeGoal, priorityFilter, taskFilter])

  const completedCount = activeGoal?.tasks.filter((task) => task.completed).length ?? 0
  const totalTasks = activeGoal?.tasks.length ?? 0
  const progress = activeGoal ? calculateProgress(activeGoal.tasks) : 0
  const nextTask = activeGoal ? getNextRecommendedTask(activeGoal.tasks) : null

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Saved goals">
        <div className="brand"><span className="brand-mark">✦</span><span>Qivorant</span></div>
        <button type="button" className="new-goal-button" onClick={startNewGoal}>＋ New goal</button>
        <div className="sidebar-heading"><span>Your goals</span><span>{goals.length}</span></div>
        <nav className="goal-list">
          {goals.length === 0 && <p className="sidebar-empty">Your saved plans will appear here.</p>}
          {goals.map((goal) => (
            <div key={goal.id} className={`goal-row ${goal.id === activeGoalId ? 'goal-row-active' : ''}`}>
              <button type="button" className="goal-select" onClick={() => { setActiveGoalId(goal.id); setIsCreating(false) }}>
                <span className="goal-row-title">{goal.title}</span>
                <span className="goal-row-meta">{goal.tasks.filter((task) => task.completed).length}/{goal.tasks.length} complete · {formatDate(goal.updatedAt)}</span>
              </button>
              <button type="button" className="goal-delete" aria-label={`Delete goal ${goal.title}`} onClick={() => deleteGoal(goal.id)}>×</button>
            </div>
          ))}
        </nav>
        <p className="sidebar-footer">Local-first workspace<br />Your plans stay in this browser.</p>
      </aside>

      <section className="workspace">
        <header className="hero" aria-labelledby="app-title">
          <p className="eyebrow">QIVORANT / FRONTIER BUILDATHON 2026</p>
          <h1 id="app-title">From intent to execution.</h1>
          <p className="hero-copy">Turn a meaningful goal into a clear, prioritized plan you can actually finish.</p>
          <div className="status-pill" role="status"><span className="status-dot" aria-hidden="true" />{activeGoal ? `${completedCount} of ${totalTasks} tasks complete` : 'Planning workspace is ready'}</div>
        </header>

        <section className="main-card" aria-label="Planning workspace">
          <div className="card-icon" aria-hidden="true">✦</div>
          {!activeGoal && !isCreating ? (
            <div className="empty-state">
              <p className="section-kicker">START WITH INTENT</p>
              <h2>Your next goal starts here</h2>
              <p>Describe what you want to accomplish and Qivorant will map the path forward.</p>
              <button type="button" className="primary-button" onClick={() => setIsCreating(true)}>Create your first goal</button>
            </div>
          ) : !activeGoal || isCreating ? (
            <div className="empty-state">
              <p className="section-kicker">START WITH INTENT</p>
              <h2>{goals.length > 0 ? 'Plan something new' : 'Your next goal starts here'}</h2>
              <p>Describe what you want to accomplish and Qivorant will map the path forward.</p>
              <form className="goal-form" onSubmit={createPlan}>
                <label htmlFor="goal-input">What do you want to accomplish?</label>
                <input id="goal-input" name="new-goal" placeholder="e.g. Launch my portfolio website" autoFocus />
                <div className="goal-options">
                  <div><label htmlFor="duration-input">Target duration <span>(optional)</span></label><input id="duration-input" name="duration" placeholder="e.g. 30 days" /></div>
                  <div><label htmlFor="time-input">Time per day <span>(optional)</span></label><input id="time-input" name="time-per-day" placeholder="e.g. 60 minutes" /></div>
                </div>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button type="submit" className="primary-button" disabled={plannerState === 'loading'}>{plannerState === 'loading' ? 'Planning…' : 'Generate plan'}</button>
              </form>
              {plannerNotice && <p className="planner-notice">{plannerNotice}</p>}
            </div>
          ) : (
            <div className="plan" aria-label="Generated plan">
              <div className="plan-toolbar">
                <div><p className="plan-label">{activeGoal.plannerMode === 'ai' ? 'AI PLAN / EXECUTE STEP BY STEP' : 'FALLBACK PLAN / EXECUTE STEP BY STEP'}</p><p className="plan-date">Updated {formatDate(activeGoal.updatedAt)}</p></div>
                <button type="button" className="text-button" onClick={startNewGoal}>New goal</button>
              </div>
              <h2>{activeGoal.title}</h2>
              {(activeGoal.duration || activeGoal.timePerDay) && <p className="goal-details">{activeGoal.duration && `Target: ${activeGoal.duration}`}{activeGoal.duration && activeGoal.timePerDay && ' · '}{activeGoal.timePerDay && `${activeGoal.timePerDay} per day`}</p>}
              {plannerNotice && <p className="planner-notice">{plannerNotice}</p>}
              <div className="progress-summary" aria-label="Plan progress">
                <div className="progress-heading"><span>{completedCount} of {totalTasks} tasks complete</span><strong>{progress}%</strong></div>
                <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
              </div>
              <section className={`next-step ${nextTask ? '' : 'next-step-complete'}`} aria-label="Next recommended step">
                <div className="next-step-heading"><span className="section-kicker">NEXT RECOMMENDED STEP</span>{nextTask && <strong className={`priority priority-${nextTask.priority.toLowerCase()}`}>{nextTask.priority}</strong>}</div>
                {nextTask ? <><h3>{nextTask.title}</h3><p>{nextTask.description}</p>{nextTask.suggestedTiming && <small>Suggested timing: {nextTask.suggestedTiming}</small>}<button type="button" className="secondary-button" onClick={focusNextTask}>Go to this task</button></> : <p className="next-step-success">✓ You completed every task in this roadmap.</p>}
              </section>
              <form className="add-task-form" onSubmit={addTask}>
                <input name="new-task" placeholder="Add a task to this plan…" aria-label="New task" />
                <select name="new-priority" defaultValue="Medium" aria-label="New task priority"><option>High</option><option>Medium</option><option>Low</option></select>
                <button type="submit" className="secondary-button">Add task</button>
              </form>
              <div className="filter-bar" aria-label="Task filters">
                <div className="filter-group"><button type="button" className={taskFilter === 'all' ? 'filter-active' : ''} onClick={() => setTaskFilter('all')}>All</button><button type="button" className={taskFilter === 'pending' ? 'filter-active' : ''} onClick={() => setTaskFilter('pending')}>Pending</button><button type="button" className={taskFilter === 'completed' ? 'filter-active' : ''} onClick={() => setTaskFilter('completed')}>Done</button></div>
                <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)} aria-label="Filter by priority"><option value="all">All priorities</option><option>High</option><option>Medium</option><option>Low</option></select>
              </div>
              {totalTasks > 0 && completedCount === totalTasks && <div className="all-done" role="status">✓ All tasks complete. Nice work.</div>}
              {visibleTasks.length === 0 ? <p className="no-tasks">No tasks match this filter.</p> : (
                <ol className="task-list">
                  {visibleTasks.map((task) => {
                    const taskIndex = activeGoal.tasks.findIndex((item) => item.id === task.id)
                    return <li id={`task-${task.id}`} key={task.id} className={`${task.completed ? 'task-complete' : ''} ${highlightedTaskId === task.id ? 'task-highlighted' : ''}`}>
                      {editingTaskId === task.id ? <form className="task-edit-form" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); updateTask(task.id, { title: String(data.get('title') ?? '').trim() || task.title, description: String(data.get('description') ?? '').trim() || task.description, priority: String(data.get('priority') ?? task.priority) as Priority }) }}><input name="title" defaultValue={task.title} aria-label="Task title" /><input name="description" defaultValue={task.description} aria-label="Task description" /><select name="priority" defaultValue={task.priority} aria-label="Task priority"><option>High</option><option>Medium</option><option>Low</option></select><button type="submit" className="text-button">Save</button></form> : <><label className="task-label"><input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} /><span><strong>{task.title}</strong><small>{task.description}</small></span></label><div className="task-actions"><strong className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</strong><button type="button" className="icon-button" aria-label={`Move ${task.title} up`} disabled={taskIndex === 0} onClick={() => moveTask(task.id, -1)}>↑</button><button type="button" className="icon-button" aria-label={`Move ${task.title} down`} disabled={taskIndex === activeGoal.tasks.length - 1} onClick={() => moveTask(task.id, 1)}>↓</button><button type="button" className="icon-button" aria-label={`Edit ${task.title}`} onClick={() => setEditingTaskId(task.id)}>Edit</button><button type="button" className="icon-button danger" aria-label={`Delete ${task.title}`} onClick={() => deleteTask(task.id)}>Delete</button></div></>}
                    </li>
                  })}
                </ol>
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

const rootElement = document.getElementById('root')
if (rootElement) createRoot(rootElement).render(<StrictMode><App /></StrictMode>)
