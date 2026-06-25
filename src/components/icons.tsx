// Lightweight Lucide-style stroke icons (no dependency). 24x24, currentColor.
type P = { className?: string };
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function DashboardIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

export function RolesIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

export function CandidatesIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function SettingsIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function CollapseIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="m16 15-3-3 3-3" />
    </svg>
  );
}

export function PlusIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function LogOutIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

/* ---- Role-tile icons (Lucide-style) ---- */
export function HeadsetIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
      <path d="M3 16a2 2 0 0 1 2-2h1v6H5a2 2 0 0 1-2-2z" />
      <path d="M21 16a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2z" />
      <path d="M18 19a4 4 0 0 1-4 3h-2" />
    </svg>
  );
}
export function TrendingUpIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M16 7h6v6" />
      <path d="m22 7-8.5 8.5-5-5L2 17" />
    </svg>
  );
}
export function BellIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M10.27 21a2 2 0 0 0 3.46 0" />
      <path d="M3.26 15.06a1 1 0 0 1-.26-.67V11a9 9 0 0 1 18 0v3.39a1 1 0 0 1-.26.67L19 17H5z" />
    </svg>
  );
}
export function BoxesIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="8" y="13" width="8" height="8" rx="1" />
    </svg>
  );
}
export function ClipboardIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}
export function ShoppingBagIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
export function CoffeeIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
      <path d="M6 2v2M10 2v2M14 2v2" />
    </svg>
  );
}
export function HeartIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" />
    </svg>
  );
}
export function PencilIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}
export function CodeIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </svg>
  );
}
export function CalculatorIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </svg>
  );
}
export function MicIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 17v4" />
    </svg>
  );
}

export function PlayIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M7 4.5v15a1 1 0 0 0 1.52.85l11.5-7.5a1 1 0 0 0 0-1.7l-11.5-7.5A1 1 0 0 0 7 4.5z" />
    </svg>
  );
}

export function SearchIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function DotsIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: P) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m22 4-10 10-3-3" />
    </svg>
  );
}
