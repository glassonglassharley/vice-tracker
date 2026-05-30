import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../useApi';

function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function BadgesSection() {
  const api = useApi();
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/api/badges').then(setData).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return null;

  const earned = data.badges
    .filter(b => b.earned)
    .sort((a, b) => (b.earned_at || '') > (a.earned_at || '') ? 1 : -1)
    .slice(0, 3);

  if (earned.length === 0) return null;

  const totalEarned = data.badges.filter(b => b.earned).length;
  const total = data.badges.length;

  return (
    <div className="panel recent-badges-panel">
      <div className="panel-head">
        <span className="panel-title">🏅 Recent Badges</span>
        <Link to="/badges" className="recent-badges-viewall">
          {totalEarned}/{total} unlocked →
        </Link>
      </div>
      <div className="recent-badges-row">
        {earned.map(badge => (
          <div key={badge.id} className="recent-badge-item">
            <span className="recent-badge-emoji">{badge.emoji}</span>
            <div className="recent-badge-info">
              <div className="recent-badge-name">{badge.name}</div>
              <div className="recent-badge-date">{fmtDate(badge.earned_at)}</div>
            </div>
          </div>
        ))}
        {totalEarned > 3 && (
          <Link to="/badges" className="recent-badge-more">
            +{totalEarned - 3} more
          </Link>
        )}
      </div>
    </div>
  );
}
