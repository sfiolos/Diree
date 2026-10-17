export type NavTab = 'add' | 'list'

interface NavbarProps {
  tab: NavTab
  onChange: (tab: NavTab) => void
}

function Navbar({ tab, onChange }: NavbarProps) {
  return (
    <nav className="navbar navbar-expand bg-white border-bottom app-navbar">
      <div className="container-fluid px-3 px-md-4">
        <span className="navbar-brand app-brand mb-0">Diree</span>
        <ul className="navbar-nav d-flex flex-row align-items-center gap-1">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link btn btn-link ${tab === 'add' ? 'active' : ''}`}
              onClick={() => onChange('add')}
            >
              Aggiungi una partita
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link btn btn-link ${tab === 'list' ? 'active' : ''}`}
              onClick={() => onChange('list')}
            >
              Le mie partite
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar