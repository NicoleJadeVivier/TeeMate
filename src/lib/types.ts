export type Role = 'caddie' | 'player'
export type Tour = 'PGA' | 'Korn Ferry' | 'Americas'
export type PostType = 'caddie_seeking_player' | 'player_seeking_caddie'
export type PostStatus = 'open' | 'filled' | 'closed'

export interface Profile {
  id: string
  role: Role
  full_name: string
  bio: string | null
  location: string | null
  years_experience: number | null
  preferred_tours: Tour[]
  career_highlights: string | null
  created_at: string
}

export interface Tournament {
  id: string
  name: string
  tour: Tour
  location: string
  start_date: string
  end_date: string
}

export interface Post {
  id: string
  author_id: string
  post_type: PostType
  tournament_id: string
  details: string | null
  status: PostStatus
  created_at: string
  // Joined fields, populated client-side
  author?: Profile
  tournament?: Tournament
}

export interface Commitment {
  id: string
  user_id: string
  tournament_id: string
  created_at: string
  // Joined fields, populated client-side
  profile?: Profile
  tournament?: Tournament
}

export interface Message {
  id: string
  thread_id: string
  sender_id: string
  recipient_id: string
  content: string
  created_at: string
}
