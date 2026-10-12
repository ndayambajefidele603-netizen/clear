export default function AuthShowcase() {
  return (
    <aside className="auth-showcase" aria-label="About the student services portal">
      <div className="auth-showcase__topline">
        <span className="auth-showcase__mark" aria-hidden="true">C</span>
        <span>CLEAR&amp;TRANS</span>
        <span className="auth-showcase__preview">PORTAL PREVIEW</span>
      </div>

      <div className="auth-showcase__copy">
        <p className="auth-showcase__eyebrow">Designed around your next step</p>
        <h2>Your student services, all in one place.</h2>
        <p className="auth-showcase__description">
          Find your way through clearance and transcript requests with a focused, easy-to-follow workspace.
        </p>
      </div>

      <div className="auth-showcase__visual" aria-hidden="true">
        <div className="auth-showcase__visual-heading">
          <span>A LOOK INSIDE</span>
          <span className="auth-showcase__accent-dot" />
        </div>
        <div className="auth-showcase__journey">
          <div className="auth-showcase__journey-step">
            <span className="auth-showcase__journey-icon">01</span>
            <span><strong>Choose a service</strong><small>Clearance or transcript</small></span>
            <span className="auth-showcase__journey-arrow">↗</span>
          </div>
          <div className="auth-showcase__journey-step">
            <span className="auth-showcase__journey-icon">02</span>
            <span><strong>Share your details</strong><small>Keep your request organized</small></span>
            <span className="auth-showcase__journey-arrow">↗</span>
          </div>
          <div className="auth-showcase__journey-step">
            <span className="auth-showcase__journey-icon">03</span>
            <span><strong>Follow each step</strong><small>See the review journey</small></span>
            <span className="auth-showcase__journey-arrow">↗</span>
          </div>
        </div>
        <div className="auth-showcase__visual-foot">
          <span className="auth-showcase__foot-icon">✦</span>
          <span>An illustrative preview — not live University records.</span>
        </div>
      </div>

      <div className="auth-showcase__assurance">
        <span className="auth-showcase__assurance-icon" aria-hidden="true">i</span>
        <p><strong>Preview environment</strong><br />This portal is not connected to official University records.</p>
      </div>
    </aside>
  )
}
