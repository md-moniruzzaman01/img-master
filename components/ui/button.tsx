import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button-styles';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

type AsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: undefined;
    /** Shows this text (not just a spinner) and disables the button. */
    loading?: boolean;
    loadingText?: string;
  };

type AsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
    href: string;
  };

export type ButtonProps = AsButton | AsLink;

/**
 * Button (DESIGN.md §4.1). Renders a link when `href` is set: internal paths use
 * next/link, everything else (external, blob:, download) a plain <a>.
 */
export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { variant, size, icon, className, children, href, ...rest } = props;
    const cls = buttonClasses(variant, size, className);
    if (href.startsWith('/') && !rest.download) {
      return (
        <Link href={href} className={cls} {...rest}>
          {icon}
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className={cls} {...rest}>
        {icon}
        {children}
      </a>
    );
  }

  const {
    variant,
    size,
    icon,
    className,
    children,
    loading,
    loadingText,
    disabled,
    type = 'button',
    ...rest
  } = props;
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
          {loadingText ?? children}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
