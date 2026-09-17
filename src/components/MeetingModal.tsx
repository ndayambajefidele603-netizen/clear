import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { LeaderRecord, StudentRecord } from '../context/AppContext'
import './MeetingModal.css'

interface MeetingModalProps {
  leader: LeaderRecord
  student: StudentRecord
  onClose: () => void
}

export default function MeetingModal({ leader, student, onClose }: MeetingModalProps) {
  const { meetingSlots, bookMeeting } = useApp()
  const [selectedSlotId, setSelectedSlotId] = useState<string>('')
  const [reason, setReason] = useState('Clearance Document Sign-off')
  const [success, setSuccess] = useState(false)

  // Slots available for this leader
  const availableSlots = meetingSlots.filter(s => s.leaderId === leader.id && s.available)

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlotId || !reason.trim()) return
    bookMeeting(selectedSlotId, student.id, reason.trim())
    setSuccess(true)
  }

  const selectedSlot = meetingSlots.find(s => s.id === selectedSlotId)

  return (
    <div className="meet-modal__backdrop" onClick={onClose}>
      <div className="meet-modal__dialog" onClick={e => e.stopPropagation()}>
        <div className="meet-modal__header">
          <div>
            <h3 className="meet-modal__title">Book Office Hours Meeting</h3>
            <p className="meet-modal__sub">Schedule an appointment with <strong>{leader.name}</strong></p>
          </div>
          <button className="meet-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="meet-modal__leader-card">
          <div className="meet-modal__avatar">{leader.avatar}</div>
          <div className="meet-modal__leader-info">
            <strong>{leader.name}</strong>
            <span className="meet-modal__leader-title">{leader.title} — Level {leader.level}</span>
            <div className="meet-modal__leader-meta">
              <span>🏛️ {leader.office}</span>
              <span>🕐 {leader.officeHours}</span>
            </div>
          </div>
        </div>

        {success ? (
          <div className="meet-modal__success">
            <div className="meet-modal__success-icon">✓</div>
            <h4>Appointment Confirmed!</h4>
            <p>
              Your meeting with <strong>{leader.name}</strong> has been scheduled for:
            </p>
            <div className="meet-modal__ticket">
              <span className="meet-modal__ticket-date">📅 {selectedSlot?.date} at {selectedSlot?.time}</span>
              <span className="meet-modal__ticket-loc">📍 Location: {leader.office}</span>
              <span className="meet-modal__ticket-reason">Reason: {reason}</span>
            </div>
            <p className="meet-modal__note">Please arrive 5 minutes early with your student ID card.</p>
            <button className="meet-modal__btn" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="meet-modal__form" onSubmit={handleBook}>
            <div className="meet-modal__field">
              <label>Select Date & Time Slot ({availableSlots.length} Available)</label>
              {availableSlots.length === 0 ? (
                <div className="meet-modal__empty-slots">
                  No open slots found. Please contact the leader office directly during office hours ({leader.officeHours}).
                </div>
              ) : (
                <div className="meet-modal__slots-grid">
                  {availableSlots.slice(0, 12).map(slot => (
                    <button
                      key={slot.id}
                      type="button"
                      className={`meet-modal__slot-btn ${selectedSlotId === slot.id ? 'meet-modal__slot-btn--active' : ''}`}
                      onClick={() => setSelectedSlotId(slot.id)}
                    >
                      <span className="meet-modal__slot-date">{slot.date}</span>
                      <span className="meet-modal__slot-time">{slot.time}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="meet-modal__field">
              <label>Purpose of Meeting</label>
              <select className="meet-modal__select" value={reason} onChange={e => setReason(e.target.value)}>
                <option>Clearance Document Sign-off</option>
                <option>Library Slip Clarification</option>
                <option>Finance & Tuition Fee Verification</option>
                <option>Project Report Review</option>
                <option>General Clearance Inquiry</option>
              </select>
            </div>

            <div className="meet-modal__actions">
              <button type="button" className="meet-modal__btn meet-modal__btn--cancel" onClick={onClose}>Cancel</button>
              <button
                type="submit"
                className="meet-modal__btn meet-modal__btn--submit"
                disabled={!selectedSlotId}
              >
                Confirm Appointment →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
