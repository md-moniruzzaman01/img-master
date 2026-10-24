export function InkDefs({ id, w, h }: { id: string; w: number; h: number }) {
  return (
    <defs>
      <filter
        id={id}
        filterUnits="userSpaceOnUse"
        x={-0.05 * w}
        y={-0.05 * h}
        width={1.1 * w}
        height={1.1 * h}
      >
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
      </filter>
    </defs>
  );
}
