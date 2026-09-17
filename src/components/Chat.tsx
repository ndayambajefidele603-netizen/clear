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
    return `💳 **Payment Instructions for UR Processing Fee:**\n• Clearance certificate processing is **FREE** for graduating students.\n• Transcript requests cost **FRW 5,000 per copy**.\n• Payment methods: MTN MoMo Pay (\`*182*8*1*CODE#\`), BK Yacu, or Irembo Portal (\`www.irembo.gov.rw\`).\n• Make sure to upload your payment receipt under the Documents tab!`
  }

  if (lower.includes('office') || lower.includes('location') || lower.includes('where') || lower.includes('room') || lower.includes('meet')) {
    return `🏛️ **Leader Office Locations & Hours:**\n• **Class Rep (${UR_HIERARCHY[0].name}):** ${UR_HIERARCHY[0].office} (${UR_HIERARCHY[0].officeHours})\n• **Head of Dept (${UR_HIERARCHY[1].name}):** ${UR_HIERARCHY[1].office} (${UR_HIERARCHY[1].officeHours})\n• **College Principal (${UR_HIERARCHY[2].name}):** ${UR_HIERARCHY[2].office} (${UR_HIERARCHY[2].officeHours})\n• **Registrar (${UR_HIERARCHY[3].name}):** ${UR_HIERARCHY[3].office} (${UR_HIERARCHY[3].officeHours})`
  }

  if (lower.includes('status') || lower.includes('progress') || lower.includes('level') || lower.includes('track')) {
    return `📊 **Current Clearance Status for ${request?.id || 'Request'}:**\n• Current Review Level: **Level ${level} of 4** (${leaderInfo?.title} — ${leader})\n• Documents Uploaded: **${uploaded}/${total}**\n• Documents Verified: **${verified}/${total}**\n${request?.status === 'completed' ? '🎉 **Congratulations! Your clearance is fully approved. You can view/print your official certificate now.**' : 'Waiting for leader verification and electronic signature.'}`
  }

  if (lower.includes('document') || lower.includes('upload') || lower.includes('file') || lower.includes('paper') || lower.includes('slip')) {
    return `📁 **Required Documents for Clearance:**\n1. **Student ID Card** (Photo ID copy)\n2. **Fee Clearance Statement** (Zero balance proof from Bursar)\n3. **Library Clearance Slip** (Books return confirmation)\n4. **Final Year Project Report** (Approved dissertation signoff)\n5. **Hostel Clearance Form** (Vacate confirmation)\n\nUploaded: **${uploaded}/${total}** | Verified: **${verified}/${total}**`
  }

  if (lower.includes('time') || lower.includes('long') || lower.includes('day') || lower.includes('when') || lower.includes('how long')) {
    return `⏱️ **Processing Timeline:**\n• Level 1 (Class Rep): 1–2 business days\n• Level 2 (Head of Department): 2–3 business days\n• Level 3 (College Principal): 2–3 business days\n• Level 4 (Registrar): 1–2 business days\n• **Total Estimated Time:** 5 to 10 business days.`
  }

  if (lower.includes('reject') || lower.includes('fail') || lower.includes('denied') || lower.includes('problem')) {
    return `❌ **Handling Rejections:**\nIf a leader rejects your clearance or a document:\n1. Check the comment left in your **Approval Pipeline** tab.\n2. Re-upload corrected documents under the **Documents** tab.\n3. Book an office meeting or contact the leader during office hours.`
  }

  return `🤖 I am the **CLEARKY AI Assistant**. I can help you with:\n• Tracking your ${type} request progress\n• Understanding required document uploads\n• Finding leader office hours & booking appointments\n• Payment & fee guidelines\n\nHow can I help you today?`
}

export default function Chat({ request, compact, leaderName, leaderTitle }: {
  request?: StudentRequest
  compact?: boolean
  leaderName?: string
  leaderTitle?: string
}) {
  const [messages, setMessages] = useState<Array<{ text: string; from: 'user' | 'ai' }>>([
    { text: `Hello! I'm your CLEARKY AI Assistant. I can help you track your ${request?.type || 'clearance'} request, find leader office hours, and check document requirements.`, from: 'ai' },
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
              <h3 className="chat__leader-name">CLEARKY Assistant</h3>
              <p className="chat__leader-title">University of Rwanda Support · Request {request?.id}</p>
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
          placeholder="Ask AI about status, fees, office locations..."
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
