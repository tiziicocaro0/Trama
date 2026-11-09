import { describe, expect, it } from 'vitest'
import { navegacionPara } from './navegacion.js'

const titulos = (usuario) => navegacionPara(usuario).map((item) => item.titulo)

describe('7.1: "Mi panel" en la navegación', () => {
  it('lo ve una cuenta profesional', () => {
    expect(titulos({ tipoCuenta: 'PROFESIONAL' })).toContain('Mi panel')
  })

  it('no lo ve una cuenta de familia', () => {
    const lista = titulos({ tipoCuenta: 'FAMILIA' })
    expect(lista).not.toContain('Mi panel')
    expect(lista).toContain('Acompañamientos')
  })

  it('sin sesión cargada tampoco aparece', () => {
    expect(titulos(null)).not.toContain('Mi panel')
  })
})
