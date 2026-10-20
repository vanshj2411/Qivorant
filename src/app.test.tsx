import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

function TestShell() {
  return (
    <main>
      <h1>From intent to execution.</h1>
      <button>Create your first goal</button>
    </main>
  )
}

describe('Qivorant foundation', () => {
  it('presents the core product promise and starting action', () => {
    render(<TestShell />)

    expect(screen.getByRole('heading', { name: 'From intent to execution.' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create your first goal' })).toBeInTheDocument()
  })
})
