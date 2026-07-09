/**
 * KAIZENTYPE — brand / decorative SVG components.
 * Recreated in code (no raster assets needed): an enso brush ring, a stamped
 * 改善 seal, a horizontal brush ribbon, and the studio product placeholder.
 */

/** A few hand-placed speckles to give the brush ring some grit. */
const SPECKLES = [
  [104, 14, 2.4],
  [150, 30, 1.8],
  [22, 70, 1.6],
  [38, 150, 2.2],
  [168, 120, 1.5],
];

/**
 * Enso brush ring.
 * @param {{size?: number, stroke?: number, play?: boolean, className?: string}} props
 */
export function EnsoMark({size = 130, stroke = 11, play = false, className = ''}) {
  const drawStyle = play
    ? {
        strokeDasharray: 100,
        strokeDashoffset: 100,
        animation: 'drawStroke 1.6s var(--ease-out) .15s forwards',
      }
    : undefined;
  return (
    <span className={`enso ${className}`} style={{width: size, height: size, display: 'inline-block'}}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <g transform="rotate(-28 100 100)">
          <circle
            cx="100"
            cy="100"
            r="82"
            fill="none"
            stroke="var(--red)"
            strokeWidth={stroke}
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="91 100"
            style={drawStyle}
          />
          <circle
            cx="100"
            cy="100"
            r="82"
            fill="none"
            stroke="var(--red-deep)"
            strokeWidth={stroke * 0.42}
            strokeLinecap="round"
            opacity="0.5"
            pathLength="100"
            strokeDasharray="88 100"
            strokeDashoffset="3"
          />
        </g>
        {SPECKLES.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="var(--red)" opacity="0.75" />
        ))}
      </svg>
    </span>
  );
}

/**
 * The full stamped seal: enso ring + 改善 kanji.
 * @param {{size?: number, play?: boolean, className?: string}} props
 */
export function KaizenSeal({size = 188, play = false, className = ''}) {
  return (
    <span
      className={`kseal ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-grid',
        placeItems: 'center',
        position: 'relative',
      }}
    >
      <EnsoMark size={size} stroke={size * 0.058} play={play} />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--brush)',
          color: 'var(--red)',
          lineHeight: 0.86,
          fontSize: size * 0.3,
          letterSpacing: '-.04em',
        }}
      >
        <span style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <span>改</span>
          <span>善</span>
        </span>
      </span>
    </span>
  );
}

/**
 * Horizontal brush ribbon used as a section divider / accent.
 * @param {{flip?: boolean, opacity?: number, className?: string}} props
 */
export function BrushRibbon({flip = false, opacity = 0.85, className = ''}) {
  return (
    <span className={`ribbon ${flip ? 'flip' : ''} ${className}`} style={{opacity}}>
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 46 C 120 18, 240 64, 360 42 C 500 16, 620 66, 760 44 C 900 22, 1020 60, 1200 40 L 1200 58 C 1020 78, 900 40, 760 62 C 620 84, 500 34, 360 60 C 240 82, 120 36, 0 64 Z"
          fill="var(--red)"
        />
        <path
          d="M40 50 C 200 30, 360 60, 540 46 C 720 32, 900 58, 1160 44"
          fill="none"
          stroke="var(--red-deep)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
    </span>
  );
}

/**
 * Studio product placeholder — a soft grey studio backdrop with a faint
 * kanji seal. Stands in for product photography while no store is linked.
 * @param {{product?: {type?: string}, ratio?: string, showType?: boolean}} props
 */
export function StudioShot({product = {}, ratio = '1 / 1', showType = true}) {
  return (
    <div className="studio" style={{aspectRatio: ratio}}>
      <span className="studio-sweep" />
      <span className="studio-seal">改善</span>
      <span className="studio-grain" />
      {showType && product.type ? (
        <span className="studio-tag">{product.type}</span>
      ) : null}
    </div>
  );
}
