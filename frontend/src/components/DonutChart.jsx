import { useEffect, useState } from 'react';

/**
 * Two-slice SVG donut with an animated sweep.
 * `slices` is [{ name, value (percent), color }].
 */
export default function DonutChart({ slices = [], size = 216, thickness = 26 }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setProgress(1));
    return () => cancelAnimationFrame(id);
  }, [slices]);

  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;

  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} role="img">
          <circle cx={center} cy={center} r={r} fill="none" stroke="var(--line-soft)" strokeWidth={thickness} />
          {slices.map((s) => {
            const len = (s.value / 100) * c * progress;
            const dash = `${len} ${c - len}`;
            const el = (
              <circle
                key={s.name}
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(.22,1,.36,1)' }}
              />
            );
            offset += (s.value / 100) * c * progress;
            return el;
          })}
        </svg>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: '2rem',
                fontWeight: 700,
                letterSpacing: '-.03em',
                color: slices[1]?.color,
              }}
            >
              {slices[1]?.value}%
            </div>
            <div
              style={{
                fontSize: '.7rem',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: 'var(--faint)',
                fontWeight: 700,
              }}
            >
              {slices[1]?.name}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {slices.map((s) => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: 4,
                background: s.color,
                flex: 'none',
              }}
            />
            <div>
              <div style={{ fontSize: '.88rem', fontWeight: 600 }}>{s.name}</div>
              <div className="num" style={{ color: 'var(--muted)' }}>
                {s.value}% of records
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
