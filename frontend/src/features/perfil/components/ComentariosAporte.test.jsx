import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { crearComentario, listarComentarios } from '../../../api/comentarios.js'
import { listarMiembros } from '../../../api/miembros.js'
import ComentariosAporte from './ComentariosAporte.jsx'
import TarjetaAporte from '../../../components/ui/TarjetaAporte.jsx'

vi.mock('../../../api/comentarios.js', () => ({ crearComentario: vi.fn(), listarComentarios: vi.fn() }))
vi.mock('../../../api/miembros.js', () => ({ listarMiembros: vi.fn() }))

const aporte = { id: 'a1', proyectoId: 'p1', titulo: 'Juego preferido', archivado: false }
const comentario = { id: 'c1', aporteId: 'a1', autorId: 'u1', autorNombre: 'Ana Ficticia', texto: 'Un comentario', fecha: '2026-11-10T10:00:00' }
const miembros = [
  { id: 'm1', usuarioId: 'u1', nombre: 'Ana', apellido: 'Pérez', rol: 'TUTOR' },
  { id: 'm2', usuarioId: 'u2', nombre: 'Ana', apellido: 'Gómez', rol: 'SALUD' },
  { id: 'm3', usuarioId: 'u3', nombre: 'Luis', apellido: 'Sosa', rol: 'FAMILIAR' },
]

function mostrar(props = {}) {
  return render(<ComentariosAporte aporte={aporte} usuarioId="yo" {...props} />)
}

beforeEach(() => {
  vi.resetAllMocks()
  listarComentarios.mockResolvedValue([comentario])
  listarMiembros.mockResolvedValue(miembros)
})

