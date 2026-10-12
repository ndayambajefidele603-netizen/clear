import { useState, useRef, useEffect } from 'react'
import { UR_HIERARCHY } from '../context/AppContext'
import type { StudentRequest } from '../context/AppContext'
import './Chat.css'

const QUICK_CHIPS = [
  '📊 Clearance Status',
  '📁 Required Documents',
  '⏱️ Review Time',
  '💳 Payment Options',
  '🏛️ Office Hours & Locations',
]

function getAIResponse(input: string, request?: StudentRequest): string {
  const lower = input.toLowerCase()
  const level = request?.currentLevel || 1
  const leaderInfo = UR_HIERARCHY.find(l => l.level === level)
  const leader = leaderInfo?.name || 'the next leader'
  const uploaded = request?.docs.filter((d: { uploaded: boolean }) => d.uploaded).length || 0
  const verified = request?.docs.filter((d: { verified: boolean }) => d.verified).length || 0
  const total = request?.docs.length || 1
  const type = request?.type || 'clearance'

  if (lower.includes('pay') || lower.includes('fee') || lower.includes('frw') || lower.includes('cost') || lower.includes('irembo') || lower.includes('momo')) {
    return '💳 This preview does not confirm University fees or accept payments. Before paying, check the current amount and approved payment method with the relevant University finance or registrar office. Do not rely on payment details from this preview.'
  }

  if (lower.includes('office') || lower.includes('location') || lower.includes('where') || lower.includes('room') || lower.includes('meet')) {
    return '🏛️ Office locations and hours shown in this preview are not verified against University directories. Confirm appointments and contact details with your college or the official University website.'
  }

  if (lower.includes('status') || lower.includes('progress') || lower.includes('level') || lower.includes('track')) {
    return `📊 **Portal preview status for ${request?.id || 'Request'}:**\n• Current review stage: **Level ${level} of 4** (${leaderInfo?.title} — ${leader})\n• Files selected in this session: **${uploaded}/${total}**\n• Files marked reviewed: **${verified}/${total}**\n${request?.status === 'completed' ? 'This request is marked complete in the preview. This is not an official University decision or issued document.' : 'This progress is stored by the local portal preview and is not checked against University systems.'}`
  }

  if (lower.includes('document') || lower.includes('upload') || lower.includes('file') || lower.includes('paper') || lower.includes('slip')) {
    return `📁 The checklist shown on the ${type} request is a preview template. Confirm the current requirements with your college before submitting records. Selected files are stored only in this browser on this device.\n\nFiles selected in this session: **${uploaded}/${total}** | Marked reviewed: **${verified}/${total}**`
  }

  if (lower.includes('time') || lower.includes('long') || lower.includes('day') || lower.includes('when') || lower.includes('how long')) {
    return '⏱️ Processing times depend on the service and University office. This preview has no live service-level information; please confirm expected timing with the relevant office.'
  }

  if (lower.includes('reject') || lower.includes('fail') || lower.includes('denied') || lower.includes('problem')) {
    return '❌ Check the review comment in the request and contact your college for official guidance. This preview does not send notifications to University staff.'
  }

  return `Portal guidance can show locally saved ${type} request progress and the preview checklist. For official requirements, fees, appointments, or records, contact the relevant University office.`
}

export default function Chat({ request, compact, leaderName, leaderTitle }: {
  request?: StudentRequest
  compact?: boolean
  leaderName?: string
  leaderTitle?: string
}) {
  const [messages, setMessages] = useState<Array<{ text: string; from: 'user' | 'ai' }>>([
    { text: `Hello! I can help you navigate the portal preview and check your locally saved ${request?.type || 'clearance'} request status. I cannot access University records or confirm official requirements.`, from: 'ai' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendQuery = async (text: string) => {
    if (!text.trim()) return
    const userMsg = text.trim()
    setInput('')
    setMessages(prev => [...prev, { text: userMsg, from: 'user' }])
    setLoading(true)

    await new Promise(r => setTimeout(r, 500 + Math.random() * 500))

    const response = getAIResponse(userMsg, request)
    setMessages(prev => [...prev, { text: response, from: 'ai' }])
    setLoading(false)
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    sendQuery(input)
  }

  const currentLevel = request?.currentLevel || 1
  const leaderAtLevel = UR_HIERARCHY.find((l: { level: number }) => l.level === currentLevel)
  const displayLeader = leaderName || leaderAtLevel?.name
  const displayTitle = leaderTitle || leaderAtLevel?.title

  return (
    <div className={`chat ${compact ? 'chat--compact' : ''}`}>
      {!compact && (
        <div className="chat__header">
          <div className="chat__header-info">
            <div className="chat__avatar chat__avatar--ai">AI</div>
            <div>
              <h3 className="chat__leader-name">Portal guidance</h3>
              <p className="chat__leader-title">Preview help · Request {request?.id}</p>
            </div>
          </div>
          {displayLeader && (
            <div className="chat__leader-info">
              <small>Current reviewer: <strong>{displayLeader}</strong> ({displayTitle})</small>
            </div>
          )}
        </div>
      )}

      {/* Quick Prompt Suggestion Chips */}
      <div className="chat__chips-row" style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '8px 12px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
        {QUICK_CHIPS.map(chip => (
          <button
            key={chip}
            type="button"
            onClick={() => sendQuery(chip)}
            style={{
              padding: '4px 10px', borderRadius: '16px', background: '#ffffff', border: '1px solid #cbd5e1',
              fontSize: '0.75rem', color: '#1e293b', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '500'
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="chat__messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat__msg chat__msg--${msg.from}`}>
            {msg.from === 'ai' && <div className="chat__msg-avatar">AI</div>}
            <div className="chat__msg-bubble">
              <div className="chat__msg-text">
                {msg.text.split('\n').map((line, j) => <p key={j} style={{ margin: '2px 0' }}>{line}</p>)}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat__msg chat__msg--ai">
            <div className="chat__msg-avatar">AI</div>
            <div className="chat__msg-bubble">
              <div className="chat__typing"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="chat__input" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Ask about your request or portal steps..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="chat__input-field"
        />
        <button type="submit" className="chat__send-btn" disabled={!input.trim() || loading}>
          Send
        </button>
      </form>
    </div>
  )
}
