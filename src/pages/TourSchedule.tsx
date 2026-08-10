import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import type { Commitment, Tour, Tournament } from '../lib/types'

const ALL_TOURS: Tour[] = ['PGA', 'Korn Ferry', 'Americas']

export default function TourSchedule() {
  const { user } = useAuth()
  const [tour, setTour] = useState<Tour>('PGA')
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [commitmentsByTournament, setCommitmentsByTournament] = useState<
    Record<string, Commitment[]>
  >({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSchedule()
  }, [tour])

  const loadSchedule = async () => {
    setLoading(true)
    const { data: tournamentData } = await supabase
      .from('tournaments')
      .select('*')
      .eq('tour', tour)
      .order('start_date', { ascending: true })

    const loadedTournaments = (tournamentData as Tournament[]) ?? []
    setTournaments(loadedTournaments)
    await loadCommitments(loadedTournaments.map((t) => t.id))
    setLoading(false)
  }

  const loadCommitments = async (tournamentIds: string[]) => {
    if (tournamentIds.length === 0) {
      setCommitmentsByTournament({})
      return
    }

    const { data } = await supabase
      .from('commitments')
      .select('*, profile:profiles(*)')
      .in('tournament_id', tournamentIds)

    const grouped: Record<string, Commitment[]> = {}
    for (const c of (data as Commitment[] | null) ?? []) {
      grouped[c.tournament_id] = [...(grouped[c.tournament_id] ?? []), c]
    }
    setCommitmentsByTournament(grouped)
  }

  const toggleExpanded = (tournamentId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(tournamentId)) next.delete(tournamentId)
      else next.add(tournamentId)
      return next
    })
  }

  const handleToggleCommit = async (tournamentId: string, isCommitted: boolean) => {
    if (!user) return
    setPendingId(tournamentId)

    if (isCommitted) {
      await supabase
        .from('commitments')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id)
    } else {
      await supabase.from('commitments').insert({ tournament_id: tournamentId, user_id: user.id })
    }

    await loadCommitments(tournaments.map((t) => t.id))
    setPendingId(null)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tour schedule</h1>
          <p className="page-subtitle">Upcoming events by tour.</p>
        </div>
      </div>

      <div className="tab-bar">
        {ALL_TOURS.map((t) => (
          <button
            key={t}
            className={tour === t ? 'tab active' : 'tab'}
            onClick={() => setTour(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="empty-state">Loading schedule…</p>
      ) : tournaments.length === 0 ? (
        <p className="empty-state">
          No {tour} events loaded yet. Add rows to the <code>tournaments</code> table in Supabase
          to populate this schedule.
        </p>
      ) : (
        <div className="schedule-list">
          {tournaments.map((t) => {
            const commitments = commitmentsByTournament[t.id] ?? []
            const isCommitted = commitments.some((c) => c.user_id === user?.id)
            const isExpanded = expanded.has(t.id)

            return (
              <div className="schedule-row" key={t.id}>
                <div className="schedule-row-main">
                  <div>
                    <h3>{t.name}</h3>
                    <p className="post-meta">{t.location}</p>
                  </div>
                  <div className="schedule-row-actions">
                    <div className="schedule-dates">
                      {new Date(t.start_date).toLocaleDateString()} –{' '}
                      {new Date(t.end_date).toLocaleDateString()}
                    </div>
                    <button
                      className={isCommitted ? 'commit-btn committed' : 'commit-btn'}
                      disabled={pendingId === t.id}
                      onClick={() => handleToggleCommit(t.id, isCommitted)}
                    >
                      {isCommitted ? 'Committed ✓' : 'Commit'}
                    </button>
                  </div>
                </div>

                <button className="commitments-toggle" onClick={() => toggleExpanded(t.id)}>
                  {commitments.length === 0
                    ? 'No one committed yet'
                    : `${commitments.length} committed`}{' '}
                  {isExpanded ? '▲' : '▼'}
                </button>

                {isExpanded && commitments.length > 0 && (
                  <div className="committed-list">
                    {commitments.map((c) => (
                      <div className="committed-row" key={c.id}>
                        <span
                          className={
                            c.profile?.role === 'caddie' ? 'badge badge-caddie' : 'badge badge-player'
                          }
                        >
                          {c.profile?.role}
                        </span>
                        <Link to={`/profile/${c.user_id}`} className="committed-name">
                          {c.profile?.full_name ?? 'Unknown'}
                        </Link>
                        {c.user_id !== user?.id && (
                          <Link to={`/messages/${c.user_id}`} className="message-link">
                            Message
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
