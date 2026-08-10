import { useState, type FormEvent } from 'react'
import type { Role, Tour } from '../lib/types'

const ALL_TOURS: Tour[] = ['PGA', 'Korn Ferry', 'Americas']

export interface ProfileFormValues {
  role: Role
  fullName: string
  location: string
  bio: string
  yearsExperience: string
  preferredTours: Tour[]
  careerHighlights: string
}

interface ProfileFormProps {
  initialValues: ProfileFormValues
  onSubmit: (values: ProfileFormValues) => Promise<{ error: string | null }>
  submitLabel: string
  submittingLabel: string
}

export default function ProfileForm({
  initialValues,
  onSubmit,
  submitLabel,
  submittingLabel,
}: ProfileFormProps) {
  const [role, setRole] = useState<Role>(initialValues.role)
  const [fullName, setFullName] = useState(initialValues.fullName)
  const [location, setLocation] = useState(initialValues.location)
  const [bio, setBio] = useState(initialValues.bio)
  const [yearsExperience, setYearsExperience] = useState(initialValues.yearsExperience)
  const [preferredTours, setPreferredTours] = useState<Tour[]>(initialValues.preferredTours)
  const [careerHighlights, setCareerHighlights] = useState(initialValues.careerHighlights)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const toggleTour = (tour: Tour) => {
    setPreferredTours((prev) =>
      prev.includes(tour) ? prev.filter((t) => t !== tour) : [...prev, tour]
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await onSubmit({
      role,
      fullName,
      location,
      bio,
      yearsExperience,
      preferredTours,
      careerHighlights,
    })

    setSubmitting(false)
    if (error) setError(error)
  }

  return (
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
        Career highlights
        <textarea
          value={careerHighlights}
          onChange={(e) => setCareerHighlights(e.target.value)}
          rows={4}
          placeholder={
            'One per line, e.g.\nRunner-up, 2024 Q-School\n3 wins on the Korn Ferry Tour'
          }
        />
        <span className="form-hint">One highlight per line — each shows as its own bullet.</span>
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
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  )
}
