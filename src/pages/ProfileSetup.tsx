import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import type { Role, Tour } from '../lib/types'

const ALL_TOURS: Tour[] = ['PGA', 'Korn Ferry', 'Americas']

export default function ProfileSetup() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState<Role>('caddie')
  const [fullName, setFullName] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [preferredTours, setPreferredTours] = useState<Tour[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const toggleTour = (tour: Tour) => {
    setPreferredTours((prev) =>
      prev.includes(tour) ? prev.filter((t) => t !== tour) : [...prev, tour]
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError(null)
    setSubmitting(true)

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      role,
      full_name: fullName,
      location,
      bio,
      years_experience: yearsExperience ? Number(yearsExperience) : null,
      preferred_tours: preferredTours,
    })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    await refreshProfile()
    navigate('/')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Set up your profile</h1>
        <p className="auth-subtitle">Tell other players and caddies who you are.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            I am a
            <div className="role-toggle">
              <button
                type="button"
                className={role === 'caddie' ? 'role-btn active' : 'role-btn'}
                onClick={() => setRole('caddie')}
              >
                Caddie
              </button>
              <button
                type="button"
                className={role === 'player' ? 'role-btn active' : 'role-btn'}
                onClick={() => setRole('player')}
              >
                Player
              </button>
            </div>
          </label>
          <label>
            Full name
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <label>
            Location
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Austin, TX"
            />
          </label>
          <label>
            Years of experience
            <input
              type="number"
              min={0}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
            />
          </label>
          <label>
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder={
                role === 'caddie'
                  ? "Loops carried, courses you know, what you're looking for..."
                  : "Your game, what you're looking for in a caddie..."
              }
            />
          </label>
          <label>
            Tours you follow
            <div className="tour-toggle">
              {ALL_TOURS.map((tour) => (
                <button
                  type="button"
                  key={tour}
                  className={preferredTours.includes(tour) ? 'role-btn active' : 'role-btn'}
                  onClick={() => toggleTour(tour)}
                >
                  {tour}
                </button>
              ))}
            </div>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Finish setup'}
          </button>
        </form>
      </div>
    </div>
  )
}
