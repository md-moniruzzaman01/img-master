// Inline SVG icons: 24px grid, 1.75 stroke, currentColor. Always aria-hidden;
// the text next to an icon carries the meaning.
import type { ReactNode, SVGProps } from 'react';
import type { UseCaseIcon } from '@/lib/types';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number;
}

function make(name: string, paths: ReactNode, fill = false) {
  function Icon({ size = 24, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={fill ? 'currentColor' : 'none'}
        stroke={fill ? 'none' : 'currentColor'}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        {paths}
      </svg>
    );
  }
  Icon.displayName = name;
  return Icon;
}

export const CheckIcon = /* @__PURE__ */ make('CheckIcon', <path d="m5 12.5 4.5 4.5L19 7.5" />);
export const XIcon = /* @__PURE__ */ make('XIcon', <path d="M6 6l12 12M18 6 6 18" />);
export const PlusIcon = /* @__PURE__ */ make('PlusIcon', <path d="M12 5v14M5 12h14" />);
export const MinusIcon = /* @__PURE__ */ make('MinusIcon', <path d="M5 12h14" />);
export const AlertIcon = /* @__PURE__ */ make(
  'AlertIcon',
  <>
    <path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />
    <path d="M12 9.5v4M12 17h.01" />
  </>,
);
export const InfoIcon = /* @__PURE__ */ make(
  'InfoIcon',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </>,
);
export const ChevronDownIcon = /* @__PURE__ */ make('ChevronDownIcon', <path d="m6 9 6 6 6-6" />);
export const ChevronRightIcon = /* @__PURE__ */ make('ChevronRightIcon', <path d="m9 6 6 6-6 6" />);
export const ArrowRightIcon = /* @__PURE__ */ make(
  'ArrowRightIcon',
  <path d="M5 12h14M13 6l6 6-6 6" />,
);
export const MenuIcon = /* @__PURE__ */ make('MenuIcon', <path d="M4 7h16M4 12h16M9 17h11" />);
export const SearchIcon = /* @__PURE__ */ make(
  'SearchIcon',
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </>,
);
export const MoonIcon = /* @__PURE__ */ make(
  'MoonIcon',
  <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" />,
);
export const SunIcon = /* @__PURE__ */ make(
  'SunIcon',
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </>,
);
export const LockIcon = /* @__PURE__ */ make(
  'LockIcon',
  <>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </>,
);
export const UploadIcon = /* @__PURE__ */ make(
  'UploadIcon',
  <path d="M12 16V5M7 10l5-5 5 5M5 19.5h14" />,
);
export const DownloadIcon = /* @__PURE__ */ make(
  'DownloadIcon',
  <path d="M12 4v11M7 10l5 5 5-5M5 19.5h14" />,
);
/** Before/after: ‹|› */
export const CompareIcon = /* @__PURE__ */ make(
  'CompareIcon',
  <path d="M12 4v16M8 8l-4 4 4 4M16 8l4 4-4 4" />,
);
export const SwapIcon = /* @__PURE__ */ make(
  'SwapIcon',
  <path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4" />,
);
export const ReturnIcon = /* @__PURE__ */ make('ReturnIcon', <path d="M19 5v7a3 3 0 0 1-3 3H6M10 11l-4 4 4 4" />);
export const LinkIcon = /* @__PURE__ */ make(
  'LinkIcon',
  <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
);
export const UnlinkIcon = /* @__PURE__ */ make(
  'UnlinkIcon',
  <path d="M15.7 14l3-3a4 4 0 0 0-5.7-5.7l-1 1M8.3 10l-3 3a4 4 0 0 0 5.7 5.7l1-1M4 4l16 16" />,
);
export const SpeakerIcon = /* @__PURE__ */ make(
  'SpeakerIcon',
  <>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </>,
);
export const SpeakerOffIcon = /* @__PURE__ */ make(
  'SpeakerOffIcon',
  <>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="m16 9.5 5 5M21 9.5l-5 5" />
  </>,
);
export const PhoneIcon = /* @__PURE__ */ make(
  'PhoneIcon',
  <>
    <rect x="7" y="3" width="10" height="18" rx="2" />
    <path d="M11 17.5h2" />
  </>,
);
export const DocumentIcon = /* @__PURE__ */ make(
  'DocumentIcon',
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </>,
);
export const CapIcon = /* @__PURE__ */ make(
  'CapIcon',
  <>
    <path d="M2.5 9.5 12 5l9.5 4.5L12 14z" />
    <path d="M6.5 11.5v4c1.5 1.5 3.5 2 5.5 2s4-.5 5.5-2v-4M21.5 9.5v5" />
  </>,
);
export const GlobeIcon = /* @__PURE__ */ make(
  'GlobeIcon',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z" />
  </>,
);
export const MailIcon = /* @__PURE__ */ make(
  'MailIcon',
  <>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </>,
);
export const ImageIcon = /* @__PURE__ */ make(
  'ImageIcon',
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="9" cy="10" r="1.75" />
    <path d="m20.5 16-5-5-9 8.5" />
  </>,
);
export const PrintIcon = /* @__PURE__ */ make(
  'PrintIcon',
  <>
    <path d="M7 8V3.5h10V8M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <path d="M7 14h10v6.5H7z" />
  </>,
);
export const CodeIcon = /* @__PURE__ */ make('CodeIcon', <path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M13.5 5l-3 14" />);
export const BoltIcon = /* @__PURE__ */ make('BoltIcon', <path d="M13 3 5 13.5h6L10.5 21 19 10h-6z" />);

const USE_CASE_ICONS: Record<UseCaseIcon, ReturnType<typeof make>> = {
  document: DocumentIcon,
  cap: CapIcon,
  globe: GlobeIcon,
  mail: MailIcon,
  phone: PhoneIcon,
  image: ImageIcon,
  print: PrintIcon,
  code: CodeIcon,
};

/** The icon for a use-case card. */
export function UseCaseGlyph({ icon, ...props }: IconProps & { icon: UseCaseIcon }) {
  const Icon = USE_CASE_ICONS[icon] ?? DocumentIcon;
  return <Icon {...props} />;
}
