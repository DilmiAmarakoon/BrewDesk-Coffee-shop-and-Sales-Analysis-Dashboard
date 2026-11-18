import { useEffect, useState } from 'react'

export default function StaffGate({ children }) {
  const [signedIn, setSignedIn] = useState(false)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function checkSession() {
      try {
        const response = await fetch('/api/staff/session', {
          signal: controller.signal,
          cache: 'no-store',
        })

        if (!response.ok) throw new Error('Could not check your staff session.')
        const result = await response.json()
        if (!controller.signal.aborted) setSignedIn(result.signedIn === true)
      } catch {
        if (!controller.signal.aborted) {
          setError('Could not check your session. Make sure Express is running.')
        }
      } finally {
        if (!controller.signal.aborted) setChecking(false)
      }
    }

    checkSession()
    return () => controller.abort()
  }, [])

  async function signIn(event) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    setBusy(true)
    setError('')

    try {
      const response = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: fields.get('username'),
          password: fields.get('password'),
        }),
      })

      const result = await response.json().catch(() => null)
      if (!response.ok || result?.signedIn !== true) {
        throw new Error(result?.error ?? 'Could not sign in.')
      }

      setSignedIn(true)
    } catch (error) {
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    setBusy(true)
    setError('')

    try {
      const response = await fetch('/api/staff/logout', { method: 'POST' })
      if (!response.ok) throw new Error('Could not sign out.')
      setSignedIn(false)
    } catch (error) {
      setError(error.message)
    } finally {
      setBusy(false)
    }
  }

  if (checking) return <p role="status">Checking staff session…</p>

  if (signedIn) {
    return (
      <>
        <button className="add-drink" type="button" disabled={busy} onClick={signOut}>
          Sign out
        </button>
        {error && <p role="alert">{error}</p>}
        {children}
      </>
    )
  }

  return (
    <section className="bag-section">
      <h2>Staff sign-in</h2>

      <form onSubmit={signIn}>
        <div className="pickup-field">
          <label htmlFor="staff-username">Username</label>
          <input id="staff-username" name="username" autoComplete="username" required />
        </div>

        <div className="pickup-field">
          <label htmlFor="staff-password">Password</label>
          <input
            id="staff-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <button className="primary-button place-order" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  )
}