package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.evento.Acuerdo;
import com.trama.tpo.demo.entity.evento.Evento;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.notificacion.Notificacion;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.*;
import com.trama.tpo.demo.service.AvisoAcuerdoService;

// 5.6: acuerdos con responsable y fecha de revisión
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AcuerdosTest {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");
    private static final String TEXTO = "Practicar lectura diez minutos por día";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JwtService jwtService;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private EventoRepository eventoRepository;
    @Autowired private AcuerdoRepository acuerdoRepository;
    @Autowired private NotificacionRepository notificacionRepository;
    @Autowired private AvisoAcuerdoService avisoAcuerdoService;

    private Usuario tutora;
    private Usuario familiar;
    private Usuario docente;
    private Usuario ajeno;
    private Proyecto proyecto;
    private Evento reunion;
    private Evento eventoComun;

    @BeforeEach
    void prepararDatos() {
        tutora = crearUsuario("Tutora");
        familiar = crearUsuario("Familiar");
        docente = crearUsuario("Docente");
        ajeno = crearUsuario("Ajeno");
        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño").apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba").grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .familiarPuedeCargar(false)
                .build());
        crearMembresia(tutora, Rol.TUTOR, true);
        crearMembresia(familiar, Rol.FAMILIAR, false);
        crearMembresia(docente, Rol.EDUCACION, false);
        reunion = crearEvento("REUNION");
        eventoComun = crearEvento("COMUN");
    }

    @AfterEach
    void limpiarDatos() {
        // Al borrar el proyecto, la base borra sus eventos, acuerdos, notificaciones y registros (V4, V5)
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutora, familiar, docente, ajeno));
    }

    // CRITERIO 1: en una reunión cargo acuerdos con responsable y fecha de revisión
    @Test
    void laDocenteCargaUnAcuerdoYApareceEnLaReunion() throws Exception {
        crear(docente, reunion.getId(), familiar.getId(), LocalDate.now(ZONA).plusDays(7))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.descripcion").value(TEXTO))
                .andExpect(jsonPath("$.responsableNombre").value("Familiar Prueba"))
                .andExpect(jsonPath("$.cumplido").value(false))
                .andExpect(jsonPath("$.vencido").value(false));

        mockMvc.perform(get(rutaAcuerdos() + "?reunionId=" + reunion.getId()).header("Authorization", token(familiar)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].puedeEditar").value(false))
                .andExpect(jsonPath("$[0].puedeMarcarCumplido").value(true));
    }

    // AGENTS.md: el texto libre sobre el niño se guarda cifrado
    @Test
    void laDescripcionQuedaCifradaEnLaBase() throws Exception {
        UUID id = crearYObtenerId(docente, familiar, LocalDate.now(ZONA).plusDays(7));

        byte[] enLaBase = jdbcTemplate.queryForObject(
                "SELECT descripcion FROM acuerdo WHERE id = UUID_TO_BIN(?)", byte[].class, id.toString());

        assertThat(new String(enLaBase, StandardCharsets.ISO_8859_1)).doesNotContain("lectura");
    }

    @Test
    void enUnEventoComunNoSeCarganAcuerdos() throws Exception {
        crear(docente, eventoComun.getId(), familiar.getId(), LocalDate.now(ZONA).plusDays(7))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("NO_ES_REUNION"));
    }

    @Test
    void elResponsableTieneQueSerDelEquipo() throws Exception {
        crear(docente, reunion.getId(), ajeno.getId(), LocalDate.now(ZONA).plusDays(7))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("RESPONSABLE_NO_ES_MIEMBRO"));
    }

    // Acceso denegado
    @Test
    void sinPermisoDeCargaOAjenoRecibe403() throws Exception {
        crear(familiar, reunion.getId(), familiar.getId(), LocalDate.now(ZONA).plusDays(7))
                .andExpect(status().isForbidden());

        mockMvc.perform(get(rutaAcuerdos() + "?reunionId=" + reunion.getId()).header("Authorization", token(ajeno)))
                .andExpect(status().isForbidden());
    }

    // CRITERIO 2: puedo marcar un acuerdo como cumplido (el responsable, aunque no pueda cargar)
    @Test
    void elResponsableLoMarcaComoCumplido() throws Exception {
        UUID id = crearYObtenerId(docente, familiar, LocalDate.now(ZONA).plusDays(7));

        marcarCumplido(familiar, id)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cumplido").value(true));
    }

    @Test
    void soloElResponsableOUnTutorLoMarcan() throws Exception {
        UUID id = crearYObtenerId(tutora, familiar, LocalDate.now(ZONA).plusDays(7));

        marcarCumplido(docente, id).andExpect(status().isForbidden());
        marcarCumplido(tutora, id).andExpect(status().isOk());
    }

    // CRITERIO 3: si vence sin cumplirse, el responsable recibe un aviso (una sola vez)
    @Test
    void unAcuerdoVencidoAvisaAlResponsableUnaSolaVez() throws Exception {
        UUID id = crearYObtenerId(docente, familiar, LocalDate.now(ZONA).plusDays(7));
        vencer(id);

        avisoAcuerdoService.avisarVencidos();
        avisoAcuerdoService.avisarVencidos();

        List<Notificacion> avisos = avisosDe(familiar);
        assertThat(avisos).hasSize(1);
        assertThat(avisos.get(0).getTexto()).doesNotContain("lectura");
        assertThat(acuerdoRepository.findById(id).orElseThrow().getAvisadoEn()).isNotNull();
    }

    @Test
    void cumplidoOConFechaFuturaNoAvisa() throws Exception {
        UUID cumplido = crearYObtenerId(docente, familiar, LocalDate.now(ZONA).plusDays(7));
        marcarCumplido(familiar, cumplido).andExpect(status().isOk());
        vencer(cumplido);
        crearYObtenerId(docente, familiar, LocalDate.now(ZONA).plusDays(7));

        avisoAcuerdoService.avisarVencidos();

        assertThat(avisosDe(familiar)).isEmpty();
    }

    @Test
    void cambiarLaFechaVuelveAHabilitarElAviso() throws Exception {
        UUID id = crearYObtenerId(docente, familiar, LocalDate.now(ZONA).plusDays(7));
        vencer(id);
        avisoAcuerdoService.avisarVencidos();

        mockMvc.perform(put(rutaAcuerdos() + "/" + id)
                        .header("Authorization", token(docente))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo(reunion.getId(), familiar.getId(), LocalDate.now(ZONA).plusDays(3))))
                .andExpect(status().isOk());

        assertThat(acuerdoRepository.findById(id).orElseThrow().getAvisadoEn()).isNull();
    }

    // Una reunión con acuerdos no puede pasar a ser un evento común
    @Test
    void unaReunionConAcuerdosNoPasaAComun() throws Exception {
        String comoComun = """
                {"titulo":"Reunión","fecha":"%s","horaInicio":"10:00","horaFin":"11:00","tipo":"COMUN"}"""
                .formatted(reunion.getFecha());

        crearYObtenerId(docente, familiar, LocalDate.now(ZONA).plusDays(7));

        mockMvc.perform(put("/api/proyectos/" + proyecto.getId() + "/eventos/" + reunion.getId())
                        .header("Authorization", token(tutora))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(comoComun))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("REUNION_CON_ACUERDOS"));
    }

    @Test
    void unaReunionSinAcuerdosSiPuedePasarAComun() throws Exception {
        String comoComun = """
                {"titulo":"Reunión","fecha":"%s","horaInicio":"10:00","horaFin":"11:00","tipo":"COMUN"}"""
                .formatted(reunion.getFecha());

        mockMvc.perform(put("/api/proyectos/" + proyecto.getId() + "/eventos/" + reunion.getId())
                        .header("Authorization", token(tutora))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(comoComun))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("COMUN"));
    }

    // ---------- Datos de prueba ----------

    private ResultActions crear(Usuario autor, UUID reunionId, UUID responsableId, LocalDate fecha) throws Exception {
        return mockMvc.perform(post(rutaAcuerdos())
                .header("Authorization", token(autor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(cuerpo(reunionId, responsableId, fecha)));
    }

    private UUID crearYObtenerId(Usuario autor, Usuario responsable, LocalDate fecha) throws Exception {
        String json = crear(autor, reunion.getId(), responsable.getId(), fecha)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(objectMapper.readTree(json).get("id").asText());
    }

    private ResultActions marcarCumplido(Usuario usuario, UUID acuerdoId) throws Exception {
        return mockMvc.perform(put(rutaAcuerdos() + "/" + acuerdoId + "/cumplido")
                .header("Authorization", token(usuario))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"cumplido\":true}"));
    }

    // La API no deja poner una fecha pasada a propósito: se vence directo en la base
    private void vencer(UUID acuerdoId) {
        Acuerdo acuerdo = acuerdoRepository.findById(acuerdoId).orElseThrow();
        acuerdo.setFechaRevision(LocalDate.now(ZONA).minusDays(1));
        acuerdoRepository.save(acuerdo);
    }

    private List<Notificacion> avisosDe(Usuario usuario) {
        return notificacionRepository.findByUsuarioIdOrderByFechaDesc(usuario.getId(), PageRequest.of(0, 10))
                .stream()
                .filter(n -> "ACUERDO_VENCIDO".equals(n.getTipo()))
                .toList();
    }

    private String cuerpo(UUID reunionId, UUID responsableId, LocalDate fecha) {
        return """
                {"reunionId":"%s","descripcion":"%s","responsableId":"%s","fechaRevision":"%s"}"""
                .formatted(reunionId, TEXTO, responsableId, fecha);
    }

    private Evento crearEvento(String tipo) {
        return eventoRepository.save(Evento.builder()
                .proyecto(proyecto)
                .autor(tutora)
                .titulo(tipo.equals("REUNION") ? "Reunión de equipo" : "Acto escolar")
                .fecha(LocalDate.now(ZONA).plusDays(2))
                .horaInicio(LocalTime.of(10, 0))
                .horaFin(LocalTime.of(11, 0))
                .tipo(tipo)
                .build());
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre).apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private void crearMembresia(Usuario usuario, Rol rol, boolean esAdmin) {
        membresiaRepository.save(Membresia.builder()
                .usuario(usuario).proyecto(proyecto).rol(rol).esAdmin(esAdmin)
                .build());
    }

    private String rutaAcuerdos() {
        return "/api/proyectos/" + proyecto.getId() + "/acuerdos";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
