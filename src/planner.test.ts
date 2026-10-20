import { describe, expect, it } from 'vitest'
import { buildFallbackPlan, calculateProgress, getNextRecommendedTask, normalizeAiTasks } from './planner'

describe('planner', () => {
  it('creates a deterministic fallback plan with ordered priorities', () => {
    const tasks = buildFallbackPlan('Launch a portfolio')

    expect(tasks.length).toBeGreaterThan(3)
    expect(tasks[0]).toMatchObject({ priority: 'High', completed: false })
    expect(tasks[0].title).toContain('Launch a portfolio')
    expect(tasks.some((task) => task.title.includes('responsive'))).toBe(true)
  })

  it('uses goal categories and optional planning constraints', () => {
    const tasks = buildFallbackPlan('Prepare for a technical interview', { duration: '14 days', timePerDay: '45 minutes' })

    expect(tasks[0].title).toContain('topics')
    expect(tasks.some((task) => /practice/i.test(task.title))).toBe(true)
    expect(tasks.some((task) => task.description.includes('45 minutes'))).toBe(true)
  })

  it('selects the earliest incomplete task and calculates progress', () => {
    const tasks = buildFallbackPlan('Learn TypeScript')
    tasks[0].completed = true
    expect(getNextRecommendedTask(tasks)?.id).toBe(tasks[1].id)
    expect(calculateProgress(tasks)).toBe(Math.round(100 / tasks.length))
    tasks.forEach((task) => { task.completed = true })
    expect(getNextRecommendedTask(tasks)).toBeNull()
    expect(calculateProgress(tasks)).toBe(100)
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
