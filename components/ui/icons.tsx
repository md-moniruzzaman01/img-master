// Inline SVG icons (DESIGN.md §2 Icons): 20 or 24px, 1.75 stroke, currentColor.
// Only icons that carry meaning: status (check, alert, info), disclosure, menu, close.
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

export const ChevronDownIcon = /* @__PURE__ */ make('ChevronDownIcon', <path d="m6 9 6 6 6-6" />);

export const ChevronRightIcon = /* @__PURE__ */ make('ChevronRightIcon', <path d="m9 6 6 6-6 6" />);

export const MenuIcon = /* @__PURE__ */ make('MenuIcon', <path d="M4 7h16M4 12h16M4 17h16" />);

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
