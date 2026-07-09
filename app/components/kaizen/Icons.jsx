/**
 * KAIZENTYPE — inline icon set. Each entry is a ready-to-render element,
 * sized in `em` so it follows font-size, coloured with currentColor.
 */
const base = {
  width: '1em',
  height: '1em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const I = {
  arrow: (
    <svg {...base}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  chevron: (
    <svg {...base}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  truck: (
    <svg {...base}>
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" />
      <circle cx="7" cy="17" r="1.6" />
      <circle cx="17.5" cy="17" r="1.6" />
    </svg>
  ),
  refresh: (
    <svg {...base}>
      <path d="M4 5v5h5M20 19v-5h-5" />
      <path d="M19 9a7.5 7.5 0 0 0-13-2L4 10M5 15a7.5 7.5 0 0 0 13 2l2-3" />
    </svg>
  ),
  leaf: (
    <svg {...base}>
      <path d="M5 19c0-7 5-12 14-12 0 9-5 14-12 14-1.5 0-2-.5-2-2z" />
      <path d="M9 15c2-2 5-4 8-5" />
    </svg>
  ),
  star: (
    <svg {...base} fill="currentColor" stroke="none">
      <path d="M12 3.5l2.6 5.3 5.9.8-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.6l5.9-.8z" />
    </svg>
  ),
  search: (
    <svg {...base}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-3.6-3.6" />
    </svg>
  ),
  user: (
    <svg {...base}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </svg>
  ),
  bag: (
    <svg {...base}>
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  menu: (
    <svg {...base}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  minus: (
    <svg {...base}>
      <path d="M5 12h14" />
    </svg>
  ),
  plus: (
    <svg {...base}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  shield: (
    <svg {...base}>
      <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  check: (
    <svg {...base}>
      <path d="M4 12l5 5L20 6" />
    </svg>
  ),
  send: (
    <svg {...base}>
      <path d="M5 12h13M12 5l7 7-7 7" />
    </svg>
  ),
};
