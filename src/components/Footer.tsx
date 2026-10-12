import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__brand-inner">
              <img src="/ur-logo.png" alt="University of Rwanda" className="footer__logo-mark" />
              <span className="footer__logo">CLEAR&TRANS</span>
            </div>
            <p className="footer__desc">
              A student-services portal preview for clearance and transcript requests.
            </p>
          </div>
          <div className="footer__col">
            <h2>Portal</h2>
            <Link to="/login">Sign in</Link>
            <Link to="/signup">Create account</Link>
            <Link to="/#features">Services</Link>
          </div>
          <div className="footer__col">
            <h2>Information</h2>
            <Link to="/#about">How it works</Link>
            <Link to="/#contact">Help &amp; access</Link>
          </div>
          <div className="footer__col footer__notice">
            <h2>Preview notice</h2>
            <p>This portal preview is not connected to official student records. The support contact in Help &amp; access is portal support, not a University department.</p>
          </div>
        </div>
        <div className="footer__bottom">
          <p>CLEAR&amp;TRANS student-services portal · {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  )
}
