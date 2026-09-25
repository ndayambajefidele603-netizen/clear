import { type FormEvent, useState } from 'react'
import { useReveal } from '../hooks/useReveal'
import './Contact.css'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const { ref, visible } = useReveal()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section id="contact" className="contact section" ref={ref}>
      <div className="container">
        <div className="contact__header" style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.6s ease',
        }}>
          <h2 className="section-title">Get In Touch</h2>
          <p className="section-subtitle">
            Ready to digitize your institution's clearance and transcript processes?
            Let's talk.
          </p>
        </div>
        <div className="contact__inner">
          <div className="contact__info" style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : 'translateX(-30px)',
            transition: 'all 0.6s ease 0.2s',
          }}>
            <div className="contact__item">
              <span className="contact__item-icon">📧</span>
              <div>
                <strong>Email</strong>
                <p>support@clear&trans.ur.ac.rw</p>
              </div>
            </div>
            <div className="contact__item">
              <span className="contact__item-icon">📞</span>
              <div>
                <strong>Phone</strong>
                <p>+250 788 555 000</p>
              </div>
            </div>
            <div className="contact__item">
              <span className="contact__item-icon">📍</span>
              <div>
                <strong>Address</strong>
                <p>University of Rwanda<br />Kigali, Rwanda</p>
              </div>
            </div>
          </div>
          <form className="contact__form hover-glow" onSubmit={handleSubmit} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : 'translateX(30px)',
            transition: 'all 0.6s ease 0.3s',
          }}>
            {submitted ? (
              <div className="contact__success">
                <span className="contact__success-icon">✓</span>
                <h3>Message Sent!</h3>
                <p>We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <>
                <div className="contact__fields">
                  <input type="text" placeholder="Full Name" required className="contact__input" />
                  <input type="email" placeholder="Email Address" required className="contact__input" />
                </div>
                <input type="text" placeholder="Institution Name" required className="contact__input" />
                <textarea placeholder="Tell us about your needs..." rows={5} required className="contact__textarea" />
                <button type="submit" className="contact__submit">
                  Send Message →
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
