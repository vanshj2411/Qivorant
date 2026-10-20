import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './main'

describe('Qivorant foundation', () => {
  beforeEach(() => localStorage.clear())

  it('presents the core product promise and starting action', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'From intent to execution.' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create your first goal' })).toBeInTheDocument()
  })

  it('opens goal entry and generates a fallback plan', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Create your first goal' }))
    fireEvent.change(screen.getByLabelText('What do you want to accomplish?'), {
      target: { value: 'Launch my portfolio website' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Generate plan' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Launch my portfolio website' })).toBeInTheDocument())
    expect(screen.getByText('Build the core user flow')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Next recommended step' })).toHaveTextContent('Define the scope for Launch my portfolio website')
  })

  it('marks a task complete and updates progress', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Create your first goal' }))
    fireEvent.change(screen.getByLabelText('What do you want to accomplish?'), { target: { value: 'Study math' } })
    fireEvent.click(screen.getByRole('button', { name: 'Generate plan' }))

    await waitFor(() => expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0))
    fireEvent.click(screen.getAllByRole('checkbox')[0])

    expect(screen.getByLabelText('Plan progress')).toHaveTextContent('1 of 6 tasks complete')
    expect(screen.getByText('17%')).toBeInTheDocument()
  })

  it('updates the recommended step after completing the current task', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Create your first goal' }))
    fireEvent.change(screen.getByLabelText('What do you want to accomplish?'), { target: { value: 'Build a portfolio website' } })
    fireEvent.click(screen.getByRole('button', { name: 'Generate plan' }))

    const nextStep = screen.getByRole('region', { name: 'Next recommended step' })
    expect(nextStep).toHaveTextContent('Define the scope for Build a portfolio website')
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    expect(nextStep).toHaveTextContent('Choose the stack and create the project skeleton')
  })

  it('edits and deletes tasks', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Create your first goal' }))
    fireEvent.change(screen.getByLabelText('What do you want to accomplish?'), { target: { value: 'Plan a trip' } })
    fireEvent.click(screen.getByRole('button', { name: 'Generate plan' }))

    await waitFor(() => expect(screen.getByRole('button', { name: /Edit Define the outcome for Plan a trip/ })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Edit Define the outcome for Plan a trip/ }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Task title' }), { target: { value: 'Choose a destination' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getAllByText('Choose a destination').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /Delete Choose a destination/ }))
    expect(screen.queryByText('Choose a destination')).not.toBeInTheDocument()
  })

  it('restores the plan from localStorage', () => {
    localStorage.setItem('qivorant-active-plan', JSON.stringify({
      goal: 'Saved goal',
      tasks: [{ id: 1, title: 'Saved task', priority: 'High', completed: true }],
    }))

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Saved goal' })).toBeInTheDocument()
    expect(screen.getByLabelText('Plan progress')).toHaveTextContent('1 of 1 tasks complete')
  })
})
