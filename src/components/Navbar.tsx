import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-brand">TeeMate</div>
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
            {profile.full_name}
          </Link>
        )}
        <button className="ghost-btn" onClick={signOut}>
          Log out
        </button>
      </div>
    </nav>
  )
}
