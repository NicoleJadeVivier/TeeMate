import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Avatar from './Avatar'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <nav className={menuOpen ? 'navbar menu-open' : 'navbar'}>
      <div className="navbar-brand">TeeMate</div>

      <button
        type="button"
        className="navbar-toggle"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        {menuOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      <div className="navbar-menu">
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Feed
          </NavLink>
          <NavLink to="/schedule" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Tour schedule
          </NavLink>
          <NavLink to="/messages" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Messages
          </NavLink>
        </div>
        <div className="navbar-user">
          {profile && (
            <Link to={`/profile/${user?.id}`} className="navbar-name">
              <Avatar url={profile.avatar_url} name={profile.full_name} size={28} />
              {profile.full_name}
            </Link>
          )}
          <button className="ghost-btn" onClick={signOut}>
            Log out
          </button>
        </div>
      </div>
    </nav>
  )
}
