import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import type { PostType, Tour, Tournament } from '../lib/types'

const ALL_TOURS: Tour[] = ['PGA', 'Korn Ferry', 'Americas']

export default function PostForm() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { postId } = useParams<{ postId: string }>()
  const isEditing = Boolean(postId)

  // Default the post type to match the user's role: a caddie posts
  // "seeking a player", a player posts "seeking a caddie".
  const defaultPostType: PostType =
    profile?.role === 'player' ? 'player_seeking_caddie' : 'caddie_seeking_player'

  const [postType, setPostType] = useState<PostType>(defaultPostType)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [tourFilter, setTourFilter] = useState<Tour | 'all'>('all')
  const [tournamentId, setTournamentId] = useState('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEditing)

  useEffect(() => {
    supabase
      .from('tournaments')
      .select('*')
      .order('start_date', { ascending: true })
      .then(({ data }) => setTournaments((data as Tournament[]) ?? []))
  }, [])

  useEffect(() => {
    if (!postId || !user) return

    supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()
      .then(({ data, error }) => {
        if (error || !data || data.author_id !== user.id) {
          navigate('/')
          return
        }
        setPostType(data.post_type)
        setTournamentId(data.tournament_id)
        setDetails(data.details ?? '')
        setLoading(false)
      })
  }, [postId, user, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !tournamentId) return
    setError(null)
    setSubmitting(true)

    const { error } = isEditing
      ? await supabase
          .from('posts')
          .update({ tournament_id: tournamentId, details })
          .eq('id', postId)
      : await supabase.from('posts').insert({
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

  if (loading) return <div className="page-loading">Loading…</div>

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Always keep the currently selected tournament choosable, even if it's
  // since passed or doesn't match the tour filter, so editing an existing
  // post never silently invalidates its current value.
  const selectableTournaments = tournaments.filter((t) => {
    if (t.id === tournamentId) return true
    if (new Date(t.end_date) < today) return false
    if (tourFilter !== 'all' && t.tour !== tourFilter) return false
    return true
  })

  return (
    <div className="page page-narrow">
      <h1>
        {isEditing
          ? 'Edit post'
          : postType === 'caddie_seeking_player'
            ? 'Post: looking for a player'
            : 'Post: looking for a caddie'}
      </h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Tour
          <select value={tourFilter} onChange={(e) => setTourFilter(e.target.value as Tour | 'all')}>
            <option value="all">All tours</option>
            {ALL_TOURS.map((tour) => (
              <option key={tour} value={tour}>
                {tour}
              </option>
            ))}
          </select>
        </label>
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
            {selectableTournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.tour} — {t.location}
              </option>
            ))}
          </select>
        </label>
        {selectableTournaments.length === 0 && tournaments.length === 0 && (
          <p className="form-hint">
            No tournaments loaded yet. Add some rows to the <code>tournaments</code> table in
            Supabase to get started.
          </p>
        )}
        {selectableTournaments.length === 0 && tournaments.length > 0 && (
          <p className="form-hint">No upcoming {tourFilter === 'all' ? '' : `${tourFilter} `}tournaments.</p>
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
        <div className="form-actions">
          <button type="submit" disabled={submitting || !tournamentId}>
            {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Post'}
          </button>
          {isEditing && (
            <button type="button" className="cancel-btn" onClick={() => navigate('/')}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
