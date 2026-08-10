import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import ProfileForm, { type ProfileFormValues } from '../components/ProfileForm'

export default function ProfileSetup() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (values: ProfileFormValues) => {
    if (!user) return { error: 'You need to be signed in to set up a profile.' }

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      role: values.role,
      full_name: values.fullName,
      location: values.location,
      bio: values.bio,
      years_experience: values.yearsExperience ? Number(values.yearsExperience) : null,
      preferred_tours: values.preferredTours,
      career_highlights: values.careerHighlights || null,
    })

    if (error) return { error: error.message }
    await refreshProfile()
    navigate('/')
    return { error: null }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Set up your profile</h1>
        <p className="auth-subtitle">Tell other players and caddies who you are.</p>
        <ProfileForm
          initialValues={{
            role: 'caddie',
            fullName: '',
            location: '',
            bio: '',
            yearsExperience: '',
            preferredTours: [],
            careerHighlights: '',
          }}
          onSubmit={handleSubmit}
          submitLabel="Finish setup"
          submittingLabel="Saving…"
        />
      </div>
    </div>
  )
}
