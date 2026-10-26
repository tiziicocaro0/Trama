import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  obtenerMisProyectos,
} from '../api/proyectos.js';
import { PROYECTOS_MOCK } from '../api/proyectos.mock.js';
import { useAuth } from './useAuth.js';

const MAPA_ROLES = {
  TUTOR: 'TUTOR',
  'tutor/a': 'TUTOR',
  madre: 'TUTOR',
  padre: 'TUTOR',
  'tutora administradora': 'TUTOR',
  'tutor administrador': 'TUTOR',
  FAMILIAR: 'FAMILIAR',
  familiar: 'FAMILIAR',
  abuela: 'FAMILIAR',
  abuelo: 'FAMILIAR',
  SALUD: 'SALUD',
  salud: 'SALUD',
  terapeuta: 'SALUD',
  EDUCACION: 'EDUCACION',
  educación: 'EDUCACION',
  educacion: 'EDUCACION',
  docente: 'EDUCACION',
};

export function normalizarRolProyecto(rol) {
  if (!rol || typeof rol !== 'string') return null;
  const limpio = rol.trim();
  return (
    MAPA_ROLES[limpio] ??
    MAPA_ROLES[limpio.toLocaleLowerCase('es')] ??
    limpio.toUpperCase()
  );
}

export function obtenerItemsMenuPorRol(proyectoActual, rolCodigo, esAdmin) {
  if (!proyectoActual?.id) return [];
  const base = `/proyectos/${proyectoActual.id}`;
  const items = [
    {
      ruta: `${base}/red`,
      etiqueta: 'Red de acompañamiento',
      icono: 'acompanamientos',
    },
  ];

  if (esAdmin) {
    items.push({
      ruta: `${base}/red?invitar=1`,
      etiqueta: 'Invitar',
      icono: 'invitar',
    });
  }

  if (['TUTOR', 'SALUD', 'EDUCACION'].includes(rolCodigo)) {
    items.push({
      ruta: `${base}/datos-personales`,
      etiqueta: 'Datos y notas',
      icono: 'recursos',
    });
  }

  if (['TUTOR', 'EDUCACION'].includes(rolCodigo)) {
    items.push({
      ruta: `${base}/secciones/ESCUELA`,
      etiqueta: 'Escuela',
      icono: 'recursos',
    });
  }

  if (['TUTOR', 'SALUD'].includes(rolCodigo)) {
    items.push({
      ruta: `${base}/secciones/TERAPIAS`,
      etiqueta: 'Terapias',
      icono: 'calendario',
    });
  }

  return items;
}

function extraerProyectoIdDeRuta(pathname, paramId) {
  if (paramId && paramId !== 'nuevo') return paramId;
  const coincidencia = pathname?.match(/^\/proyectos\/([^/]+)/);
  if (coincidencia && coincidencia[1] !== 'nuevo') {
    return decodeURIComponent(coincidencia[1]);
  }
  return null;
}

export function useProyectoActual() {
  const { usuario } = useAuth();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [proyectos, setProyectos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [idElegidoManual, setIdElegidoManual] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    obtenerMisProyectos(controller.signal)
      .then((lista) => {
        if (!controller.signal.aborted) {
          setProyectos(lista);
          setCargando(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setProyectos(PROYECTOS_MOCK);
          setCargando(false);
          }
      });

    return () => controller.abort();
  }, [usuario?.id]);

  const idEnRuta = extraerProyectoIdDeRuta(location.pathname, params.id);

  const proyectoActual = useMemo(() => {
    if (!proyectos.length) return null;
    const idBuscado = idEnRuta ?? idElegidoManual;
    if (idBuscado) {
      const encontrado = proyectos.find((item) => item.id === idBuscado);
      if (encontrado) return encontrado;
    }
    return proyectos[0];
  }, [proyectos, idEnRuta, idElegidoManual]);

  const rol = proyectoActual?.rol ?? null;
  const rolCodigo = normalizarRolProyecto(rol);
  const esAdmin = useMemo(() => {
    if (!proyectoActual) return false;
    if (typeof proyectoActual.esAdmin === 'boolean') {
      return proyectoActual.esAdmin;
    }
    return rolCodigo === 'TUTOR';
  }, [proyectoActual, rolCodigo]);

  const cambiarProyecto = useCallback(
    (nuevoProyectoId) => {
      if (!nuevoProyectoId) return;
      setIdElegidoManual(nuevoProyectoId);
      navigate(`/proyectos/${nuevoProyectoId}`);
    },
    [navigate],
  );

  return {
    proyectos,
    proyecto: proyectoActual,
    proyectoActual,
    rol,
    rolCodigo,
    esAdmin,
    cargando,
    cambiarProyecto,
  };
}

export default useProyectoActual;
