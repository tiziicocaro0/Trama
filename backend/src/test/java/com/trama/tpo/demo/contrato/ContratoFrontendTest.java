package com.trama.tpo.demo.contrato;

import static com.trama.tpo.demo.contrato.FuenteFrontend.entre;
import static com.trama.tpo.demo.contrato.FuenteFrontend.leer;
import static com.trama.tpo.demo.contrato.FuenteFrontend.nombres;
import static com.trama.tpo.demo.contrato.FuenteFrontend.numero;
import static com.trama.tpo.demo.contrato.FuenteFrontend.todasLasCoincidencias;
import static com.trama.tpo.demo.contrato.FuenteFrontend.valoresEnMayusculas;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.aporte.fortaleza.ContextoFortaleza;
import com.trama.tpo.demo.aporte.interes.CategoriaInteres;
import com.trama.tpo.demo.aporte.interes.IntensidadInteres;
import com.trama.tpo.demo.aporte.observacion.ContextoObservacion;
import com.trama.tpo.demo.aporte.observacion.EtiquetaObservacion;
import com.trama.tpo.demo.entity.dto.AporteRequest;
import com.trama.tpo.demo.entity.dto.CrearProyectoRequest;
import com.trama.tpo.demo.entity.dto.EspecialidadItemRequest;
import com.trama.tpo.demo.entity.dto.RegisterRequest;
import com.trama.tpo.demo.entity.dto.RestablecerContrasenaRequest;
import com.trama.tpo.demo.entity.membresia.Especialidad;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.service.ArchivoService;
import com.trama.tpo.demo.service.BitacoraService;

import jakarta.validation.constraints.Size;

/**
 * Contratos entre el frontend y el backend que no pasan por un endpoint:
 * valores que los dos lados repiten y que, si se separan, terminan en
 * errores 400 o en mensajes equivocados. Si un test falla, hay que
 * actualizar los dos lados en el mismo PR.
 */
class ContratoFrontendTest {

    // ---------------------------------------------------------------
    // 1. Enums: el front ofrece exactamente los valores que acepta el back
    // ---------------------------------------------------------------

    @Test
    void visibilidades() {
        Set<String> front = todasLasCoincidencias(
                Pattern.compile("value=\"([A-Z_]+)\""),
                leer("components/ui/SelectorVisibilidad.jsx"));
        assertEquals(nombres(Visibilidad.class), front);
    }

    @Test
    void roles() {
        assertEquals(nombres(Rol.class),
                valoresEnMayusculas(entre(leer("api/miembros.js"), "const ROLES", "\n")));
        assertEquals(nombres(Rol.class),
                valoresEnMayusculas(leer("features/perfil/components/ModalInvitarMiembro.jsx")));
    }

    @Test
    void especialidades() {
        Set<String> front = todasLasCoincidencias(
                Pattern.compile("valor: '([A-Z_]+)'"),
                leer("features/perfil/especialidades.js"));
        assertEquals(nombres(Especialidad.class), front);
    }

    @Test
    void contextosYEtiquetasDeObservacion() {
        String bitacora = leer("features/bitacora/bitacora.js");
        assertEquals(nombres(ContextoObservacion.class),
                valoresEnMayusculas(entre(bitacora, "CONTEXTOS_OBSERVACION", "ETIQUETAS_OBSERVACION")));
        assertEquals(nombres(EtiquetaObservacion.class),
                valoresEnMayusculas(entre(bitacora, "ETIQUETAS_OBSERVACION = [", "]\n")));
    }

    @Test
    void camposDeInteresYFortaleza() {
        String editor = leer("features/perfil/components/EditorAporte.jsx");
        assertEquals(nombres(CategoriaInteres.class),
                valoresEnMayusculas(entre(editor, "nombre: 'categoria'", "nombre: 'intensidad'")));
        assertEquals(nombres(IntensidadInteres.class),
                valoresEnMayusculas(entre(editor, "nombre: 'intensidad'", "FORTALEZA:")));
        assertEquals(nombres(ContextoFortaleza.class),
                valoresEnMayusculas(entre(editor, "nombre: 'contexto'", "function leerDatos")));
    }

    @Test
    void tiposDeAporteQueUsaElFront() {
        // El front todavía no tiene todas las secciones: alcanza con que no use tipos inexistentes.
        Set<String> front = todasLasCoincidencias(
                Pattern.compile("tipo: '([A-Z_]+)'"),
                leer("features/perfil/perfil.js"));
        assertFalse(front.isEmpty());
        assertTrue(nombres(TipoAporte.class).containsAll(front),
                "El front usa tipos de aporte que el back no conoce: " + front);
    }

    // ---------------------------------------------------------------
    // 2. Largos máximos: el formulario corta donde corta el DTO
    // ---------------------------------------------------------------

    @Test
    void largosDelRegistro() throws Exception {
        String registro = leer("features/auth/registro/components/RegistroFormulario.jsx");
        for (String campo : new String[] {"nombre", "apellido", "email"}) {
            assertEquals(maximo(RegisterRequest.class, campo),
                    numero(registro, "campo\\('" + campo + "'[\\s\\S]*?maxLength:\\s*(\\d+)"),
                    "Largo de '" + campo + "' en el registro");
        }
    }

