import { cloneElement } from 'react'

export default function CampoFormulario({ id, label, error, hint, children }) {
  const describedBy = [hint && `${id}-ayuda`, error && `${id}-error`]
    .filter(Boolean)
    .join(' ')
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {cloneElement(children, {
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy || undefined,
      })}
      {hint && (
        <p id={`${id}-ayuda`} className="mt-2 text-sm text-texto-suave">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  )
}
