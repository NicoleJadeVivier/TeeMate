import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import Avatar from '../components/Avatar'
import { fetchPlayerResults } from '../lib/scrapePlayerResults'
import type { Commitment, Profile, TournamentResult } from '../lib/types'

export default function ProfileView() {
  const { userId } = useParams<{ userId: string }>()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [results, setResults] = useState<TournamentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)

    Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase
        .from('commitments')
        .select('*, tournament:tournaments(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('tournament_results')
        .select('*')
        .eq('user_id', userId)
        .order('event_date', { ascending: false }),
    ]).then(([profileRes, commitmentsRes, resultsRes]) => {
      setProfile(profileRes.data as Profile | null)
      setCommitments((commitmentsRes.data as Commitment[]) ?? [])
      setResults((resultsRes.data as TournamentResult[]) ?? [])
      setLoading(false)
    })
  }, [userId])

  const handleSync = async () => {
    if (!profile?.pga_tour_player_url || !user) return
    setSyncing(true)
    setSyncError(null)

    try {
      const scraped = await fetchPlayerResults(profile.pga_tour_player_url)

      await supabase.from('tournament_results').delete().eq('user_id', user.id)
      const { error: insertError } = await supabase.from('tournament_results').insert(
        scraped.map((r) => ({
          user_id: user.id,
          tournament_name: r.tournamentName,
          event_date: r.eventDate,
          position: r.position,
          total_score: r.totalScore,
          to_par: r.toPar,
          earnings: r.earnings,
        }))
      )
      if (insertError) throw new Error(insertError.message)

      const { data } = await supabase
        .from('tournament_results')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false })
      setResults((data as TournamentResult[]) ?? [])
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Something went wrong syncing results.')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) return <div className="page-loading">Loading…</div>
  if (!profile) return <p className="empty-state">Profile not found.</p>

  const isSelf = user?.id === profile.id

  return (
    <div className="page">
      <div className="profile-header">
        <div className="profile-identity">
          <Avatar url={profile.avatar_url} name={profile.full_name} size={72} />
          <div>
            <span className={profile.role === 'caddie' ? 'badge badge-caddie' : 'badge badge-player'}>
              {profile.role}
            </span>
            <h1>{profile.full_name}</h1>
            {profile.location && <p className="post-meta">{profile.location}</p>}
          </div>
        </div>
        {isSelf ? (
          <Link to="/profile/edit" className="primary-btn">
            Edit profile
          </Link>
        ) : (
          <Link to={`/messages/${profile.id}`} className="primary-btn">
            Message
          </Link>
        )}
      </div>

      {profile.years_experience !== null && (
        <p className="post-meta">{profile.years_experience} years of experience</p>
      )}

      {profile.preferred_tours.length > 0 && (
        <div className="tag-list">
          {profile.preferred_tours.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      )}

      {profile.bio && <p className="post-details">{profile.bio}</p>}

      {profile.career_highlights && (
        <>
          <h3>Career highlights</h3>
          <ul className="highlight-list">
            {profile.career_highlights
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, i) => (
                <li key={i}>{line}</li>
              ))}
          </ul>
        </>
      )}

      <h3>Results</h3>
      {isSelf && (
        <div className="sync-row">
          {profile.pga_tour_player_url ? (
            <button type="button" className="commit-btn" onClick={handleSync} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync results'}
            </button>
          ) : (
            <p className="form-hint">
              Add your PGA Tour player page URL in <Link to="/profile/edit">Edit profile</Link> to
              sync real results.
            </p>
          )}
          {syncError && <p className="form-error">{syncError}</p>}
        </div>
      )}
      {results.length === 0 ? (
        <p className="empty-state">No synced results yet.</p>
      ) : (
        <div className="results-table-wrap">
          <table className="results-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Tournament</th>
                <th>Pos</th>
                <th>Score</th>
                <th>Earnings</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td>{r.event_date ? new Date(r.event_date).toLocaleDateString() : '—'}</td>
                  <td>{r.tournament_name}</td>
                  <td>{r.position ?? '—'}</td>
                  <td>
                    {r.total_score ?? '—'}
                    {r.to_par ? ` (${r.to_par})` : ''}
                  </td>
                  <td>{r.earnings ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3>Tournaments committed to</h3>
      {commitments.length === 0 ? (
        <p className="empty-state">No committed tournaments yet.</p>
      ) : (
        <div className="schedule-list">
          {commitments.map((c) => (
            <div className="schedule-row" key={c.id}>
              <div className="schedule-row-main">
                <div>
                  <h3>{c.tournament?.name}</h3>
                  <p className="post-meta">
                    {c.tournament?.tour} Tour · {c.tournament?.location}
                  </p>
                </div>
                {c.tournament?.start_date && (
                  <div className="schedule-dates">
                    {new Date(c.tournament.start_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