    @Test
    void largosDeLosDatosDelNino() throws Exception {
        for (String pantalla : new String[] {
                "features/acompanamientos/NuevoAcompanamientoPage.jsx",
                "features/perfil/DatosPersonalesPage.jsx"}) {
            String codigo = leer(pantalla);
            for (String campo : new String[] {"nombre", "apellido", "apodo", "escuela", "grado"}) {
                assertEquals(maximo(CrearProyectoRequest.class, campo),
                        numero(codigo, "nombre: '" + campo + "'[^}]*?maxLength:\\s*(\\d+)"),
                        "Largo de '" + campo + "' en " + pantalla);
            }
        }
    }

    @Test
    void largosDeAportesYEspecialidades() throws Exception {
        Class<?> aporte = AporteRequest.class;
        String editor = leer("features/perfil/components/EditorAporte.jsx");
        assertEquals(maximo(aporte, "titulo"), numero(editor, "name=\"titulo\"[\\s\\S]*?maxLength=\\{(\\d+)\\}"));
        assertEquals(maximo(aporte, "contenido"), numero(editor, "name=\"contenido\"[\\s\\S]*?maxLength=\\{(\\d+)\\}"));
        assertEquals(maximo(aporte, "contenido"), numero(
                leer("features/bitacora/components/FormularioObservacion.jsx"),
                "name=\"texto\"[\\s\\S]*?maxLength=\\{(\\d+)\\}"));
        assertEquals(maximo(EspecialidadItemRequest.class, "aclaracion"),
                numero(leer("features/perfil/components/EspecialidadModal.jsx"),
                        "id=\\{aclaracionId\\}[\\s\\S]*?maxLength=\\{(\\d+)\\}"));
    }

    // ---------------------------------------------------------------
    // 3. Reglas de contraseña: las mismas en registro, restablecer y front
    // ---------------------------------------------------------------

    @Test
    void reglasDeContrasena() throws Exception {
        Set<String> registro = reglas(RegisterRequest.class);
        assertEquals(registro, reglas(RestablecerContrasenaRequest.class),
                "Registro y restablecer contraseña piden reglas distintas");

        String front = leer("features/auth/registro/validaciones.js");
        Set<String> reglasFront = todasLasCoincidencias(Pattern.compile("/(\\[[^/]+\\])/\\.test"),
                entre(front, "requisitosPassword = [", "]\n"));
        assertEquals(registro, reglasFront, "Las reglas de contraseña del front no coinciden con las del back");

        int minimo = RegisterRequest.class.getDeclaredField("password").getAnnotation(Size.class).min();
        assertEquals(minimo, numero(front, "length >= (\\d+)"));
        assertEquals(minimo, RestablecerContrasenaRequest.class
                .getDeclaredField("password").getAnnotation(Size.class).min());
    }

    // ---------------------------------------------------------------
    // 4. Códigos de error: el front solo compara códigos que el back emite
    // ---------------------------------------------------------------

    @Test
    void codigosDeErrorQueUsaElFront() throws IOException {
        Set<String> usados = todasLasCoincidencias(
                Pattern.compile("codigo\\s*===\\s*['\"]([A-Z_]+)['\"]"),
                FuenteFrontend.todoElCodigo());
        assertFalse(usados.isEmpty());

        String backend;
        try (Stream<Path> archivos = Files.walk(Path.of("src", "main", "java"))) {
            backend = archivos.filter(p -> p.toString().endsWith(".java"))
                    .map(p -> {
                        try {
                            return Files.readString(p, StandardCharsets.UTF_8);
                        } catch (IOException e) {
                            throw new UncheckedIOException(e);
                        }
                    })
                    .collect(Collectors.joining("\n"));
        }

        Set<String> inexistentes = usados.stream()
                .filter(codigo -> !backend.contains("\"" + codigo + "\""))
                .collect(Collectors.toSet());
        assertTrue(inexistentes.isEmpty(),
                "El front espera códigos de error que el back no devuelve: " + inexistentes);
    }

    // ---------------------------------------------------------------
    // 5. Otros valores compartidos
    // ---------------------------------------------------------------

    @Test
    void tamanioDePaginaDeLaBitacora() {
        assertEquals(BitacoraService.TAMANIO_PAGINA,
                numero(leer("features/bitacora/bitacora.js"), "TAMANIO_PAGINA_BITACORA\\s*=\\s*(\\d+)"));
    }

    @Test
    void tiposDeArchivoPermitidos() {
        String archivos = leer("api/archivos.js");
        Set<String> extensionesFront = todasLasCoincidencias(
                Pattern.compile("'([a-z]+)'"), entre(archivos, "EXTENSIONES_VALIDAS =", "\n"));
        assertEquals(ArchivoService.EXTENSION_A_MIME.keySet(), extensionesFront);

        Set<String> mimesFront = todasLasCoincidencias(
                Pattern.compile("'([a-z]+/[a-z]+)'"), entre(archivos, "MIMES_VALIDOS = [", "]"));
        assertTrue(mimesFront.containsAll(ArchivoService.MIMES_PERMITIDOS),
                "El front rechaza tipos de archivo que el back acepta");
    }

    // ---------------------------------------------------------------

    private static int maximo(Class<?> dto, String campo) throws NoSuchFieldException {
        Size size = dto.getDeclaredField(campo).getAnnotation(Size.class);
        assertTrue(size != null, dto.getSimpleName() + "." + campo + " no tiene @Size");
        return size.max();
    }

    private static Set<String> reglas(Class<?> dto) throws NoSuchFieldException {
        return Arrays.stream(dto.getDeclaredField("password")
                        .getAnnotationsByType(jakarta.validation.constraints.Pattern.class))
                .map(p -> p.regexp().replaceAll("^\\.\\*|\\.\\*$", ""))
                .collect(Collectors.toSet());
    }
}
