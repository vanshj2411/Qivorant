export type Priority = 'High' | 'Medium' | 'Low'

export type PlannedTask = {
  id: number
  title: string
  description: string
  priority: Priority
  suggestedTiming?: string
  completed: boolean
}

export type PlannerMode = 'ai' | 'fallback'

export type PlanOptions = {
  duration?: string
  timePerDay?: string
}

const priorities: Priority[] = ['High', 'Medium', 'Low']

function task(index: number, title: string, description: string, priority: Priority, suggestedTiming?: string): PlannedTask {
  return { id: Date.now() + index, title, description, priority, suggestedTiming, completed: false }
}

export function buildFallbackPlan(goal: string, options: PlanOptions = {}): PlannedTask[] {
  const normalized = goal.toLowerCase()
  const durationNote = options.duration ? ` Work within the ${options.duration} target.` : ''
  const timeNote = options.timePerDay ? ` Aim for about ${options.timePerDay} per day.` : ''

  if (/(website|web app|software|app|code|portfolio|dashboard|platform)/.test(normalized)) {
    return [
      task(0, `Define the scope for ${goal}`, `Write down the target users, core pages or features, and what “done” means.${durationNote}`, 'High', 'Day 1'),
      task(1, 'Choose the stack and create the project skeleton', `Select the tools, create the repository, and make the first screen run locally.`, 'High', 'Days 1–2'),
      task(2, 'Build the core user flow', `Implement the smallest useful path from input to result before adding polish.`, 'High', 'Days 3–10'),
      task(3, 'Add responsive design and important edge cases', `Make the flow usable on small screens and handle empty, invalid, and loading states.`, 'Medium', 'Days 11–16'),
      task(4, 'Test the main flow', `Run the project tests and manually verify the happy path plus one failure case.`, 'Medium', 'Days 17–20'),
      task(5, 'Deploy and collect feedback', `Publish the project, share it with a tester, and record the highest-impact fixes.${timeNote}`, 'Low', 'Final days'),
    ]
  }

  if (/(interview|placement|exam|examination|test|assessment|certification)/.test(normalized)) {
    return [
      task(0, `List the topics covered by ${goal}`, `Gather the syllabus, role requirements, or past papers and turn them into a checklist.`, 'High', 'Today'),
      task(1, 'Measure your starting point', `Complete a short practice set or mock interview and note the gaps to prioritize.`, 'High', 'Day 1'),
      task(2, 'Study the highest-impact gaps', `Work through focused notes and examples for the topics where you lost the most points.${timeNote}`, 'High', 'Main study block'),
      task(3, 'Practice under realistic conditions', `Complete timed questions or rehearse answers without relying on notes.`, 'Medium', 'Every 2–3 days'),
      task(4, 'Review mistakes and refine your approach', `Keep an error log and revisit the patterns that keep recurring.`, 'Medium', 'After each practice'),
      task(5, 'Prepare the final checklist', `Confirm logistics, materials, questions to ask, and a calm plan for the day.`, 'Low', 'Final day'),
    ]
  }

  if (/(learn|study|master|skill|javascript|python|typescript|programming|technical|course)/.test(normalized)) {
    return [
      task(0, `Define the outcome for learning ${goal}`, `Choose a small project or measurable result that proves the skill is useful.`, 'High', 'Today'),
      task(1, 'Set up a focused learning path', `Pick one reliable course, book, or documentation path and remove competing resources.`, 'High', 'Day 1'),
      task(2, 'Learn the essential concepts', `Study the fundamentals and write short notes in your own words.${timeNote}`, 'High', 'First week'),
      task(3, 'Build a small practice project', `Apply the concepts in a concrete project and keep the scope intentionally small.`, 'Medium', 'Second week'),
      task(4, 'Get feedback and fix weak areas', `Compare your work with a reference or ask for review, then address the biggest gaps.`, 'Medium', 'After practice'),
      task(5, 'Publish your result and plan the next level', `Share the finished exercise and choose the next skill based on what you learned.`, 'Low', 'Final week'),
    ]
  }

  if (/(startup|product|business|launch|market|saas|service|customer)/.test(normalized)) {
    return [
      task(0, `Clarify the customer problem behind ${goal}`, `Describe who has the problem, why it matters, and what outcome they want.`, 'High', 'Days 1–2'),
      task(1, 'Validate the idea with real people', `Speak to a few target users and record repeated pain points before building.`, 'High', 'Days 3–5'),
      task(2, 'Define the smallest viable offer', `Choose the one promise and minimum feature set that can test demand.`, 'High', 'Week 1'),
      task(3, 'Create and test the first version', `Build a lightweight prototype or landing page and put it in front of users.`, 'Medium', 'Weeks 2–3'),
      task(4, 'Measure feedback and improve the offer', `Track interest, objections, and usage; make one focused iteration.`, 'Medium', 'Week 4'),
      task(5, 'Plan the launch and next experiment', `Set the launch channel, success metric, owner, and next decision point.`, 'Low', 'Final week'),
    ]
  }

  return [
    task(0, `Define the outcome for ${goal}`, `Write a clear result, who it helps, and how you will know it is complete.${durationNote}`, 'High', 'Today'),
    task(1, 'Gather the information and resources you need', `Collect the people, materials, decisions, and constraints that could block the work.`, 'High', 'First step'),
    task(2, 'Complete the first concrete action', `Choose the smallest action that creates momentum and finish it before expanding the scope.`, 'Medium', 'Next work session'),
    task(3, 'Review progress and adjust the plan', `Check what changed, remove unnecessary work, and choose the next most valuable action.`, 'Low', 'Weekly review'),
  ]
}

export function getNextRecommendedTask(tasks: PlannedTask[]): PlannedTask | null {
  return tasks.find((taskItem) => !taskItem.completed) ?? null
}

export function calculateProgress(tasks: PlannedTask[]): number {
  return tasks.length === 0 ? 0 : Math.round((tasks.filter((taskItem) => taskItem.completed).length / tasks.length) * 100)
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
    .map((candidate, index): PlannedTask | null => {
      if (!candidate || typeof candidate !== 'object') return null
      const item = candidate as { title?: unknown; description?: unknown; priority?: unknown; suggestedTiming?: unknown; timing?: unknown }
      const title = String(item.title ?? item.description ?? '').trim()
      const description = String(item.description ?? '').trim()
      if (!title) return null
      return {
        id: Date.now() + index,
        title,
        description: description || `Complete the step: ${title}.`,
        priority: normalizePriority(item.priority),
        suggestedTiming: String(item.suggestedTiming ?? item.timing ?? '').trim() || undefined,
        completed: false,
      }
    })
    .filter((plannedTask): plannedTask is PlannedTask => plannedTask !== null)

  if (tasks.length === 0) throw new Error('The AI planner returned no usable tasks.')
  return tasks.slice(0, 12)
}

export async function requestAiPlan(goal: string, endpoint: string, options: PlanOptions = {}): Promise<PlannedTask[]> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal, ...options }),
  })

  if (!response.ok) throw new Error(`AI planner returned HTTP ${response.status}.`)
  return normalizeAiTasks(await response.json())
}
