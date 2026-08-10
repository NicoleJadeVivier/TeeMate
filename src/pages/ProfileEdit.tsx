import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import ProfileForm, { type ProfileFormValues } from '../components/ProfileForm'

export default function ProfileEdit() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  if (!user || !profile) return <div className="page-loading">Loading…</div>

  const handleSubmit = async (values: ProfileFormValues) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        role: values.role,
        full_name: values.fullName,
        location: values.location,
        bio: values.bio,
        years_experience: values.yearsExperience ? Number(values.yearsExperience) : null,
        preferred_tours: values.preferredTours,
        career_highlights: values.careerHighlights || null,
        avatar_url: values.avatarUrl,
        pga_tour_player_url: values.pgaTourPlayerUrl || null,
      })
      .eq('id', user.id)

    if (error) return { error: error.message }
    await refreshProfile()
    navigate(`/profile/${user.id}`)
    return { error: null }
  }

  return (
    <div className="page page-narrow">
      <h1>Edit your profile</h1>
      <div className="auth-card">
        <ProfileForm
          initialValues={{
            role: profile.role,
            fullName: profile.full_name,
            location: profile.location ?? '',
            bio: profile.bio ?? '',
            yearsExperience: profile.years_experience?.toString() ?? '',
            preferredTours: profile.preferred_tours,
            careerHighlights: profile.career_highlights ?? '',
            avatarUrl: profile.avatar_url,
            pgaTourPlayerUrl: profile.pga_tour_player_url ?? '',
          }}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
          submittingLabel="Saving…"
          onCancel={() => navigate(`/profile/${user.id}`)}
        />
      </div>
    </div>
  )
}
