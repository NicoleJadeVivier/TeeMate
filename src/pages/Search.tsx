import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import Avatar from '../components/Avatar'
import type { Profile, Role, Tour } from '../lib/types'

const ALL_TOURS: Tour[] = ['PGA', 'Korn Ferry', 'Americas']

export default function Search() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  const [tourFilter, setTourFilter] = useState<Tour | 'all'>('all')
  const [results, setResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)

    let request = supabase.from('profiles').select('*')
    if (user) request = request.neq('id', user.id)
    if (query.trim()) request = request.ilike('full_name', `%${query.trim()}%`)
    if (roleFilter !== 'all') request = request.eq('role', roleFilter)
    if (tourFilter !== 'all') request = request.contains('preferred_tours', [tourFilter])

    request.order('full_name', { ascending: true }).then(({ data }) => {
      setResults((data as Profile[]) ?? [])
      setLoading(false)
    })
  }, [query, roleFilter, tourFilter, user])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Explore</h1>
          <p className="page-subtitle">Search caddies and players to connect with directly.</p>
        </div>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name..."
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | 'all')}>
          <option value="all">All roles</option>
          <option value="caddie">Caddies</option>
          <option value="player">Players</option>
        </select>
        <select value={tourFilter} onChange={(e) => setTourFilter(e.target.value as Tour | 'all')}>
          <option value="all">All tours</option>
          {ALL_TOURS.map((tour) => (
            <option key={tour} value={tour}>
              {tour}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="empty-state">Searching…</p>
      ) : results.length === 0 ? (
        <p className="empty-state">No matching profiles found.</p>
      ) : (
        <div className="profile-result-list">
          {results.map((p) => (
            <div className="profile-result-row" key={p.id}>
              <Avatar url={p.avatar_url} name={p.full_name} size={44} />
              <div className="profile-result-info">
                <Link to={`/profile/${p.id}`} className="profile-result-name">
                  {p.full_name}
                </Link>
                <p className="post-meta">
                  {p.role === 'caddie' ? 'Caddie' : 'Player'}
                  {p.location ? ` · ${p.location}` : ''}
                  {p.years_experience !== null ? ` · ${p.years_experience} yrs experience` : ''}
                </p>
                {p.preferred_tours.length > 0 && (
                  <div className="tag-list">
                    {p.preferred_tours.map((tour) => (
                      <span key={tour} className="tag">
                        {tour}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Link to={`/messages/${p.id}`} className="primary-btn">
                Message
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