describe('Comentarios de un aporte', () => {
  it('ofrece comentarios desde la tarjeta sin cargar todas las conversaciones', () => {
    render(<TarjetaAporte aporte={{ ...aporte, tipo: 'INTERES' }} usuarioId="yo" />)
    expect(screen.getByRole('button', { name: 'Comentarios' })).toBeInTheDocument()
    expect(listarComentarios).not.toHaveBeenCalled()
  })

  it('carga solo al abrir, muestra la cantidad real, contenido y permite cerrar', async () => {
    mostrar()
    expect(screen.getByRole('button', { name: 'Comentarios' })).toBeInTheDocument()
    expect(listarComentarios).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Comentarios' }))
    expect(screen.getByRole('status')).toHaveTextContent('Cargando comentarios')
    expect(await screen.findByText('Un comentario')).toBeInTheDocument()
    expect(screen.getByText('Ana Ficticia')).toBeInTheDocument()
    expect(screen.getByText('Un comentario').parentElement.querySelector('time')).toHaveAttribute('datetime', comentario.fecha)
    expect(screen.getByRole('button', { name: 'Comentarios (1)' })).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Comentarios (1)' }))
    expect(screen.queryByText('Un comentario')).not.toBeInTheDocument()
  })

  it('valida el contenido y evita envíos duplicados, luego actualiza la lista', async () => {
    listarComentarios.mockResolvedValue([])
    let resolver
    crearComentario.mockReturnValue(new Promise((resolve) => { resolver = resolve }))
    mostrar()
    fireEvent.click(screen.getByText('Comentarios'))
    const campo = await screen.findByLabelText('Escribí un comentario')
    fireEvent.change(campo, { target: { value: '  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar comentario' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Escribí un comentario')
    expect(crearComentario).not.toHaveBeenCalled()
    fireEvent.change(campo, { target: { value: ' Hola ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar comentario' }))
    expect(crearComentario).toHaveBeenCalledWith('p1', 'a1', 'Hola')
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled()
    fireEvent.submit(campo.closest('form'))
    expect(crearComentario).toHaveBeenCalledTimes(1)
    resolver({ ...comentario, texto: 'Hola' })
    expect(await screen.findByText('Hola')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comentarios (1)' })).toBeInTheDocument()
    expect(campo).toHaveValue('')
  })

  it('permite reintentar la carga y conserva el texto ante un error al enviar', async () => {
    listarComentarios.mockRejectedValueOnce(new Error('No se pudo cargar')).mockResolvedValueOnce([])
    crearComentario.mockRejectedValue(new Error('No se pudo enviar'))
    mostrar()
    fireEvent.click(screen.getByText('Comentarios'))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    const campo = await screen.findByLabelText('Escribí un comentario')
    fireEvent.change(campo, { target: { value: 'Mensaje' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar comentario' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo enviar')
    expect(campo).toHaveValue('Mensaje')
  })

  it('sugiere miembros al escribir @, filtra sin tildes y permite varias menciones', async () => {
    mostrar()
    fireEvent.click(screen.getByText('Comentarios'))
    const campo = await screen.findByLabelText('Escribí un comentario')
    fireEvent.change(campo, { target: { value: 'Hola @anA pEr' } })
    const sugerencia = await screen.findByRole('button', { name: 'Ana Pérez' })
    expect(listarMiembros).toHaveBeenCalledWith('p1', expect.any(AbortSignal))
    expect(screen.queryByRole('button', { name: 'Ana Gómez' })).not.toBeInTheDocument()
    fireEvent.click(sugerencia)
    expect(campo).toHaveValue('Hola @Ana Pérez, ')
    fireEvent.change(campo, { target: { value: 'Hola @Ana Pérez, y @lu' } })
    fireEvent.click(await screen.findByRole('button', { name: 'Luis Sosa' }))
    expect(campo).toHaveValue('Hola @Ana Pérez, y @Luis Sosa, ')
  })

  it('no ofrece como seleccionable un nombre completo ambiguo', async () => {
    listarMiembros.mockResolvedValue([...miembros, { id: 'm4', usuarioId: 'u4', nombre: 'ANA', apellido: 'PEREZ', rol: 'EDUCACION' }])
    mostrar()
    fireEvent.click(screen.getByText('Comentarios'))
    const campo = await screen.findByLabelText('Escribí un comentario')
    fireEvent.change(campo, { target: { value: '@ana' } })
    const lista = await screen.findByRole('list', { name: 'Sugerencias de menciones' })
    expect(within(lista).getAllByRole('button', { name: /nombre repetido/i })).toHaveLength(1)
    expect(within(lista).getByRole('button', { name: 'Ana Gómez' })).toBeEnabled()
  })

  it('permite elegir con teclado e insertar antes del texto posterior', async () => {
    mostrar()
    fireEvent.click(screen.getByText('Comentarios'))
    const campo = await screen.findByLabelText('Escribí un comentario')
    fireEvent.change(campo, { target: { value: 'Hola @lu después' } })
    campo.setSelectionRange(8, 8)
    fireEvent.select(campo)
    await screen.findByRole('button', { name: 'Luis Sosa' })
    fireEvent.keyDown(campo, { key: 'Enter' })
    expect(campo).toHaveValue('Hola @Luis Sosa,  después')
  })

  it('permite reintentar si falla la consulta de miembros', async () => {
    listarMiembros.mockRejectedValueOnce(new Error('sin conexión')).mockResolvedValueOnce(miembros)
    mostrar()
    fireEvent.click(screen.getByText('Comentarios'))
    const campo = await screen.findByLabelText('Escribí un comentario')
    fireEvent.change(campo, { target: { value: '@' } })
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los miembros.')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('button', { name: 'Ana Pérez' })).toBeInTheDocument()
  })

  it('no permite escribir en un aporte archivado', async () => {
    mostrar({ aporte: { ...aporte, archivado: true } })
    fireEvent.click(screen.getByText('Comentarios'))
    await screen.findByText('Un comentario')
    expect(screen.queryByLabelText('Escribí un comentario')).not.toBeInTheDocument()
  })
})
