import { useState, type ChangeEvent, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import Avatar from './Avatar'
import type { Role, Tour } from '../lib/types'

const ALL_TOURS: Tour[] = ['PGA', 'Korn Ferry', 'Americas']
const MAX_AVATAR_BYTES = 5 * 1024 * 1024

export interface ProfileFormValues {
  role: Role
  fullName: string
  location: string
  bio: string
  yearsExperience: string
  preferredTours: Tour[]
  careerHighlights: string
  avatarUrl: string | null
  pgaTourPlayerUrl: string
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
  const [avatarUrl, setAvatarUrl] = useState(initialValues.avatarUrl)
  const [pgaTourPlayerUrl, setPgaTourPlayerUrl] = useState(initialValues.pgaTourPlayerUrl)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()

  const toggleTour = (tour: Tour) => {
    setPreferredTours((prev) =>
      prev.includes(tour) ? prev.filter((t) => t !== tour) : [...prev, tour]
    )
  }

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Image must be smaller than 5MB.')
      return
    }

    setAvatarError(null)
    setUploadingAvatar(true)

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file)

    if (uploadError) {
      setAvatarError(uploadError.message)
      setUploadingAvatar(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(data.publicUrl)
    setUploadingAvatar(false)
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
      avatarUrl,
      pgaTourPlayerUrl,
    })

    setSubmitting(false)
    if (error) setError(error)
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <label>
        Profile photo
        <div className="avatar-upload">
          <Avatar url={avatarUrl} name={fullName || 'Me'} size={64} />
          <div>
            <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} />
            {uploadingAvatar && <p className="form-hint">Uploading…</p>}
            {avatarError && <p className="form-error">{avatarError}</p>}
          </div>
        </div>
      </label>
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
        PGA Tour player page URL
        <input
          type="url"
          value={pgaTourPlayerUrl}
          onChange={(e) => setPgaTourPlayerUrl(e.target.value)}
          placeholder="https://www.pgatour.com/korn-ferry-tour/player/12345/your-name"
        />
        <span className="form-hint">
          If you're a competitive player, add your pgatour.com player page to sync real results.
        </span>
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
