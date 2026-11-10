import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthContext from '../auth/AuthContext.js'
import InicioPage from './InicioPage.jsx'
import { obtenerMisProyectos } from '../../api/proyectos.js'
import { listarEventos } from '../../api/eventos.js'
import { hoyIso } from '../../utils/fechas.js'
import { sumarDias } from '../calendario/utils/periodo.js'
import VistaSimpleProvider from '../perfil/VistaSimpleProvider.jsx'

vi.mock('../calendario/CalendarioUsuarioPage.jsx', () => ({ default: () => <section><h2>Calendario</h2><p>Agenda del usuario autenticado</p></section> }))
vi.mock('../../api/proyectos.js', () => ({ obtenerMisProyectos: vi.fn() }))
vi.mock('../../api/eventos.js', () => ({ listarEventos: vi.fn() }))

const usuario = {
  nombre: 'Nora',
  apellido: 'Ejemplo',
  email: 'nora@trama.test',
}

const hoy = hoyIso()
const proyectos = [
  { id: 'p-luz', nombre: 'Luz', apodo: 'Luli', rol: 'Tutor/a', edad: '7 años' },
  { id: 'p-tomas', nombre: 'Tomás', apodo: null, rol: 'Salud', edad: '6 años' },
]
const eventosPorProyecto = {
  'p-luz': [
    { id: 'e2', fecha: sumarDias(hoy, 2), horaInicio: '15:00:00', horaFin: '16:00:00', titulo: 'Sesión de fono' },
    { id: 'e9', fecha: sumarDias(hoy, 9), horaInicio: '09:00:00', horaFin: '10:00:00', titulo: 'Acto escolar' },
  ],
  'p-tomas': [
    { id: 'e1', fecha: sumarDias(hoy, 1), horaInicio: '10:00:00', horaFin: '11:00:00', titulo: 'Reunión con la docente' },
    { id: 'e5', fecha: sumarDias(hoy, 5), horaInicio: '18:00:00', horaFin: '19:00:00', titulo: 'Reunión familiar' },
  ],
}

beforeEach(() => {
  vi.mocked(obtenerMisProyectos).mockReset().mockResolvedValue(proyectos)
  vi.mocked(listarEventos)
    .mockReset()
    .mockImplementation(async (id) => eventosPorProyecto[id] ?? [])
})

function abrir(ruta = '/inicio') {
  const cerrarSesion = vi.fn()
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthContext.Provider value={{ usuario, cerrarSesion }}>
        <VistaSimpleProvider>
          <InicioPage />
        </VistaSimpleProvider>
      </AuthContext.Provider>
    </MemoryRouter>,
  )
  return { cerrarSesion }
}

