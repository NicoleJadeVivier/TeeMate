import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import type { Commitment, Profile } from '../lib/types'

export default function ProfileView() {
  const { userId } = useParams<{ userId: string }>()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [loading, setLoading] = useState(true)

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
    ]).then(([profileRes, commitmentsRes]) => {
      setProfile(profileRes.data as Profile | null)
      setCommitments((commitmentsRes.data as Commitment[]) ?? [])
      setLoading(false)
    })
  }, [userId])

  if (loading) return <div className="page-loading">Loading…</div>
  if (!profile) return <p className="empty-state">Profile not found.</p>

  const isSelf = user?.id === profile.id

  return (
    <div className="page page-narrow">
      <div className="profile-header">
        <div>
          <span className={profile.role === 'caddie' ? 'badge badge-caddie' : 'badge badge-player'}>
            {profile.role}
          </span>
          <h1>{profile.full_name}</h1>
          {profile.location && <p className="post-meta">{profile.location}</p>}
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

      <h3>Tournament history</h3>
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
