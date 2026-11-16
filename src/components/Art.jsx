// A koru (unfurling fern frond) drawn as an inline SVG.
function spiral(cx, cy, R, turns) {
  let d = ''
  const n = 90
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = -t * turns * Math.PI * 2 // counter-clockwise, starting at the right-hand point
    const r = R * (1 - t) + 3
    d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`
  }
  return d
}

export function Mark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d={`M31 40V20${spiral(20, 20, 11, 1.75).replace('M', 'L')}`} stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function HeroArt() {
  const frond = (cx, cy, R, turns, w, color) => (
    <g fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${cx + R} 450L${cx + R} ${cy}${spiral(cx, cy, R, turns).replace('M', 'L')}`} />
      <circle cx={cx} cy={cy} r={w * 0.55} fill="#d4d36b" stroke="none" />
    </g>
  )
  return (
    <svg viewBox="0 0 400 440" preserveAspectRatio="xMidYMid slice" role="img" aria-label="An unfurling fern frond">
      <rect width="400" height="440" fill="#c99468" />
      {frond(230, 190, 118, 2, 20, '#8d5b7a')}
      {frond(105, 345, 52, 2, 13, '#9a6a86')}
    </svg>
  )
}
