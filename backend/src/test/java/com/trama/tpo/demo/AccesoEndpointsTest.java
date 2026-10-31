package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.dto.*;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.EmailService;

/**
 * 0.21: nadie fuera de la red del niño puede usar ningún endpoint de su proyecto.
 * Los endpoints se descubren leyendo los mapeos de Spring: los nuevos quedan cubiertos solos.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "trama.invitaciones.url-base=https://trama.example/invitacion")
class AccesoEndpointsTest {

    private static final String PREFIJO = "/api/proyectos/{proyectoId}";
    private static final String NOMBRE_DEL_NINO = "NinoAcceso021";

    /**
     * Un cuerpo válido por cada DTO: si no, la validación responde 400 antes de llegar al
     * control de permisos y el test no probaría nada. Si se crea un endpoint con un DTO nuevo,
     * hay que agregar su ejemplo acá (el test falla y lo avisa).
     */
    private static final Map<Class<?>, String> CUERPOS = Map.of(
            AporteRequest.class, """
                    {"tipo":"FORTALEZA","titulo":"Prueba","contenido":"Texto de prueba",
                     "datos":"{\\"contexto\\":\\"ESCUELA\\"}","visibilidad":"TODOS"}""",
            InvitacionRequest.class, """
                    {"email":"alguien@example.com","rol":"FAMILIAR"}""",
            ConfiguracionProyectoRequest.class, """
                    {"familiarPuedeCargar":true,"familiarVeNotas":false}""",
            ActualizarDatosProyectoRequest.class, """
                    {"nombre":"Otro","apellido":"Nombre","fechaNacimiento":"2017-01-01",
                     "escuela":"Escuela de prueba","grado":"3.º grado"}""",
            EspecialidadRequest.class, """
                    {"especialidades":[{"especialidad":"DOCENTE_PRIMARIO"}]}""",
            EventoRequest.class, """
                    {"titulo":"Prueba","fecha":"2026-11-05","horaInicio":"10:00","horaFin":"11:00"}""");

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping mapeos;

    // Para no mandar mails reales si alguna invitación llegara a pasar
    @MockBean private EmailService emailService;

    private Usuario tutora;
    private Usuario familiar;
    private Usuario ajeno;
    private Membresia membresiaTutora;
    private Membresia membresiaFamiliar;
    private Proyecto proyecto;

    private record Endpoint(HttpMethod metodo, String ruta, HandlerMethod handler) {
        @Override
        public String toString() {
            return metodo + " " + ruta;
        }
    }

    @BeforeEach
    void prepararDatos() {
        tutora = crearUsuario("Tutora");
        familiar = crearUsuario("Familiar");
        ajeno = crearUsuario("Ajeno");
        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre(NOMBRE_DEL_NINO).apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba").grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());
        membresiaTutora = crearMembresia(tutora, Rol.TUTOR, true);
        membresiaFamiliar = crearMembresia(familiar, Rol.FAMILIAR, false);
    }

    @AfterEach
    void limpiarDatos() {
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutora, familiar, ajeno));
    }

    // Si la búsqueda de rutas fallara, los demás tests pasarían sin probar nada
    @Test
    void descubreLosEndpointsDeProyecto() {
        assertThat(endpointsDeProyecto())
                .hasSizeGreaterThanOrEqualTo(16)
                .extracting(Endpoint::toString)
                .contains(
                        "GET " + PREFIJO,
                        "GET " + PREFIJO + "/aportes",
                        "POST " + PREFIJO + "/invitaciones",
                        "DELETE " + PREFIJO + "/miembros/{miembroId}",
                        "POST " + PREFIJO + "/archivos");
    }

    @Test
    void alguienAjenoRecibe403EnTodos() throws Exception {
        List<String> fallas = new ArrayList<>();

        for (Endpoint endpoint : endpointsDeProyecto()) {
            MvcResult r = mockMvc.perform(pedido(endpoint).header("Authorization", token(ajeno)))
                    .andReturn();
            String cuerpo = r.getResponse().getContentAsString();

            if (r.getResponse().getStatus() != 403) {
                fallas.add(endpoint + " → respondió " + r.getResponse().getStatus());
            } else if (!cuerpo.contains("ACCESO_DENEGADO") || cuerpo.contains(NOMBRE_DEL_NINO)) {
                fallas.add(endpoint + " → respondió 403 pero con datos o sin el código ACCESO_DENEGADO");
            }
        }

        assertThat(fallas).as("Endpoints que no rechazan a alguien ajeno al proyecto").isEmpty();
    }

    // Control: si el 403 del ajeno viniera de un pedido mal armado, la tutora también lo recibiría
    @Test
    void laTutoraSiPuedeLeerElProyecto() throws Exception {
        List<String> fallas = new ArrayList<>();

        for (Endpoint endpoint : endpointsDeProyecto()) {
            if (endpoint.metodo() != HttpMethod.GET) {
                continue;
            }
            int estado = mockMvc.perform(pedido(endpoint).header("Authorization", token(tutora)))
                    .andReturn().getResponse().getStatus();
            if (estado == 401 || estado == 403) {
                fallas.add(endpoint + " → respondió " + estado);
            }
        }

        assertThat(fallas).as("Endpoints de lectura que rechazan a la propia tutora").isEmpty();
    }

    @Test
    void sinTokenRecibe401EnTodos() throws Exception {
        List<String> fallas = new ArrayList<>();

        for (Endpoint endpoint : endpointsDeProyecto()) {
            int estado = mockMvc.perform(pedido(endpoint)).andReturn().getResponse().getStatus();
            if (estado != 401) {
                fallas.add(endpoint + " → respondió " + estado);
            }
        }

        assertThat(fallas).as("Endpoints que no piden sesión").isEmpty();
    }

    @Test
    void unFamiliarNoPuedeUsarEndpointsDeAdministrador() throws Exception {
        String id = proyecto.getId().toString();
        List<MockHttpServletRequestBuilder> deAdministrador = List.of(
                json(HttpMethod.POST, "/api/proyectos/" + id + "/invitaciones", InvitacionRequest.class),
                request(HttpMethod.DELETE, "/api/proyectos/" + id + "/miembros/" + membresiaTutora.getId()),
                request(HttpMethod.PUT, "/api/proyectos/" + id + "/miembros/" + membresiaFamiliar.getId() + "/co-tutor"),
                json(HttpMethod.PUT, "/api/proyectos/" + id + "/configuracion", ConfiguracionProyectoRequest.class),
                json(HttpMethod.PUT, "/api/proyectos/" + id, ActualizarDatosProyectoRequest.class));

        List<String> fallas = new ArrayList<>();
        for (MockHttpServletRequestBuilder pedido : deAdministrador) {
            MvcResult r = mockMvc.perform(pedido.header("Authorization", token(familiar))).andReturn();
            if (r.getResponse().getStatus() != 403) {
                fallas.add(r.getRequest().getMethod() + " " + r.getRequest().getRequestURI()
                        + " → respondió " + r.getResponse().getStatus());
            }
        }

        assertThat(fallas).as("Endpoints de administrador que un familiar puede usar").isEmpty();
    }

    // ---------- Descubrimiento y armado de pedidos ----------

    private List<Endpoint> endpointsDeProyecto() {
        List<Endpoint> endpoints = new ArrayList<>();
        mapeos.getHandlerMethods().forEach((RequestMappingInfo info, HandlerMethod handler) -> {
            for (String ruta : info.getPatternValues()) {
                if (!ruta.startsWith(PREFIJO)) {
                    continue;
                }
                var metodos = info.getMethodsCondition().getMethods();
                if (metodos.isEmpty()) {
                    endpoints.add(new Endpoint(HttpMethod.GET, ruta, handler));
                }
                metodos.forEach(m -> endpoints.add(new Endpoint(HttpMethod.valueOf(m.name()), ruta, handler)));
            }
        });
        return endpoints;
    }

    // Pone el proyecto real y un UUID cualquiera en los demás ids de la ruta
    private MockHttpServletRequestBuilder pedido(Endpoint endpoint) {
        String url = endpoint.ruta()
                .replace("{proyectoId}", proyecto.getId().toString())
                .replaceAll("\\{[^}]+}", UUID.randomUUID().toString());

        for (MethodParameter parametro : endpoint.handler().getMethodParameters()) {
            if (MultipartFile.class.equals(parametro.getParameterType())) {
                return multipart(endpoint.metodo(), url).file(new MockMultipartFile(
                        "archivo", "prueba.pdf", "application/pdf", "%PDF-1.4 prueba".getBytes()));
            }
            if (parametro.hasParameterAnnotation(RequestBody.class)) {
                return json(endpoint.metodo(), url, parametro.getParameterType());
            }
        }
        return request(endpoint.metodo(), url);
    }

    private MockHttpServletRequestBuilder json(HttpMethod metodo, String url, Class<?> tipo) {
        String cuerpo = CUERPOS.get(tipo);
        if (cuerpo == null) {
            fail("Agregá un ejemplo de cuerpo para " + tipo.getSimpleName()
                    + " en AccesoEndpointsTest.CUERPOS (lo usa " + metodo + " " + url + ")");
        }
        return request(metodo, url).contentType(MediaType.APPLICATION_JSON).content(cuerpo);
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre).apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private Membresia crearMembresia(Usuario usuario, Rol rol, boolean esAdmin) {
        return membresiaRepository.save(Membresia.builder()
                .usuario(usuario).proyecto(proyecto).rol(rol).esAdmin(esAdmin)
                .build());
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
