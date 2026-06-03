import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import UpdatesPage from '@/app/updates/page'

describe('/updates page', () => {
  it('renders the latest patch note and recent release archive', () => {
    render(<UpdatesPage />)

    expect(
      screen.getByRole('heading', {
        name: /recent shipped work, without leaving the product\./i,
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /storage-aware voice pipeline, bounded angel voice previews, and live weather context/i
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/0\.1\.0-alpha\.25/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /moderation v3 critical-only enforcement, review timeline, and redacted analytics/i
      )
    ).toBeInTheDocument()
  })
})
