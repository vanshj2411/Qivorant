import { describe, expect, it } from 'vitest'
import { buildFallbackPlan, normalizeAiTasks } from './planner'

describe('planner', () => {
  it('creates a deterministic fallback plan with ordered priorities', () => {
    const tasks = buildFallbackPlan('Launch a portfolio')

    expect(tasks).toHaveLength(3)
    expect(tasks[0]).toMatchObject({ priority: 'High', completed: false })
    expect(tasks[1].title).toContain('Launch a portfolio')
    expect(tasks[2].priority).toBe('Medium')
  })

  it('normalizes valid AI task payloads', () => {
    const tasks = normalizeAiTasks({ tasks: [
      { title: 'Research options', priority: 'high' },
      { description: 'Choose the best option', priority: 'low' },
    ] })

    expect(tasks.map((task) => task.title)).toEqual(['Research options', 'Choose the best option'])
    expect(tasks[0].priority).toBe('High')
    expect(tasks[1].priority).toBe('Low')
  })

  it('rejects AI payloads without usable tasks', () => {
    expect(() => normalizeAiTasks({ tasks: [{ priority: 'high' }] })).toThrow(/no usable tasks/i)
  })
})
