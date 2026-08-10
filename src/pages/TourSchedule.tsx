import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Tour, Tournament } from '../lib/types'

const ALL_TOURS: Tour[] = ['PGA', 'Korn Ferry', 'Americas']

export default function TourSchedule() {
  const [tour, setTour] = useState<Tour>('PGA')
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('tournaments')
      .select('*')
      .eq('tour', tour)
      .order('start_date', { ascending: true })
      .then(({ data }) => {
        setTournaments((data as Tournament[]) ?? [])
        setLoading(false)
      })
  }, [tour])

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
          {tournaments.map((t) => (
            <div className="schedule-row" key={t.id}>
              <div>
                <h3>{t.name}</h3>
                <p className="post-meta">{t.location}</p>
              </div>
              <div className="schedule-dates">
                {new Date(t.start_date).toLocaleDateString()} –{' '}
                {new Date(t.end_date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
