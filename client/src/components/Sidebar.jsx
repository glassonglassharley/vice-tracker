import { NavLink } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import Logo from './Logo';

const NAV = [
  { to: '/',         label: 'Dashboard', icon: '⌂', end: true },
  { to: '/log',      label: 'Log Today', icon: '+' },
  { to: '/savings',  label: 'Savings',   icon: '◈' },
  { to: '/vices',    label: 'Vices',     icon: '◎' },
  { to: '/partners', label: 'Partners',  icon: '⊕' },
  { to: '/support',  label: 'FAQ',       icon: '?' },
];

const s = {
  aside: {
    width: 220,
    flexShrink: 0,
    height: '100vh',
    position: 'sticky',
    top: 0,
    display: 'flex',
    flexDirection: 'column',
    background: '#040c06',
    borderRight: '1px solid rgba(212,175,55,0.18)',
  },
  top: {
    padding: '20px 16px 12px',
    borderBottom: '1px solid rgba(212,175,55,0.10)',
  },
  nav: {
    flex: 1,
    padding: '8px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    overflowY: 'auto',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: 'rgba(240,247,236,0.5)',
    textDecoration: 'none',
    transition: 'color 0.12s, background 0.12s',
  },
  linkActive: {
    color: '#d4af37',
    background: 'rgba(212,175,55,0.10)',
  },
  icon: {
    width: 20,
    textAlign: 'center',
    fontSize: 15,
    opacity: 0.7,
    flexShrink: 0,
  },
  bottom: {
    padding: '12px 16px 16px',
    borderTop: '1px solid rgba(212,175,55,0.10)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  tagline: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'rgba(90,138,106,0.7)',
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  signOutBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(240,247,236,0.35)',
    fontSize: 12,
    cursor: 'pointer',
    padding: '4px 0',
    textAlign: 'left',
    transition: 'color 0.12s',
  },
};

export default function Sidebar({ onSignOut }) {
  const linkStyle = ({ isActive }) => ({
    ...s.link,
    ...(isActive ? s.linkActive : {}),
  });

  return (
    <aside style={s.aside}>
      <div style={s.top}>
        <Logo size={32} variant="full" />
      </div>

      <nav style={s.nav}>
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end} style={linkStyle}>
            <span style={s.icon}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={s.bottom}>
        <div style={s.tagline}>Cut Today. Grow Tomorrow.</div>
        <div style={s.userRow}>
          <UserButton afterSignOutUrl="/" />
          {onSignOut && (
            <button style={s.signOutBtn} onClick={onSignOut} type="button">
              Sign out
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
