import { Link } from 'react-router-dom'
import type { Post } from '../lib/types'

export default function PostCard({ post, currentUserId }: { post: Post; currentUserId?: string }) {
  const isCaddiePost = post.post_type === 'caddie_seeking_player'
  const isOwnPost = post.author_id === currentUserId

  return (
    <div className="post-card">
      <div className="post-card-header">
        <span className={isCaddiePost ? 'badge badge-caddie' : 'badge badge-player'}>
          {isCaddiePost ? 'Caddie seeking player' : 'Player seeking caddie'}
        </span>
        <span className="post-status">{post.status}</span>
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
