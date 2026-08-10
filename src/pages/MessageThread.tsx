import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import type { Message, Profile } from '../lib/types'

// Deterministic thread id: smaller uuid first so both participants
// always compute the same thread_id for a given pair of users.
function getThreadId(a: string, b: string) {
  return [a, b].sort().join('__')
}

export default function MessageThread() {
  const { userId: otherUserId } = useParams<{ userId: string }>()
  const { user } = useAuth()
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const threadId = user && otherUserId ? getThreadId(user.id, otherUserId) : null

  useEffect(() => {
    if (!otherUserId) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', otherUserId)
      .single()
      .then(({ data }) => setOtherUser(data as Profile | null))
  }, [otherUserId])

  useEffect(() => {
    if (!threadId) return

    supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages((data as Message[]) ?? []))

    // Subscribe to new messages in this thread in real time.
    const channel = supabase
      .channel(`messages:${threadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [threadId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !otherUserId || !threadId || !draft.trim()) return

    const content = draft.trim()
    setDraft('')

    await supabase.from('messages').insert({
      thread_id: threadId,
      sender_id: user.id,
      recipient_id: otherUserId,
      content,
    })
  }

  return (
    <div className="page page-narrow thread-page">
      <Link to="/messages" className="back-link">
        ← Inbox
      </Link>
      {otherUserId ? (
        <Link to={`/profile/${otherUserId}`} className="thread-title-link">
          <h1>{otherUser?.full_name ?? 'Conversation'}</h1>
        </Link>
      ) : (
        <h1>{otherUser?.full_name ?? 'Conversation'}</h1>
      )}

      <div className="message-list">
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.sender_id === user?.id ? 'message-bubble mine' : 'message-bubble'}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="message-composer">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
        />
        <button type="submit" disabled={!draft.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
