import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <span className="footer__logo">◆ CLEARKY</span>
            <p className="footer__desc">
              The modern digital clearance and transcript management system for
              educational institutions worldwide.
            </p>
          </div>
          <div className="footer__col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Demo</a>
          </div>
          <div className="footer__col">
            <h4>Company</h4>
            <a href="#about">About</a>
            <a href="#">Blog</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="footer__col">
            <h4>Support</h4>
            <a href="#">Documentation</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
        <div className="footer__bottom">
          <p>&copy; {new Date().getFullYear()} CLEARKY. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
