import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { CONTACT } from '../config'

export default function Footer() {
  return (
    <footer className="foot">
      <div className="in">
        <div className="foot-grid">
          <div>
            <p className="brand">Akamata</p>
            <span>A new beginning. A practical way forward.</span>
          </div>
          <div>
            <h4>Keep growing</h4>
            <Link to="/#roadmaps">All roadmaps</Link>
            <Link to="/#how">How it works</Link>
          </div>
          <div>
            <h4>Good to know</h4>
            <Link to="/story">Our story</Link>
            <a href={CONTACT}>Suggest a roadmap <ArrowUpRight size={12} /></a>
          </div>
        </div>
        <div className="quote">
          E raka te mau rima, e raka te ta’unga<br />
          When the hands are nimble and practiced, the expert is successful.
        </div>
        <div className="legal">
          <span>© {new Date().getFullYear()} Tāmata. Made for fresh starts.</span>
          <span>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <a href={CONTACT}>Say hello <ArrowUpRight size={12} /></a>
          </span>
        </div>
      </div>
    </footer>
  )
}
