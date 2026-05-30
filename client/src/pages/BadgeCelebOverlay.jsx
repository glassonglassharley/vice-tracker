import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Confetti() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const COLORS = ['#0F6E56', '#5ec48a', '#ffd700', '#ff9f43', '#74c0fc', '#ffffff'];
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height * 0.6,
      vx: (Math.random() - 0.5) * 7,
      vy: Math.random() * 5 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: Math.random() * 12 + 4,
      h: Math.random() * 7 + 3,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.25,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.13; p.angle += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

export function BadgeCelebOverlay({ badges, onDismiss }) {
  return (
    <div className="celeb-overlay" onClick={onDismiss}>
      <Confetti />
      <div className="celeb-card badge-celeb-card" onClick={e => e.stopPropagation()}>
        <div className="badge-celeb-emojis">
          {badges.map(b => <span key={b.id}>{b.emoji}</span>)}
        </div>
        <div className="celeb-kicker">Badge{badges.length > 1 ? 's' : ''} unlocked!</div>
        {badges.map(b => (
          <div key={b.id} className="badge-celeb-name">{b.name}</div>
        ))}
        <div className="celeb-actions">
          <Link to="/badges" className="btn" onClick={onDismiss}>View badges</Link>
          <button className="btn ghost" onClick={onDismiss}>Keep logging</button>
        </div>
      </div>
    </div>
  );
}
