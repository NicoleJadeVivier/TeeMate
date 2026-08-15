import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/PostCard'
import type { Post, PostComment, Tour } from '../lib/types'

const ALL_TOURS: Tour[] = ['PGA', 'Korn Ferry', 'Americas']

export default function Feed() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [commentsByPost, setCommentsByPost] = useState<Record<string, PostComment[]>>({})
  const [loading, setLoading] = useState(true)
  const [tourFilter, setTourFilter] = useState<Tour | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'caddie_seeking_player' | 'player_seeking_caddie'>(
    'all'
  )

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:profiles(*), tournament:tournaments(*)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    const loadedPosts = (data as unknown as Post[]) ?? []
    if (!error) setPosts(loadedPosts)
    await loadComments(loadedPosts.map((p) => p.id))
    setLoading(false)
  }

  const loadComments = async (postIds: string[]) => {
    if (postIds.length === 0) {
      setCommentsByPost({})
      return
    }

    const { data } = await supabase
      .from('post_comments')
      .select('*, author:profiles(*)')
      .in('post_id', postIds)
      .order('created_at', { ascending: true })

    const grouped: Record<string, PostComment[]> = {}
    for (const c of (data as PostComment[] | null) ?? []) {
      grouped[c.post_id] = [...(grouped[c.post_id] ?? []), c]
    }
    setCommentsByPost(grouped)
  }

  const handleDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const filteredPosts = posts.filter((post) => {
    if (tourFilter !== 'all' && post.tournament?.tour !== tourFilter) return false
    if (typeFilter !== 'all' && post.post_type !== typeFilter) return false
    return true
  })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Open posts</h1>
          <p className="page-subtitle">
            {profile?.role === 'caddie'
              ? 'Players looking for a caddie'
              : profile?.role === 'player'
              ? 'Caddies looking for a player'
              : 'Browse who needs a loop filled'}
          </p>
        </div>
        <Link to="/new-post" className="primary-btn">
          + New post
        </Link>
      </div>

      <div className="filter-bar">
        <select value={tourFilter} onChange={(e) => setTourFilter(e.target.value as Tour | 'all')}>
          <option value="all">All tours</option>
          {ALL_TOURS.map((tour) => (
            <option key={tour} value={tour}>
              {tour}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
        >
          <option value="all">All post types</option>
          <option value="caddie_seeking_player">Caddies seeking players</option>
          <option value="player_seeking_caddie">Players seeking caddies</option>
        </select>
      </div>

      {loading ? (
        <p className="empty-state">Loading posts…</p>
      ) : filteredPosts.length === 0 ? (
        <p className="empty-state">No open posts match those filters yet.</p>
      ) : (
        <div className="post-grid">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              isAdmin={profile?.is_admin ?? false}
              onDeleted={handleDeleted}
              comments={commentsByPost[post.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  )
}
