import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import type { PostType, Tournament } from '../lib/types'

export default function NewPost() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  // Default the post type to match the user's role: a caddie posts
  // "seeking a player", a player posts "seeking a caddie".
  const defaultPostType: PostType =
    profile?.role === 'player' ? 'player_seeking_caddie' : 'caddie_seeking_player'

  const [postType] = useState<PostType>(defaultPostType)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [tournamentId, setTournamentId] = useState('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase
      .from('tournaments')
      .select('*')
      .order('start_date', { ascending: true })
      .then(({ data }) => setTournaments((data as Tournament[]) ?? []))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !tournamentId) return
    setError(null)
    setSubmitting(true)

    const { error } = await supabase.from('posts').insert({
      author_id: user.id,
      post_type: postType,
      tournament_id: tournamentId,
      details,
    })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="page page-narrow">
      <h1>{postType === 'caddie_seeking_player' ? 'Post: looking for a player' : 'Post: looking for a caddie'}</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Tournament
          <select
            value={tournamentId}
            onChange={(e) => setTournamentId(e.target.value)}
            required
          >
            <option value="" disabled>
              Select a tournament
            </option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.tour} — {t.location}
              </option>
            ))}
          </select>
        </label>
        {tournaments.length === 0 && (
          <p className="form-hint">
            No tournaments loaded yet. Add some rows to the <code>tournaments</code> table in
            Supabase to get started.
          </p>
        )}
        <label>
          Details
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            placeholder="Anything relevant: rate, experience needed, availability, course knowledge..."
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={submitting || !tournamentId}>
          {submitting ? 'Posting…' : 'Post'}
        </button>
      </form>
    </div>
  )
}
