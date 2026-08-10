import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import type { Message, Profile } from '../lib/types'

interface ThreadSummary {
  otherUser: Profile
  lastMessage: Message
}

export default function MessagesList() {
  const { user } = useAuth()
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadThreads()
  }, [user])

  const loadThreads = async () => {
    if (!user) return
    setLoading(true)

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!messages) {
      setLoading(false)
      return
    }

    // Collapse to the most recent message per thread.
    const latestByThread = new Map<string, Message>()
    for (const m of messages as Message[]) {
      if (!latestByThread.has(m.thread_id)) latestByThread.set(m.thread_id, m)
    }

    const otherUserIds = Array.from(latestByThread.values()).map((m) =>
      m.sender_id === user.id ? m.recipient_id : m.sender_id
    )

    if (otherUserIds.length === 0) {
      setThreads([])
      setLoading(false)
      return
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', otherUserIds)

    const profileById = new Map((profiles as Profile[] | null ?? []).map((p) => [p.id, p]))

    const summaries: ThreadSummary[] = Array.from(latestByThread.values())
      .map((m) => {
        const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id
        const otherUser = profileById.get(otherId)
        return otherUser ? { otherUser, lastMessage: m } : null
      })
      .filter((t): t is ThreadSummary => t !== null)

    setThreads(summaries)
    setLoading(false)
  }

  return (
    <div className="page page-narrow">
      <h1>Messages</h1>
      {loading ? (
        <p className="empty-state">Loading conversations…</p>
      ) : threads.length === 0 ? (
        <p className="empty-state">
          No conversations yet. Message someone from a post in the feed to start one.
        </p>
      ) : (
        <div className="thread-list">
          {threads.map(({ otherUser, lastMessage }) => (
            <Link to={`/messages/${otherUser.id}`} className="thread-row" key={otherUser.id}>
              <div>
                <h3>{otherUser.full_name}</h3>
                <p className="post-meta">{lastMessage.content}</p>
              </div>
              <span className="thread-time">
                {new Date(lastMessage.created_at).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
