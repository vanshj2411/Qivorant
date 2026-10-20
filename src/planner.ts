export type Priority = 'High' | 'Medium' | 'Low'

export type PlannedTask = {
  id: number
  title: string
  priority: Priority
  completed: boolean
}

export type PlannerMode = 'ai' | 'fallback'

const priorities: Priority[] = ['High', 'Medium', 'Low']

export function buildFallbackPlan(goal: string): PlannedTask[] {
  return [
    { id: Date.now(), title: `Define what success means for “${goal}”`, priority: 'High', completed: false },
    { id: Date.now() + 1, title: `Break “${goal}” into a first concrete step`, priority: 'High', completed: false },
    { id: Date.now() + 2, title: 'Schedule time to review and continue progress', priority: 'Medium', completed: false },
  ]
}

function normalizePriority(value: unknown): Priority {
  const normalized = String(value ?? '').toLowerCase()
  return priorities.find((priority) => priority.toLowerCase() === normalized) ?? 'Medium'
}

export function normalizeAiTasks(payload: unknown): PlannedTask[] {
  const candidates = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { tasks?: unknown }).tasks)
      ? (payload as { tasks: unknown[] }).tasks
      : []

  const tasks = candidates
    .map((candidate, index) => {
      if (!candidate || typeof candidate !== 'object') return null
      const item = candidate as { title?: unknown; description?: unknown; priority?: unknown }
      const title = String(item.title ?? item.description ?? '').trim()
      if (!title) return null
      return { id: Date.now() + index, title, priority: normalizePriority(item.priority), completed: false }
    })
    .filter((task): task is PlannedTask => task !== null)

  if (tasks.length === 0) throw new Error('The AI planner returned no usable tasks.')
  return tasks.slice(0, 12)
}

export async function requestAiPlan(goal: string, endpoint: string): Promise<PlannedTask[]> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal }),
  })

  if (!response.ok) throw new Error(`AI planner returned HTTP ${response.status}.`)
  return normalizeAiTasks(await response.json())
}
