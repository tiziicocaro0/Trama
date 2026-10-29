import { useEffect, useRef } from 'react'
import { CheckCircle } from '@phosphor-icons/react'
import Boton from '../../../components/ui/Boton.jsx'
import Pasos from '../../../components/ui/Pasos.jsx'
import useRegistro from './hooks/useRegistro.js'
import RegistroPresentacion from './components/RegistroPresentacion.jsx'
import RegistroFormulario from './components/RegistroFormulario.jsx'

export default function RegistroPage() {
  const registro = useRegistro()
  const { etapa, errores, exito } = registro
  const titleRef = useRef(null)
  const formRef = useRef(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [etapa, exito])

  useEffect(() => {
    if (Object.values(errores).some(Boolean)) {
      formRef.current?.querySelector('[aria-invalid="true"]')?.focus()
    }
  }, [errores])

  return (
    <div className="min-h-svh bg-superficie lg:grid lg:grid-cols-9">
      <RegistroPresentacion />
      <main tabIndex={-1} className="px-6 py-8 lg:col-span-5 lg:px-12 lg:py-16">
        <div className="mx-auto w-full max-w-registro-form">
          <Pasos
            steps={['Datos', 'Seguridad', 'Confirmación']}
            current={etapa}
            complete={exito}
          />
          {exito ? (
            <section
              aria-labelledby="registro-exito"
              className="mt-16 space-y-6"
            >
              <CheckCircle
                size={48}
                aria-hidden="true"
                className="text-exito"
              />
              <h2
                id="registro-exito"
                ref={titleRef}
                tabIndex={-1}
                className="font-display text-h1 text-primario outline-none"
              >
                Cuenta creada
              </h2>
              <p role="status" className="text-lg text-texto">
                Tu cuenta se creó correctamente. ¡Qué bueno que estés en TRAMA!
              </p>
              <p role="alert" className="text-texto-suave">
                {registro.mensaje ||
                  'Verificando tu sesión para entrar a TRAMA…'}
              </p>
              <Boton to="/login" variant="secondary">
                Ir al inicio de sesión
              </Boton>
            </section>
          ) : (
            <RegistroFormulario
              registro={registro}
              formRef={formRef}
              titleRef={titleRef}
            />
          )}
        </div>
      </main>
    </div>
  )
}
