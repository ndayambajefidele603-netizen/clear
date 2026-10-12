import { Link } from 'react-router-dom'
import './Contact.css'

const supportRoutes = [
  {
    label: 'FOR STUDENTS',
    title: 'Request a service',
    description: 'Sign in to start or continue a clearance or transcript request.',
    link: '/login',
    linkText: 'Student sign in',
  },
  {
    label: 'FOR REVIEWERS',
    title: 'Preview review workspace',
    description: 'Explore the local reviewer interface. Staff access is not connected to University identity systems.',
    link: '/login',
    linkText: 'Staff sign in',
  },
  {
    label: 'PORTAL SUPPORT',
    title: 'Contact the support team',
    description: 'For help using this portal preview, contact the support contact supplied by the portal owner. This is not an official University department contact.',
    phone: '+250 786 817 364',
    email: 'ndayambajefidele603@gmail.com',
  },
]

export default function Contact() {
  return (
    <section id="contact" className="contact section" aria-labelledby="contact-title">
      <div className="container">
        <div className="contact__header">
          <span className="contact__eyebrow">HELP &amp; ACCESS</span>
          <h2 id="contact-title" className="section-title">How can we help?</h2>
          <p className="section-subtitle">
            Choose the right entry point for your role. For official University policies
            or document requirements, follow guidance from your institution.
          </p>
        </div>
        <div className="contact__inner">
          {supportRoutes.map(item => (
            <article className="contact__card" key={item.label}>
              <span className="contact__card-label">{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {item.phone && item.email && (
                <div className="contact__support-links" aria-label="Portal support contact details">
                  <a className="contact__card-link" href={`tel:${item.phone.replace(/\s/g, '')}`}>Call {item.phone}</a>
                  <a className="contact__card-link" href={`mailto:${item.email}`}>Email {item.email}</a>
                </div>
              )}
              {item.link && item.linkText && (
                <Link to={item.link} className="contact__card-link">
                  {item.linkText} <span aria-hidden="true">→</span>
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
