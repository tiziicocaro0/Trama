import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import cliente from '../../api/cliente.js'
import AuthContext from '../../features/auth/AuthContext.js'
import AppRoutes from '../../routes/AppRoutes.jsx'
import SubirArchivo from './SubirArchivo.jsx'
import TarjetaAporte from './TarjetaAporte.jsx'

vi.mock('../../api/cliente.js', () => ({
  default: {
    defaults: { baseURL: '/api' },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

const proyectoId = '7a1149b2-6b19-4dc0-85ef-11a72a765910'
const proyecto = {
  id: proyectoId,
  nombre: 'Mateo ficticio',
  fechaNacimiento: '2018-04-10',
  puedeCargar: true,
}

beforeEach(() => {
  cliente.get.mockReset()
  cliente.post.mockReset()
  cliente.put.mockReset()
})

describe('SubirArchivo y adjuntos en aportes (Tarea 4.3)', () => {
  it('permite subir PDF, JPG o PNG mediante el botón o arrastrar y soltar', async () => {
    const onChange = vi.fn()
    cliente.post.mockResolvedValue({
      data: {
        id: 'arch-1',
        nombreOriginal: 'informe-escolar.pdf',
        tipoMime: 'application/pdf',
        tamanoBytes: 1024,
      },
    })

    render(
      <SubirArchivo
        proyectoId={proyectoId}
        archivos={[]}
        onChange={onChange}
      />,
    )

    const archivoPdf = new File(['%PDF-1.4 contenido'], 'informe-escolar.pdf', {
      type: 'application/pdf',
    })

    const zonaDrop = screen.getByTestId('zona-soltar-archivo')
    fireEvent.drop(zonaDrop, {
      dataTransfer: { files: [archivoPdf] },
    })

    await vi.waitFor(() => {
      expect(cliente.post).toHaveBeenCalledWith(
        `/proyectos/${proyectoId}/archivos`,
        expect.any(FormData),
      )
      expect(onChange).toHaveBeenCalledWith([
        {
          id: 'arch-1',
          nombreOriginal: 'informe-escolar.pdf',
          tipoMime: 'application/pdf',
          tamanoBytes: 1024,
        },
      ])
    })
  })

  it('rechaza un archivo con formato inválido (.exe) e informa el motivo', async () => {
    const onChange = vi.fn()
    render(
      <SubirArchivo
        proyectoId={proyectoId}
        archivos={[]}
        onChange={onChange}
      />,
    )

    const archivoExe = new File(['MZ'], 'instalador.exe', {
      type: 'application/octet-stream',
    })

    fireEvent.drop(screen.getByTestId('zona-soltar-archivo'), {
      dataTransfer: { files: [archivoExe] },
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Formato no permitido. Solo podés adjuntar archivos PDF, JPG o PNG.',
    )
    expect(cliente.post).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('rechaza un archivo mayor a 5 MB e informa el motivo', async () => {
    const onChange = vi.fn()
    render(
      <SubirArchivo
        proyectoId={proyectoId}
        archivos={[]}
        onChange={onChange}
      />,
    )

    const archivoGrande = new File(['%PDF'], 'pesado.pdf', {
      type: 'application/pdf',
    })
    Object.defineProperty(archivoGrande, 'size', {
      value: 5 * 1024 * 1024 + 100,
    })

    fireEvent.drop(screen.getByTestId('zona-soltar-archivo'), {
      dataTransfer: { files: [archivoGrande] },
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El archivo supera el tamaño máximo permitido de 5 MB.',
    )
    expect(cliente.post).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('muestra los adjuntos como links de descarga con nombre e ícono según el tipo en TarjetaAporte', () => {
    render(
      <TarjetaAporte
        aporte={{
          id: 'ap-1',
          proyectoId,
          tipo: 'COMUNICACION',
          titulo: 'Tablero de comunicación',
          contenido: 'Pictogramas e informe de fonoaudiología',
          visibilidad: 'TODOS',
          puedeEditar: false,
          archivos: [
            {
              id: 'arch-pdf',
              nombreOriginal: 'informe-fono.pdf',
              tipoMime: 'application/pdf',
            },
            {
              id: 'arch-img',
              nombreOriginal: 'pictograma-casa.png',
              tipoMime: 'image/png',
            },
          ],
        }}
      />,
    )

    const linkPdf = screen.getByRole('link', { name: /informe-fono\.pdf/ })
    expect(linkPdf).toHaveAttribute(
      'href',
      `/api/proyectos/${proyectoId}/archivos/arch-pdf`,
    )
    expect(
      within(linkPdf).getByRole('img', { name: 'Ícono PDF' }),
    ).toBeInTheDocument()

    const linkImg = screen.getByRole('link', { name: /pictograma-casa\.png/ })
    expect(linkImg).toHaveAttribute(
      'href',
      `/api/proyectos/${proyectoId}/archivos/arch-img`,
    )
    expect(
      within(linkImg).getByRole('img', { name: 'Ícono Imagen' }),
    ).toBeInTheDocument()
  })

  it.each([
    ['comunicacion', 'COMUNICACION', 'Agregar aporte', 'Guardar aporte'],
    ['notas', 'NOTA_PROFESIONAL', 'Agregar nota', 'Guardar nota'],
  ])(
    'integra SubirArchivo en el formulario de %s y envía archivoIds al guardar',
    async (slug, tipo, textoBotonAbrir, textoBotonGuardar) => {
      let listaAportes = []
      cliente.get.mockImplementation(async (ruta) => ({
        data: ruta.endsWith('/aportes') ? listaAportes : proyecto,
      }))
      cliente.post.mockImplementation(async (ruta, body) => {
        if (ruta.endsWith('/archivos')) {
          return {
            data: {
              id: 'archivo-adjunto-1',
              nombreOriginal: 'agenda-visual.jpg',
              tipoMime: 'image/jpeg',
              tamanoBytes: 2048,
            },
          }
        }
        const creado = {
          ...body,
          id: 'aporte-creado-1',
          proyectoId,
          puedeEditar: true,
          archivos: [
            {
              id: 'archivo-adjunto-1',
              nombreOriginal: 'agenda-visual.jpg',
              tipoMime: 'image/jpeg',
            },
          ],
        }
        listaAportes = [creado]
        return { data: creado }
      })

      render(
        <MemoryRouter initialEntries={[`/proyectos/${proyectoId}/${slug}`]}>
          <AuthContext.Provider
            value={{
              usuario: { nombre: 'Tutora ficticia' },
              estado: 'autenticado',
            }}
          >
            <AppRoutes />
          </AuthContext.Provider>
        </MemoryRouter>,
      )

      await userEvent.click(
        await screen.findByRole('button', { name: textoBotonAbrir }),
      )

      expect(
        screen.getByText('Archivos adjuntos (opcional)'),
      ).toBeInTheDocument()

      const archivoJpg = new File(['imagen'], 'agenda-visual.jpg', {
        type: 'image/jpeg',
      })
      fireEvent.drop(screen.getByTestId('zona-soltar-archivo'), {
        dataTransfer: { files: [archivoJpg] },
      })

      expect(await screen.findByText('agenda-visual.jpg')).toBeInTheDocument()

      await userEvent.type(
        screen.getByRole('textbox', { name: 'Título' }),
        'Título con adjunto',
      )
      await userEvent.click(
        screen.getByRole('button', { name: textoBotonGuardar }),
      )

      expect(cliente.post).toHaveBeenCalledWith(
        `/proyectos/${proyectoId}/aportes`,
        expect.objectContaining({
          tipo,
          titulo: 'Título con adjunto',
          archivoIds: ['archivo-adjunto-1'],
        }),
      )

      expect(
        await screen.findByRole('link', { name: /agenda-visual\.jpg/ }),
      ).toBeInTheDocument()
    },
  )
})

