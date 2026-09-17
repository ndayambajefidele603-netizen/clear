import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import './Notifications.css'

export default function Notifications() {
  const { notifications, dismissNotification } = useApp()
  const [showToast, setShowToast] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [latest, setLatest] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (notifications.length > 0) {
      const last = notifications[0]
      setLatest(last.id)
      setShowToast(true)
      const timer = setTimeout(() => setShowToast(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [notifications])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <>
      <div className={`notif-toast ${showToast && latest ? 'notif-toast--visible' : ''}`}>
        {notifications.slice(0, 1).map(n => (
          <div key={n.id} className="notif-toast__inner">
            <span>{n.details}</span>
            <button onClick={() => { dismissNotification(n.id); setShowToast(false) }}>✕</button>
          </div>
        ))}
      </div>

      <div className="notif-bell" ref={ref}>
        <button className="notif-bell__btn" onClick={() => setShowDropdown(!showDropdown)}>
          🔔
          {notifications.length > 0 && <span className="notif-bell__count">{notifications.length}</span>}
        </button>

        {showDropdown && notifications.length > 0 && (
          <div className="notif-dropdown">
            <div className="notif-dropdown__header">
              <strong>Notifications</strong>
              <span>{notifications.length} total</span>
            </div>
            <div className="notif-dropdown__list">
              {notifications.map(n => (
                <div key={n.id} className="notif-dropdown__item">
                  <p>{n.details}</p>
                  <span className="notif-dropdown__meta">{n.actor} · {n.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
