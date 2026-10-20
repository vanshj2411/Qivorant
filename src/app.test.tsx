import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './main'

describe('Qivorant foundation', () => {
  it('presents the core product promise and starting action', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'From intent to execution.' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create your first goal' })).toBeInTheDocument()
  })

  it('opens goal entry and generates a fallback plan', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Create your first goal' }))
    fireEvent.change(screen.getByLabelText('What do you want to accomplish?'), {
      target: { value: 'Launch my portfolio website' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Generate plan' }))

    expect(screen.getByRole('heading', { name: 'Launch my portfolio website' })).toBeInTheDocument()
    expect(screen.getByText(/Break “Launch my portfolio website” into a first concrete step/)).toBeInTheDocument()
  })
})
