import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { FocusOnNavigation } from './FocusOnNavigation'

describe('screen navigation focus', () => {
  it('moves focus to the main heading after the route changes', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/idle']}>
        <FocusOnNavigation />
        <Routes>
          <Route path="/idle" element={<main><h1>Idle</h1><Link to="/sign-in">Start</Link></main>} />
          <Route path="/sign-in" element={<main><h1>Sign in</h1></main>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('link', { name: 'Start' }))

    expect(screen.getByRole('heading', { name: 'Sign in' })).toHaveFocus()
  })
})
