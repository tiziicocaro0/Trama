export default function HiloInicio({ lateral = false }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={lateral ? '0 0 368 70' : '0 0 1200 90'}
      preserveAspectRatio="none"
      fill="none"
      className={
        lateral
          ? 'pointer-events-none -mt-4 block h-10 w-full text-miel xl:h-12'
          : 'pointer-events-none mt-4 block h-12 w-full text-miel sm:h-14'
      }
    >
      <path
        d={
          lateral
            ? 'M0 48 C45 75 73 30 135 44 S246 88 281 44 C340 -7 274 -12 271 26 S306 86 368 41'
            : 'M2 75 C130 18 272 104 439 67 S531 1 486 2 S383 83 564 76 S728 34 922 54 S1124 82 1198 40'
        }
        stroke="currentColor"
        strokeWidth="1.7"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
