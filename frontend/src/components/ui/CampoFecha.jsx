import { useEffect, useRef, useState } from 'react'
import { CalendarBlank, CaretLeft, CaretRight } from '@phosphor-icons/react'

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

function parsearFecha(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor))
    return null
  const [anio, mes, dia] = valor.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  if (
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  )
    return null
  return fecha
}

function formatearParaMostrar(valor) {
  const fecha = parsearFecha(valor)
  if (!fecha) return ''
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(fecha)
}

function formatearParaValor(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function obtenerDiasDelMes(anio, mes) {
  const primerDia = new Date(anio, mes, 1)
  // lunes = 0, domingo = 6
  let diaSemana = primerDia.getDay() - 1
  if (diaSemana < 0) diaSemana = 6
  const ultimoDia = new Date(anio, mes + 1, 0).getDate()
  const dias = []
  // Espacios vacios antes del primer dia
  for (let i = 0; i < diaSemana; i++) {
    dias.push(null)
  }
  for (let d = 1; d <= ultimoDia; d++) {
    dias.push(d)
  }
  return dias
}

export default function CampoFecha({
  id,
  name,
  value = '',
  onChange,
  max,
  disabled,
  required,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
  className = '',
}) {
  const [abierto, setAbierto] = useState(false)
  // 'dias' | 'anios' | 'meses'
  const [vista, setVista] = useState('dias')
  const contenedorRef = useRef(null)
  const botonRef = useRef(null)

  const fechaSeleccionada = parsearFecha(value)
  const hoy = new Date()
  const hoyStr = formatearParaValor(hoy)

  const [mesVista, setMesVista] = useState(
    fechaSeleccionada
      ? { anio: fechaSeleccionada.getFullYear(), mes: fechaSeleccionada.getMonth() }
      : { anio: hoy.getFullYear(), mes: hoy.getMonth() },
  )

  // Rango de anios: bloques de 12, centrado en el anio actual de la vista
  const [inicioRangoAnios, setInicioRangoAnios] = useState(
    () => mesVista.anio - (mesVista.anio % 12),
  )

  useEffect(() => {
    if (!abierto) return
    function manejarClickFuera(evento) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(evento.target)
      ) {
        setAbierto(false)
        setVista('dias')
      }
    }
    function manejarEscape(evento) {
      if (evento.key === 'Escape') {
        if (vista === 'meses') {
          setVista('anios')
        } else if (vista === 'anios') {
          setVista('dias')
        } else {
          setAbierto(false)
          setVista('dias')
          botonRef.current?.focus()
        }
      }
    }
    document.addEventListener('mousedown', manejarClickFuera)
    document.addEventListener('keydown', manejarEscape)
    return () => {
      document.removeEventListener('mousedown', manejarClickFuera)
      document.removeEventListener('keydown', manejarEscape)
    }
  }, [abierto, vista])

  function alternar() {
    if (disabled) return
    setAbierto((prev) => {
      if (!prev && fechaSeleccionada) {
        setMesVista({
          anio: fechaSeleccionada.getFullYear(),
          mes: fechaSeleccionada.getMonth(),
        })
        setInicioRangoAnios(
          fechaSeleccionada.getFullYear() -
            (fechaSeleccionada.getFullYear() % 12),
        )
      }
      if (!prev) setVista('dias')
      return !prev
    })
  }

  function mesAnterior() {
    setMesVista((actual) => {
      if (actual.mes === 0) return { anio: actual.anio - 1, mes: 11 }
      return { anio: actual.anio, mes: actual.mes - 1 }
    })
  }

  function mesSiguiente() {
    setMesVista((actual) => {
      if (actual.mes === 11) return { anio: actual.anio + 1, mes: 0 }
      return { anio: actual.anio, mes: actual.mes + 1 }
    })
  }

  function abrirSelectorAnios() {
    setInicioRangoAnios(mesVista.anio - (mesVista.anio % 12))
    setVista('anios')
  }

  function seleccionarAnio(anio) {
    setMesVista((actual) => ({ ...actual, anio }))
    setVista('meses')
  }

  function seleccionarMes(mes) {
    setMesVista((actual) => ({ ...actual, mes }))
    setVista('dias')
  }

  function seleccionarDia(dia) {
    const fecha = new Date(mesVista.anio, mesVista.mes, dia)
    const nuevoValor = formatearParaValor(fecha)
    if (onChange) {
      onChange({ target: { name, value: nuevoValor, type: 'text' } })
    }
    setAbierto(false)
    setVista('dias')
    botonRef.current?.focus()
  }

  function estaDeshabilitado(dia) {
    if (!max) return false
    const fecha = formatearParaValor(new Date(mesVista.anio, mesVista.mes, dia))
    return fecha > max
  }

  function anioDeshabilitado(anio) {
    if (!max) return false
    return anio > Number(max.slice(0, 4))
  }

  function mesDeshabilitadoEnVista(mes) {
    if (!max) return false
    const anioMax = Number(max.slice(0, 4))
    const mesMax = Number(max.slice(5, 7)) - 1
    if (mesVista.anio > anioMax) return true
    if (mesVista.anio === anioMax && mes > mesMax) return true
    return false
  }

  const dias = obtenerDiasDelMes(mesVista.anio, mesVista.mes)
  const textoMostrado = formatearParaMostrar(value) || ''

  // Generar grilla de anios (4 columnas x 3 filas = 12 anios)
  const aniosGrilla = []
  for (let i = 0; i < 12; i++) {
    aniosGrilla.push(inicioRangoAnios + i)
  }

  return (
    <div ref={contenedorRef} className={`relative ${className}`}>
      <button
        ref={botonRef}
        type="button"
        onClick={alternar}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        className={`flex min-h-18 w-full items-center gap-3 rounded-md border bg-superficie py-4 pl-14 pr-5 text-left text-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-wait ${ariaInvalid ? 'border-error' : 'border-borde'}`}
      >
        <CalendarBlank
          size={20}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-agua"
        />
        {textoMostrado ? (
          <span className="text-texto">{textoMostrado}</span>
        ) : (
          <span className="text-texto-suave">dd/mm/aaaa</span>
        )}
      </button>
      {/* Input accesible para asociación con label y formularios */}
      <input
        id={id}
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        tabIndex={-1}
        className="sr-only"
      />
      {abierto && (
        <div
          role="dialog"
          aria-label="Elegir fecha"
          className="absolute left-0 z-50 mt-2 w-72 rounded-lg border border-borde bg-superficie p-4 shadow-md"
        >
          {vista === 'dias' && (
            <>
              {/* Navegacion del mes */}
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={mesAnterior}
                  aria-label="Mes anterior"
                  className="flex size-8 items-center justify-center rounded-full text-secundario hover:bg-decoracion"
                >
                  <CaretLeft size={18} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={abrirSelectorAnios}
                  aria-label="Elegir año y mes"
                  className="rounded-md px-2 py-1 font-display text-lg text-secundario hover:bg-decoracion"
                >
                  {MESES[mesVista.mes]} {mesVista.anio}
                </button>
                <button
                  type="button"
                  onClick={mesSiguiente}
                  aria-label="Mes siguiente"
                  className="flex size-8 items-center justify-center rounded-full text-secundario hover:bg-decoracion"
                >
                  <CaretRight size={18} weight="bold" />
                </button>
              </div>
              {/* Dias de la semana */}
              <div className="mb-1 grid grid-cols-7 text-center text-sm font-semibold text-texto-suave">
                {DIAS_SEMANA.map((d) => (
                  <span key={d} className="py-1">
                    {d}
                  </span>
                ))}
              </div>
              {/* Grilla de dias */}
              <div className="grid grid-cols-7 text-center">
                {dias.map((dia, i) =>
                  dia === null ? (
                    <span key={`vacio-${i}`} />
                  ) : (
                    <button
                      key={dia}
                      type="button"
                      disabled={estaDeshabilitado(dia)}
                      onClick={() => seleccionarDia(dia)}
                      className={`flex size-9 items-center justify-center rounded-full text-sm transition-colors ${
                        value ===
                        formatearParaValor(
                          new Date(mesVista.anio, mesVista.mes, dia),
                        )
                          ? 'bg-primario font-bold text-superficie'
                          : formatearParaValor(
                                new Date(mesVista.anio, mesVista.mes, dia),
                              ) === hoyStr
                            ? 'font-bold text-primario'
                            : estaDeshabilitado(dia)
                              ? 'cursor-not-allowed text-borde'
                              : 'text-texto hover:bg-decoracion'
                      }`}
                    >
                      {dia}
                    </button>
                  ),
                )}
              </div>
            </>
          )}

          {vista === 'anios' && (
            <>
              {/* Navegacion del rango de anios */}
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setInicioRangoAnios((a) => a - 12)}
                  aria-label="Años anteriores"
                  className="flex size-8 items-center justify-center rounded-full text-secundario hover:bg-decoracion"
                >
                  <CaretLeft size={18} weight="bold" />
                </button>
                <span className="font-display text-lg text-secundario">
                  {inicioRangoAnios} – {inicioRangoAnios + 11}
                </span>
                <button
                  type="button"
                  onClick={() => setInicioRangoAnios((a) => a + 12)}
                  aria-label="Años siguientes"
                  className="flex size-8 items-center justify-center rounded-full text-secundario hover:bg-decoracion"
                >
                  <CaretRight size={18} weight="bold" />
                </button>
              </div>
              {/* Grilla de anios (4x3) */}
              <div className="grid grid-cols-4 gap-1">
                {aniosGrilla.map((anio) => (
                  <button
                    key={anio}
                    type="button"
                    disabled={anioDeshabilitado(anio)}
                    onClick={() => seleccionarAnio(anio)}
                    className={`rounded-lg py-2 text-sm transition-colors ${
                      anio === mesVista.anio
                        ? 'bg-primario font-bold text-superficie'
                        : anio === hoy.getFullYear()
                          ? 'font-bold text-primario'
                          : anioDeshabilitado(anio)
                            ? 'cursor-not-allowed text-borde'
                            : 'text-texto hover:bg-decoracion'
                    }`}
                  >
                    {anio}
                  </button>
                ))}
              </div>
            </>
          )}

          {vista === 'meses' && (
            <>
              {/* Titulo con anio seleccionado */}
              <div className="mb-3 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setVista('anios')}
                  aria-label="Volver a elegir año"
                  className="rounded-md px-2 py-1 font-display text-lg text-secundario hover:bg-decoracion"
                >
                  {mesVista.anio}
                </button>
              </div>
              {/* Grilla de meses (4x3) */}
              <div className="grid grid-cols-4 gap-1">
                {MESES_CORTOS.map((nombreMes, indice) => (
                  <button
                    key={nombreMes}
                    type="button"
                    disabled={mesDeshabilitadoEnVista(indice)}
                    onClick={() => seleccionarMes(indice)}
                    className={`rounded-lg py-2 text-sm transition-colors ${
                      indice === mesVista.mes
                        ? 'bg-primario font-bold text-superficie'
                        : indice === hoy.getMonth() &&
                            mesVista.anio === hoy.getFullYear()
                          ? 'font-bold text-primario'
                          : mesDeshabilitadoEnVista(indice)
                            ? 'cursor-not-allowed text-borde'
                            : 'text-texto hover:bg-decoracion'
                    }`}
                  >
                    {nombreMes}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
