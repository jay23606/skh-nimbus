import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { HoldButton } from './HoldButton'

it('completes through a single keyboard activation for switch access', async () => {
  const user = userEvent.setup()
  const onComplete = vi.fn()
  render(<HoldButton label="Hold to seal the loan" onComplete={onComplete} />)

  await user.tab()
  expect(screen.getByRole('button', { name: 'Hold to seal the loan' })).toHaveFocus()
  await user.keyboard('{Enter}')

  expect(onComplete).toHaveBeenCalledOnce()
})
