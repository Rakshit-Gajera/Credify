/**
 * Inline stroke icons (Feather-style, 24x24 grid).
 * Kept local so the project ships zero icon dependencies.
 */
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const Icon = ({ children, size, ...rest }) => (
  <svg {...base} {...rest} width={size ?? base.width} height={size ?? base.height}>
    {children}
  </svg>
);

export const Shield = (p) => (
  <Icon {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

export const Target = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.4" />
  </Icon>
);

export const Chart = (p) => (
  <Icon {...p}>
    <path d="M3 3v18h18" />
    <rect x="7" y="11" width="3" height="6" rx="1" />
    <rect x="12.5" y="7" width="3" height="10" rx="1" />
    <rect x="18" y="13" width="3" height="4" rx="1" />
  </Icon>
);

export const Layers = (p) => (
  <Icon {...p}>
    <path d="m12 2 9 5-9 5-9-5 9-5z" />
    <path d="m3 12 9 5 9-5" />
    <path d="m3 17 9 5 9-5" />
  </Icon>
);

export const Clock = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </Icon>
);

export const Database = (p) => (
  <Icon {...p}>
    <ellipse cx="12" cy="6" rx="8" ry="3" />
    <path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
    <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
  </Icon>
);

export const Cpu = (p) => (
  <Icon {...p}>
    <rect x="5" y="5" width="14" height="14" rx="3" />
    <rect x="9" y="9" width="6" height="6" rx="1.5" />
    <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
  </Icon>
);

export const Arrow = (p) => (
  <Icon {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Icon>
);

export const Sparkle = (p) => (
  <Icon {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4z" />
  </Icon>
);

export const Alert = (p) => (
  <Icon {...p}>
    <path d="M10.3 3.9 2.5 17.5A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </Icon>
);

export const Check = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
  </Icon>
);

export const Wallet = (p) => (
  <Icon {...p}>
    <path d="M3 8a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M3 9h18" />
    <circle cx="16.5" cy="13.5" r="1.2" />
  </Icon>
);

export const Card = (p) => (
  <Icon {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 10h19" />
    <path d="M6 15h4" />
  </Icon>
);

export const Search = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m16.5 16.5 4 4" />
  </Icon>
);

export const Download = (p) => (
  <Icon {...p}>
    <path d="M12 3v12" />
    <path d="m7.5 11 4.5 4.5L16.5 11" />
    <path d="M4 20h16" />
  </Icon>
);

export const Refresh = (p) => (
  <Icon {...p}>
    <path d="M20 11a8 8 0 0 0-13.7-5.3L3 9" />
    <path d="M3 4v5h5" />
    <path d="M4 13a8 8 0 0 0 13.7 5.3L21 15" />
    <path d="M21 20v-5h-5" />
  </Icon>
);

export const Menu = (p) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const Book = (p) => (
  <Icon {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
    <path d="M4 17V5" />
    <path d="M8 7h7M8 11h7" />
  </Icon>
);

export const Inbox = (p) => (
  <Icon {...p}>
    <path d="M3 13h5l1.5 3h5L16 13h5" />
    <path d="M4.4 5.6 3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5l-1.4-7.4A2 2 0 0 0 17.6 4H6.4a2 2 0 0 0-2 1.6z" />
  </Icon>
);

export const Scale = (p) => (
  <Icon {...p}>
    <path d="M12 3v18" />
    <path d="M6 7h12" />
    <path d="M6 7 3 14h6zM18 7l-3 7h6z" />
    <path d="M8 21h8" />
  </Icon>
);
