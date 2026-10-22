import { Check } from '@phosphor-icons/react'

export default function Stepper({
  steps,
  current,
  complete = false,
  label = 'Etapas del registro',
}) {
  return (
    <ol
      aria-label={label}
      className="mx-auto flex w-full max-w-sm"
    >
      {steps.map((label, index) => (
        <li
          key={label}
          aria-current={!complete && index === current ? 'step' : undefined}
          className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 text-center text-sm ${index ? 'before:absolute before:top-4 before:-left-1/2 before:w-full before:border-t before:border-borde' : ''}`}
        >
          <span
            aria-hidden="true"
            className={`relative z-10 flex size-8 items-center justify-center rounded-full border ${index <= current || complete ? 'border-primario bg-primario text-superficie' : 'border-borde bg-superficie text-texto-suave'}`}
          >
            {index < current || complete ? <Check size={16} /> : index + 1}
          </span>
          <span
            className={
              index === current || complete
                ? 'font-bold text-primario'
                : 'text-texto-suave'
            }
          >
            {label}
          </span>
        </li>
      ))}
    </ol>
  )
}
