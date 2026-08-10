import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from './Navbar'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <div className="page-loading">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/setup-profile" replace />

  return (
    <>
      <Navbar />
      <main className="app-main">{children}</main>
    </>
  )
}
