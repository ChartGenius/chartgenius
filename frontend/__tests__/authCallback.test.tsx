import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

const replaceMock = jest.fn()
const persistStoredAuthMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}))

jest.mock('../app/utils/storageKeys', () => ({
  persistStoredAuth: (...args: unknown[]) => persistStoredAuthMock(...args),
}))

import AuthCallbackPage from '../app/auth/callback/page'

describe('Auth callback UX', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    replaceMock.mockReset()
    persistStoredAuthMock.mockReset()
    window.history.replaceState({}, '', '/auth/callback')
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('shows recovery-specific next steps when a reset link is missing callback tokens', async () => {
    window.history.replaceState({}, '', '/auth/callback?type=recovery')

    render(<AuthCallbackPage />)

    await waitFor(() => expect(screen.getByText(/Reset Link Expired/i)).toBeInTheDocument())
    expect(screen.getByText(/Request a fresh password reset from the sign-in screen/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to sign in/i })).toHaveAttribute('href', '/#signin')
    expect(persistStoredAuthMock).not.toHaveBeenCalled()
  })

  it('stores tokens and redirects after a valid signup callback', async () => {
    window.history.replaceState({}, '', '/auth/callback#access_token=token-123&refresh_token=refresh-456&type=signup')

    render(<AuthCallbackPage />)

    await waitFor(() => expect(screen.getByRole('heading', { name: /Email Verified/i })).toBeInTheDocument())
    expect(persistStoredAuthMock).toHaveBeenCalledWith('token-123', undefined, 'refresh-456')

    jest.advanceTimersByTime(1200)
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/?verified=1'))
  })
})
