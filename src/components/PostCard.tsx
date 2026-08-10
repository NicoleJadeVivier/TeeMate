import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import type { Post } from '../lib/types'

export default function PostCard({
  post,
  currentUserId,
  onDeleted,
}: {
  post: Post
  currentUserId?: string
  onDeleted?: (postId: string) => void
}) {
  const isCaddiePost = post.post_type === 'caddie_seeking_player'
  const isOwnPost = post.author_id === currentUserId

  const handleDelete = async () => {
    if (!window.confirm("Delete this post? This can't be undone.")) return
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (!error) onDeleted?.(post.id)
  }

  return (
    <div className="post-card">
      <div className="post-card-header">
        <span className={isCaddiePost ? 'badge badge-caddie' : 'badge badge-player'}>
          {isCaddiePost ? 'Caddie seeking player' : 'Player seeking caddie'}
        </span>
        <div className="post-card-header-right">
          <span className="post-status">{post.status}</span>
          {isOwnPost && (
            <>
              <Link
                to={`/posts/${post.id}/edit`}
                className="icon-btn"
                aria-label="Edit post"
                title="Edit post"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </Link>
              <button
                type="button"
                className="icon-btn"
                onClick={handleDelete}
                aria-label="Delete post"
                title="Delete post"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      <h3>{post.tournament?.name ?? 'Tournament'}</h3>
      <p className="post-meta">
        {post.tournament?.tour} Tour · {post.tournament?.location}
        {post.tournament?.start_date && (
          <> · {new Date(post.tournament.start_date).toLocaleDateString()}</>
        )}
      </p>

      {post.details && <p className="post-details">{post.details}</p>}

      <div className="post-card-footer">
        <span className="post-author">
          Posted by{' '}
          {post.author ? (
            <Link to={`/profile/${post.author_id}`} className="message-link">
              {post.author.full_name}
            </Link>
          ) : (
            'Unknown'
          )}
          {post.author?.location ? ` · ${post.author.location}` : ''}
        </span>
        {!isOwnPost && (
          <Link to={`/messages/${post.author_id}`} className="message-link">
            Message
          </Link>
        )}
      </div>
    </div>
  )
}
