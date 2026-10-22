import { useState } from 'react'
import { Eye, EyeSlash, Lock } from '@phosphor-icons/react'
import Campo from './Campo.jsx'

export default function CampoContrasena(props) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeSlash : Eye
  return (
    <Campo
      {...props}
      type={visible ? 'text' : 'password'}
      icon={Lock}
      endAdornment={
        <button
          type="button"
          disabled={props.disabled}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          aria-controls={props.id}
          onClick={() => setVisible(!visible)}
          className="flex size-11 items-center justify-center rounded-sm text-primario focus-visible:outline-2 focus-visible:outline-primario"
        >
          <Icon size={20} aria-hidden="true" />
        </button>
      }
    />
  )
}
