import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Avatar from './Avatar'
import type { Post, PostComment } from '../lib/types'

export default function PostCard({
  post,
  currentUserId,
  onDeleted,
  comments,
}: {
  post: Post
  currentUserId?: string
  onDeleted?: (postId: string) => void
  comments: PostComment[]
}) {
  const isOwnPost = post.author_id === currentUserId
  const defaultTitle =
    post.post_type === 'caddie_seeking_player' ? 'Looking for a player' : 'Looking for a caddie'

  const [commentList, setCommentList] = useState(comments)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm("Delete this post? This can't be undone.")) return
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (!error) onDeleted?.(post.id)
  }

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !draft.trim()) return
    setPosting(true)

    const { error } = await supabase
      .from('post_comments')
      .insert({ post_id: post.id, author_id: currentUserId, content: draft.trim() })

    if (!error) {
      setDraft('')
      const { data } = await supabase
        .from('post_comments')
        .select('*, author:profiles(*)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })
      setCommentList((data as PostComment[]) ?? [])
    }
    setPosting(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from('post_comments').delete().eq('id', commentId)
    if (!error) setCommentList((prev) => prev.filter((c) => c.id !== commentId))
  }

  return (
    <div className="post-card">
      <div className="post-card-header">
        <h3 className="post-card-title">{post.title || defaultTitle}</h3>
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

      <p className="post-meta">
        {post.tournament?.name ?? 'Tournament'} · {post.tournament?.tour} Tour ·{' '}
        {post.tournament?.location}
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

      <button type="button" className="comments-toggle" onClick={() => setCommentsOpen((v) => !v)}>
        {commentList.length === 0
          ? 'Add a comment'
          : `${commentList.length} comment${commentList.length === 1 ? '' : 's'}`}{' '}
        {commentsOpen ? '▲' : '▼'}
      </button>

      {commentsOpen && (
        <div className="comment-list">
          {commentList.map((c) => (
            <div className="comment-row" key={c.id}>
              <Avatar url={c.author?.avatar_url} name={c.author?.full_name ?? 'Unknown'} size={28} />
              <div className="comment-body">
                <div className="comment-header">
                  <Link to={`/profile/${c.author_id}`} className="comment-author">
                    {c.author?.full_name ?? 'Unknown'}
                  </Link>
                  {c.author_id === currentUserId && (
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleDeleteComment(c.id)}
                      aria-label="Delete comment"
                      title="Delete comment"
                    >
                      <svg
                        width="14"
                        height="14"
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
                  )}
                </div>
                <p className="comment-text">{c.content}</p>
              </div>
            </div>
          ))}
          {currentUserId && (
            <form className="message-composer" onSubmit={handleAddComment}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a comment…"
              />
              <button type="submit" disabled={!draft.trim() || posting}>
                Post
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
