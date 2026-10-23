// Inline SVG icons (DESIGN.md §2 Icons): 20 or 24px, 1.75 stroke, currentColor.
import type { ReactNode, SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: 20 | 24;
}

function make(name: string, paths: ReactNode) {
  function Icon({ size = 24, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
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

export const UploadIcon = /* @__PURE__ */ make(
  'UploadIcon',
  <>
    <path d="M12 15V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </>,
);

export const DownloadIcon = /* @__PURE__ */ make(
  'DownloadIcon',
  <>
    <path d="M12 4v11" />
    <path d="m7 10 5 5 5-5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </>,
);

export const ShareIcon = /* @__PURE__ */ make(
  'ShareIcon',
  <>
    <circle cx="18" cy="5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
  </>,
);

export const ZipIcon = /* @__PURE__ */ make(
  'ZipIcon',
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M11 6h1M11 9h1M11 12h1" />
    <rect x="10" y="14" width="3" height="4" rx="1" />
  </>,
);

export const ImageIcon = /* @__PURE__ */ make(
  'ImageIcon',
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.75" />
    <path d="m21 16-5-5-9 9" />
  </>,
);

export const CheckIcon = /* @__PURE__ */ make('CheckIcon', <path d="m5 12.5 4.5 4.5L19 7.5" />);

export const XIcon = /* @__PURE__ */ make('XIcon', <path d="M6 6l12 12M18 6 6 18" />);

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

export const LockIcon = /* @__PURE__ */ make(
  'LockIcon',
  <>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </>,
);

export const CopyIcon = /* @__PURE__ */ make(
  'CopyIcon',
  <>
    <rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2" />
    <path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" />
  </>,
);

export const ChevronDownIcon = /* @__PURE__ */ make('ChevronDownIcon', <path d="m6 9 6 6 6-6" />);

export const ChevronRightIcon = /* @__PURE__ */ make('ChevronRightIcon', <path d="m9 6 6 6-6 6" />);

export const MenuIcon = /* @__PURE__ */ make('MenuIcon', <path d="M4 7h16M4 12h16M4 17h16" />);

export const ArrowRightIcon = /* @__PURE__ */ make(
  'ArrowRightIcon',
  <path d="M5 12h14M13 6l6 6-6 6" />,
);

export const SparkleIcon = /* @__PURE__ */ make(
  'SparkleIcon',
  <>
    <path d="M12 3.5 13.8 9a2 2 0 0 0 1.2 1.2l5.5 1.8-5.5 1.8a2 2 0 0 0-1.2 1.2L12 20.5 10.2 15A2 2 0 0 0 9 13.8L3.5 12 9 10.2A2 2 0 0 0 10.2 9z" />
  </>,
);

/** Extra: arrows pointing inward (compress tools). */
export const CompressIcon = /* @__PURE__ */ make(
  'CompressIcon',
  <>
    <path d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5" />
  </>,
);

/** Extra: two opposing arrows (convert tools). */
export const ConvertIcon = /* @__PURE__ */ make(
  'ConvertIcon',
  <>
    <path d="M4 8h14l-3.5-3.5" />
    <path d="M20 16H6l3.5 3.5" />
  </>,
);
