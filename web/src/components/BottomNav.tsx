import { NavLink } from 'react-router-dom'

const tabs = [
  {
    to: '/home', label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    ),
  },
  {
    to: '/roadmap', label: 'Roadmap',
    icon: (
      <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    ),
  },
  {
    to: '/progress', label: 'Progress',
    icon: (
      <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    ),
  },
  {
    to: '/decision', label: 'Ask AI',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    ),
  },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          {t.icon}
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
