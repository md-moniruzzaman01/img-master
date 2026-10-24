/** Small crimson hanko seal with 画 ("picture"). Decorative: the logo text is the name. */
export function BrandSeal({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <rect width="18" height="18" rx="3" className="fill-primary" />
      <text
        x="9"
        y="14"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        className="fill-on-primary"
        fontFamily="var(--font-noto-serif), Georgia, serif"
      >
        画
      </text>
    </svg>
  );
}
