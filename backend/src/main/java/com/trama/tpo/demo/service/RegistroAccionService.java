package com.trama.tpo.demo.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.RegistroAccesoResponse;
import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.entity.registro.RegistroAccion;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.RegistroAccionRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

/**
 * Registra quién hizo qué, sobre qué sección y cuándo (0.2).
 * Lo llaman los demás services, dentro de su transacción: si la acción falla,
 * el registro tampoco queda, y si el registro falla, la acción no se guarda.
 * También arma el registro de accesos que ven los tutores (8.0).
 */
@Service
public class RegistroAccionService {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");
    private static final int DIAS_POR_DEFECTO = 30;

    private final RegistroAccionRepository registroAccionRepository;
    private final PermisoService permisoService;
    private final UsuarioRepository usuarioRepository;

    public RegistroAccionService(
            RegistroAccionRepository registroAccionRepository,
            PermisoService permisoService,
            UsuarioRepository usuarioRepository) {

        this.registroAccionRepository = registroAccionRepository;
        this.permisoService = permisoService;
        this.usuarioRepository = usuarioRepository;
    }

    // seccion: el tipo de aporte (FORTALEZA, INTERES…) o MIEMBROS. Nunca títulos ni contenido.
    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(UUID usuarioId, UUID proyectoId, AccionRegistro accion, String seccion) {

        registroAccionRepository.save(RegistroAccion.builder()
                .usuarioId(usuarioId)
                .proyectoId(proyectoId)
                .accion(accion)
                .seccion(seccion)
                .build());
    }

    // 8.0: "quién consultó el perfil". Una vez por persona por día, para no llenar la tabla.
    // Como registrar: va dentro de la transacción de quien lo llama.
    @Transactional(propagation = Propagation.MANDATORY)
    public void registrarVista(UUID usuarioId, UUID proyectoId) {

        Instant inicioDelDia = LocalDate.now(ZONA).atStartOfDay(ZONA).toInstant();

        if (registroAccionRepository.existsByUsuarioIdAndProyectoIdAndAccionAndFechaGreaterThanEqual(
                usuarioId, proyectoId, AccionRegistro.VER, inicioDelDia)) {
            return;
        }

        registroAccionRepository.save(RegistroAccion.builder()
                .usuarioId(usuarioId)
                .proyectoId(proyectoId)
                .accion(AccionRegistro.VER)
                .seccion("PERFIL")
                .build());
    }

    // 8.0: lo que pasó en el proyecto, para los tutores. Sin fechas: los últimos 30 días.
    @Transactional(readOnly = true)
    public List<RegistroAccesoResponse> listarAccesos(
            UUID proyectoId, LocalDate desde, LocalDate hasta, UUID usuarioId) {

        permisoService.verificarTutor(proyectoId);

        LocalDate fin = hasta != null ? hasta : LocalDate.now(ZONA);
        LocalDate inicio = desde != null ? desde : fin.minusDays(DIAS_POR_DEFECTO - 1);

        if (inicio.isAfter(fin)) {
            throw new ApiException(
                    "RANGO_INVALIDO",
                    "La fecha de inicio no puede ser posterior a la fecha de fin",
                    HttpStatus.BAD_REQUEST);
        }

        // El día "hasta" entra completo: se busca hasta las 00:00 del día siguiente
        List<RegistroAccion> registros = registroAccionRepository.buscarAccesos(
                proyectoId,
                inicio.atStartOfDay(ZONA).toInstant(),
                fin.plusDays(1).atStartOfDay(ZONA).toInstant(),
                usuarioId);

        // El nombre sale del usuario, no de la membresía: así se ve aunque ya no sea miembro
        Map<UUID, String> nombres = usuarioRepository
                .findAllById(registros.stream().map(RegistroAccion::getUsuarioId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(Usuario::getId, u -> u.getNombre() + " " + u.getApellido()));

        return registros.stream()
                .map(r -> new RegistroAccesoResponse(
                        r.getFecha(),
                        r.getUsuarioId(),
                        nombres.get(r.getUsuarioId()),
                        r.getAccion(),
                        r.getSeccion()))
                .toList();
    }
}
