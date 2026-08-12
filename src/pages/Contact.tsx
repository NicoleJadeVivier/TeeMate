import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await supabase
      .from('contact_messages')
      .insert({ name, email, message })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Contact</h1>
        {sent ? (
          <>
            <p className="auth-subtitle">Thanks — your message has been sent. I'll get back to you soon.</p>
            <p className="auth-switch">
              <Link to="/">Back to TeeMate</Link>
            </p>
          </>
        ) : (
          <>
            <p className="auth-subtitle">Questions, feedback, or something not working? Send a message.</p>
            <form onSubmit={handleSubmit} className="auth-form">
              <label>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label>
                Message
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send message'}
              </button>
            </form>
            <p className="auth-switch">
              <Link to="/">Back to TeeMate</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