describe('Inicio de TRAMA', () => {
  it('muestra los acompañamientos reales de la persona, sin datos de ejemplo', async () => {
    abrir()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hola, Nora.')
    expect(screen.queryByText(usuario.email)).not.toBeInTheDocument()
    expect(screen.queryByText(/ficticios/)).not.toBeInTheDocument()
    const acompanamientos = screen.getByRole('region', { name: 'Tus acompañamientos' })
    const luz = await within(acompanamientos).findByRole('link', { name: /Luli/ })
    expect(luz).toHaveAttribute('href', '/proyectos/p-luz')
    expect(luz).toHaveTextContent('Tutor/a · 7 años')
    expect(within(acompanamientos).getByRole('link', { name: /Tomás/ })).toHaveAttribute(
      'href',
      '/proyectos/p-tomas',
    )
    // Ya no existen las tarjetas fijas de ejemplo
    for (const nombre of ['Familia', 'Escuela', 'Profesionales'])
      expect(within(acompanamientos).queryByText(nombre)).not.toBeInTheDocument()
  })

  it('muestra los tres próximos eventos de todos los niños, ordenados por fecha', async () => {
    abrir()
    const eventos = screen.getByRole('region', { name: 'Próximos eventos' })
    await within(eventos).findByText('Reunión con la docente')
    const titulos = within(eventos)
      .getAllByRole('link')
      .filter((enlace) => enlace.getAttribute('href').includes('/calendario?fecha='))
      .map((enlace) => enlace.textContent)
    expect(titulos).toHaveLength(3)
    expect(titulos[0]).toContain('Reunión con la docente')
    expect(titulos[0]).toContain('10:00 – 11:00 · Tomás')
    expect(titulos[1]).toContain('Sesión de fono')
    expect(titulos[1]).toContain('Luli')
    expect(titulos[2]).toContain('Reunión familiar')
    expect(within(eventos).queryByText('Acto escolar')).not.toBeInTheDocument()
    expect(within(eventos).getByRole('link', { name: /Reunión con la docente/ })).toHaveAttribute(
      'href',
      `/proyectos/p-tomas/calendario?fecha=${sumarDias(hoy, 1)}`,
    )
    expect(listarEventos).toHaveBeenCalledWith('p-luz', expect.objectContaining({ desde: hoy, hasta: sumarDias(hoy, 30) }))
  })

  it('sin niños invita a crear un acompañamiento y avisa que no hay eventos', async () => {
    vi.mocked(obtenerMisProyectos).mockResolvedValue([])
    abrir()
    expect(await screen.findByText('Todavía no acompañás a ningún niño.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Crear acompañamiento' })).toHaveAttribute(
      'href',
      '/acompanamientos/nuevo',
    )
    expect(screen.getByText('No hay eventos en los próximos 30 días.')).toBeVisible()
  })

  it('si falla la carga lo avisa y permite reintentar', async () => {
    vi.mocked(obtenerMisProyectos).mockRejectedValueOnce(new Error('caído'))
    const user = userEvent.setup()
    abrir()
    const acompanamientos = screen.getByRole('region', { name: 'Tus acompañamientos' })
    await user.click(await within(acompanamientos).findByRole('button', { name: 'Reintentar' }))
    expect(await within(acompanamientos).findByRole('link', { name: /Luli/ })).toBeVisible()
    expect(obtenerMisProyectos).toHaveBeenCalledTimes(2)
  })

  it('si falla el calendario de un niño, muestra los eventos de los demás', async () => {
    vi.mocked(listarEventos).mockImplementation(async (id) => {
      if (id === 'p-tomas') throw new Error('sin acceso')
      return eventosPorProyecto[id]
    })
    abrir()
    const eventos = screen.getByRole('region', { name: 'Próximos eventos' })
    expect(await within(eventos).findByText('Sesión de fono')).toBeVisible()
    expect(within(eventos).queryByText('Reunión con la docente')).not.toBeInTheDocument()
  })

  it('Recursos aparece como Próximamente, sin enlaces que no llevan a nada', () => {
    abrir()
    const recursos = screen.getByRole('region', { name: 'Recursos' })
    expect(within(recursos).getByText('Próximamente')).toBeVisible()
    expect(within(recursos).getByText('Guías y materiales')).toBeVisible()
    expect(within(recursos).queryAllByRole('link')).toHaveLength(0)
  })

  it('abre la agenda del usuario desde el sidebar y permite volver', async () => {
    const user = userEvent.setup()
    abrir()
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(
      within(nav).getByRole('link', { name: 'Acompañamientos' }),
    ).toHaveAttribute('aria-current', 'page')
    within(nav).getByRole('link', { name: 'Calendario' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { name: 'Calendario', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Agenda del usuario autenticado')).toBeInTheDocument()
    expect(
      within(nav).getByRole('link', { name: 'Calendario' }),
    ).toHaveAttribute('aria-current', 'page')
    // El logo está en la barra del celular y en el menú lateral: los dos van a Inicio
    await user.click(screen.getAllByRole('link', { name: 'TRAMA · Inicio' })[0])
    expect(screen.queryByText('Agenda del usuario autenticado')).not.toBeInTheDocument()
  })

  it('con el calendario abierto no pide el resumen de Inicio', () => {
    abrir('/inicio?seccion=calendario')
    expect(screen.getByText('Agenda del usuario autenticado')).toBeInTheDocument()
    expect(obtenerMisProyectos).not.toHaveBeenCalled()
  })

  it('Ver calendario abre la agenda del usuario', async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(screen.getByRole('link', { name: 'Ver calendario' }))
    expect(screen.getByText('Agenda del usuario autenticado')).toBeInTheDocument()
  })

  it.each([
    ['recursos', 'Recursos'],
    ['guias', 'Recursos'],
    ['estrategias', 'Recursos'],
    ['comunidad', 'Recursos'],
    ['calendario', 'Calendario'],
  ])('marca una única opción activa para %s', (seccion, opcion) => {
    abrir(`/inicio?seccion=${seccion}`)
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(within(nav).getByRole('link', { name: opcion })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(nav).getAllByRole('link', { current: 'page' })).toHaveLength(
      1,
    )
  })

  it('Recursos desde el menú avisa que todavía no está disponible', () => {
    abrir('/inicio?seccion=recursos')
    expect(screen.getByRole('heading', { name: 'Recursos · Próximamente' })).toHaveFocus()
  })

  it('enlaza el sidebar y Ver todos a Acompañamientos, y Mi perfil a su página', () => {
    abrir()
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(
      within(nav).getByRole('link', { name: 'Acompañamientos', exact: true }),
    ).toHaveAttribute('href', '/acompanamientos')
    expect(within(nav).getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/perfil')
    expect(
      within(screen.getByRole('region', { name: 'Tus acompañamientos' })).getByRole('link', {
        name: 'Ver todos los acompañamientos',
      }),
    ).toHaveAttribute('href', '/acompanamientos')
  })

  it('en el celular el menú se abre con la hamburguesa y se cierra con la X, Escape o al elegir', async () => {
    const user = userEvent.setup()
    abrir()
    const hamburguesa = screen.getByRole('button', { name: 'Abrir menú' })
    const menu = document.getElementById('menu-principal')
    expect(hamburguesa).toHaveAttribute('aria-controls', 'menu-principal')
    expect(hamburguesa).toHaveAttribute('aria-expanded', 'false')
    expect(menu).toHaveClass('hidden')

    await user.click(hamburguesa)
    expect(hamburguesa).toHaveAttribute('aria-expanded', 'true')
    expect(menu).not.toHaveClass('hidden')
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Cerrar menú' }))
    expect(menu).toHaveClass('hidden')
    expect(hamburguesa).toHaveFocus()

    await user.click(hamburguesa)
    await user.keyboard('{Escape}')
    expect(menu).toHaveClass('hidden')
    expect(hamburguesa).toHaveFocus()

    await user.click(hamburguesa)
    await user.click(within(menu).getByRole('link', { name: 'Recursos' }))
    expect(menu).toHaveClass('hidden')
    expect(screen.getByRole('heading', { name: 'Recursos · Próximamente' })).toBeInTheDocument()
  })

  it('reutiliza el cierre de sesión desde el único botón del sidebar', async () => {
    const user = userEvent.setup()
    const { cerrarSesion } = abrir()
    const boton = screen.getByRole('button', { name: 'Cerrar sesión' })
    expect(boton).toHaveAttribute('type', 'button')
    expect(boton.textContent).toBe('')
    expect(boton.querySelector('img')).toHaveAttribute(
      'src',
      '/assets/branding/cerrar sesion.png',
    )
    expect(boton.querySelector('img')).toHaveAttribute('alt', '')
    await user.click(boton)
    expect(cerrarSesion).toHaveBeenCalledTimes(1)
    expect(cerrarSesion).toHaveBeenCalledWith()
  })

  it('permite cerrar sesión al pulsar la imagen completa o usar el teclado', async () => {
    const user = userEvent.setup()
    const { cerrarSesion } = abrir()
    const boton = screen.getByRole('button', { name: 'Cerrar sesión' })
    await user.click(boton.querySelector('img'))
    expect(cerrarSesion).toHaveBeenCalledTimes(1)
    boton.focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(cerrarSesion).toHaveBeenCalledTimes(3)
  })

  it.each(['no-existe', '__proto__', 'constructor'])(
    'ignora una sección desconocida: %s',
    (seccion) => {
      abrir(`/inicio?seccion=${seccion}`)
      expect(
        screen.queryByText('Este espacio todavía no está disponible.'),
      ).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Hola, Nora.',
      )
    },
  )
})
