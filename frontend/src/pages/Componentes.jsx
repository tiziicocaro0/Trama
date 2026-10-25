import { useState } from 'react';
import { Aviso } from '../components/ui/Aviso';
import Boton from '../components/ui/Boton.jsx';
import Campo from '../components/ui/Campo.jsx';
import CampoContrasena from '../components/ui/CampoContrasena.jsx';
import CampoFormulario from '../components/ui/CampoFormulario.jsx';
import { Cargando } from '../components/ui/Cargando';
import { Modal } from '../components/ui/Modal';
import { Selector } from '../components/ui/Selector';
import { Tarjeta } from '../components/ui/Tarjeta';
const COLORES_PALETA = [
  {
    nombre: 'Crema',
    token: '--color-crema',
    clase: 'bg-crema text-oliva border border-oliva/20',
  },
  { nombre: 'Terracota', token: '--color-terracota', clase: 'bg-terracota text-crema' },
  { nombre: 'Oliva', token: '--color-oliva', clase: 'bg-oliva text-crema' },
  { nombre: 'Agua', token: '--color-agua', clase: 'bg-agua text-crema' },
  { nombre: 'Miel', token: '--color-miel', clase: 'bg-miel text-crema' },
];
const OPCIONES_ROL = [
  { valor: 'madre', etiqueta: 'Madre / Padre' },
  { valor: 'docente', etiqueta: 'Docente' },
  { valor: 'acompanante', etiqueta: 'Acompañante' },
];
export function Componentes() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [clave, setClave] = useState('');
  const [rol, setRol] = useState('madre');
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <header>
        <h1 className="font-display text-4xl text-terracota">
          Catálogo de componentes UI
        </h1>
        <p className="mt-1 font-sans text-base text-oliva/80">
          Demostración de la paleta oficial y componentes base de TRAMA (solo
          visible en desarrollo).
        </p>
      </header>

      <Tarjeta titulo="Paleta de colores oficial">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {COLORES_PALETA.map((c) => (
            <div
              key={c.nombre}
              className={`flex flex-col items-center justify-center rounded-2xl p-4 text-center ${c.clase}`}
            >
              <span className="font-display text-lg">{c.nombre}</span>
              <span className="font-sans text-xs opacity-90">{c.token}</span>
            </div>
          ))}
        </div>
      </Tarjeta>

      <Tarjeta titulo="Botones">
        <div className="flex flex-wrap items-center gap-4">
          <Boton>Botón primario</Boton>
          <Boton variant="secondary">Botón secundario</Boton>
          <Boton disabled>Deshabilitado</Boton>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Campos y selectores">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CampoFormulario
            id="vitrina-nombre"
            label="Nombre completo"
            hint="Como querés que te vean en el espacio compartido."
          >
            <Campo
              placeholder="Ej. Zoe García"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </CampoFormulario>
          <CampoFormulario
            id="vitrina-error"
            label="Campo con error"
            error="Ingresá un correo electrónico válido."
          >
            <Campo placeholder="correo@ejemplo.com" defaultValue="correo-invalido" />
          </CampoFormulario>
          <CampoFormulario id="vitrina-clave" label="Contraseña">
            <CampoContrasena
              placeholder="Ingresá tu contraseña"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
            />
          </CampoFormulario>
          <Selector
            etiqueta="Rol en el acompañamiento"
            opciones={OPCIONES_ROL}
            value={rol}
            onChange={(e) => setRol(e.target.value)}
          />
        </div>
      </Tarjeta>

      <Tarjeta titulo="Avisos">
        <div className="flex flex-col gap-3">
          <Aviso tipo="info">
            Información: podés invitar a nuevas personas al equipo.
          </Aviso>
          <Aviso tipo="exito">¡Listo! Guardamos tu aporte correctamente.</Aviso>
          <Aviso tipo="alerta">
            Revisá los permisos de visibilidad antes de publicar.
          </Aviso>
          <Aviso tipo="error">
            No pudimos conectar con el servidor. Intentá nuevamente.
          </Aviso>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Modal e indicador de carga">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Boton onClick={() => setModalAbierto(true)}>
            Abrir modal de prueba
          </Boton>
          <Cargando mensaje="Cargando acompañamientos…" />
        </div>
        <Modal
          abierto={modalAbierto}
          titulo="Confirmar acción"
          onCerrar={() => setModalAbierto(false)}
        >
          <p className="mb-6">
            Este es un ejemplo del componente Modal utilizando únicamente las
            clases del tema.
          </p>
          <div className="flex justify-end gap-3">
            <Boton variant="secondary" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Boton>
            <Boton onClick={() => setModalAbierto(false)}>Aceptar</Boton>
          </div>
        </Modal>
      </Tarjeta>
    </div>
  );
}
export default Componentes;
