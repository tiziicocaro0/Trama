package com.trama.tpo.demo.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.trama.tpo.demo.entity.archivo.Archivo;
import com.trama.tpo.demo.entity.dto.ProyectoResponse;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.notificacion.TipoNotificacion;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.ArchivoRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

/**
 * 8.2: el tutor administrador programa la eliminación del perfil del niño. Hay 7 días de gracia
 * para cancelarla; después una tarea diaria lo borra con todo lo que la red cargó.
 */
@Service
public class EliminacionProyectoService {

    public static final int DIAS_DE_GRACIA = 7;
    private static final Logger log = LoggerFactory.getLogger(EliminacionProyectoService.class);
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy")
            .withZone(ZoneId.of("America/Argentina/Buenos_Aires"));

    private final ProyectoRepository proyectoRepository;
    private final MembresiaRepository membresiaRepository;
    private final ArchivoRepository archivoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;
    private final NotificacionService notificacionService;
    private final RegistroAccionService registroAccionService;
    private final Path directorioArchivos;

    public EliminacionProyectoService(
            ProyectoRepository proyectoRepository,
            MembresiaRepository membresiaRepository,
            ArchivoRepository archivoRepository,
            UsuarioRepository usuarioRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual,
            NotificacionService notificacionService,
            RegistroAccionService registroAccionService,
            @Value("${trama.archivos.directorio:./uploads}") String rutaDirectorio) {

        this.proyectoRepository = proyectoRepository;
        this.membresiaRepository = membresiaRepository;
        this.archivoRepository = archivoRepository;
        this.usuarioRepository = usuarioRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
        this.notificacionService = notificacionService;
        this.registroAccionService = registroAccionService;
        this.directorioArchivos = Paths.get(rutaDirectorio).toAbsolutePath().normalize();
    }

    @Transactional
    public ProyectoResponse programar(UUID proyectoId) {
        permisoService.verificarAdmin(proyectoId);
        Proyecto proyecto = buscar(proyectoId);

        if (proyecto.getEliminacionProgramada() != null) {
            throw new ApiException("ELIMINACION_YA_PROGRAMADA",
                    "La eliminación de este perfil ya está programada", HttpStatus.CONFLICT);
        }

        Instant cuando = Instant.now().plus(DIAS_DE_GRACIA, ChronoUnit.DAYS);
        proyecto.setEliminacionProgramada(cuando);
        proyectoRepository.save(proyecto);

        UUID usuarioId = usuarioActual.obtenerId();
        registroAccionService.registrar(usuarioId, proyectoId, AccionRegistro.ELIMINAR, "PROYECTO");
        avisarALaRed(proyectoId, usuarioId,
                " programó la eliminación de un acompañamiento: se borra el " + FECHA.format(cuando) + ".");

        return respuesta(proyecto);
    }

    @Transactional
    public ProyectoResponse cancelar(UUID proyectoId) {
        permisoService.verificarAdmin(proyectoId);
        Proyecto proyecto = buscar(proyectoId);

        if (proyecto.getEliminacionProgramada() == null) {
            throw new ApiException("ELIMINACION_NO_PROGRAMADA",
                    "Este perfil no tiene una eliminación programada", HttpStatus.CONFLICT);
        }

        proyecto.setEliminacionProgramada(null);
        proyectoRepository.save(proyecto);

        avisarALaRed(proyectoId, usuarioActual.obtenerId(),
                " canceló la eliminación de un acompañamiento: sigue como estaba.");

        return respuesta(proyecto);
    }

    // Todos los días a las 3:00 (Argentina) borra los perfiles con el plazo cumplido.
    @Scheduled(cron = "0 0 3 * * *", zone = "America/Argentina/Buenos_Aires")
    @Transactional
    public int borrarVencidos() {
        List<Proyecto> vencidos = proyectoRepository.findByEliminacionProgramadaBefore(Instant.now());
        for (Proyecto proyecto : vencidos) {
            // Los archivos viven cifrados en disco: se borran después de confirmar el borrado en la base
            List<String> rutas = archivoRepository.findByProyectoId(proyecto.getId()).stream()
                    .map(Archivo::getRuta)
                    .toList();
            proyectoRepository.borrarDefinitivamente(proyecto.getId());
            despuesDelCommit(() -> rutas.forEach(this::borrarDelDisco));
        }
        if (!vencidos.isEmpty()) {
            log.info("Se borraron {} perfiles con la eliminación programada vencida", vencidos.size());
        }
        return vencidos.size();
    }

    private void avisarALaRed(UUID proyectoId, UUID autorId, String accion) {
        String autor = usuarioRepository.findById(autorId)
                .map(u -> ((u.getNombre() == null ? "" : u.getNombre()) + " "
                        + (u.getApellido() == null ? "" : u.getApellido())).trim())
                .filter(nombre -> !nombre.isEmpty())
                .orElse("Un tutor");
        List<UUID> red = membresiaRepository.findByProyectoId(proyectoId).stream()
                .map(Membresia::getUsuario)
                .map(Usuario::getId)
                .filter(id -> !id.equals(autorId))
                .toList();
        // Sin el nombre del niño: el aviso también puede salir por mail
        notificacionService.notificar(red, proyectoId, TipoNotificacion.ELIMINACION_PERFIL.name(),
                autor + accion, "/proyectos/" + proyectoId);
    }

    private Proyecto buscar(UUID proyectoId) {
        return proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ApiException("PROYECTO_NO_ENCONTRADO",
                        "No encontramos este proyecto", HttpStatus.NOT_FOUND));
    }

    private ProyectoResponse respuesta(Proyecto proyecto) {
        // Solo el tutor administrador llega hasta acá
        return ProyectoResponse.from(proyecto, true, false);
    }

    private void borrarDelDisco(String ruta) {
        try {
            Files.deleteIfExists(directorioArchivos.resolve(ruta).normalize());
        } catch (IOException e) {
            log.warn("No se pudo borrar un archivo de un perfil eliminado: {}", e.getMessage());
        }
    }

    private static void despuesDelCommit(Runnable accion) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    accion.run();
                }
            });
        } else {
            accion.run();
        }
    }
}
