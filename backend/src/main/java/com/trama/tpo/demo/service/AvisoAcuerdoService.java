package com.trama.tpo.demo.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.trama.tpo.demo.entity.evento.Acuerdo;
import com.trama.tpo.demo.entity.notificacion.TipoNotificacion;
import com.trama.tpo.demo.repository.AcuerdoRepository;

/**
 * Avisa al responsable cuando un acuerdo vence sin cumplirse (5.6).
 * Corre una vez por día; avisado_en evita avisar dos veces el mismo acuerdo.
 */
@Service
public class AvisoAcuerdoService {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");

    private final AcuerdoRepository acuerdoRepository;
    private final NotificacionService notificacionService;

    public AvisoAcuerdoService(
            AcuerdoRepository acuerdoRepository,
            NotificacionService notificacionService) {

        this.acuerdoRepository = acuerdoRepository;
        this.notificacionService = notificacionService;
    }

    // Todos los días a las 8 (hora de Argentina). Devuelve cuántos avisó, para los tests.
    @Scheduled(cron = "0 0 8 * * *", zone = "America/Argentina/Buenos_Aires")
    @Transactional
    public int avisarVencidos() {

        LocalDate hoy = LocalDate.now(ZONA);
        List<Acuerdo> vencidos = acuerdoRepository
                .findByCumplidoFalseAndFechaRevisionBeforeAndAvisadoEnIsNull(hoy);

        for (Acuerdo acuerdo : vencidos) {

            UUID proyectoId = acuerdo.getReunion().getProyecto().getId();

            // Sin el texto del acuerdo: las notificaciones y los mails no llevan contenido sensible
            notificacionService.notificar(
                    List.of(acuerdo.getResponsable().getId()),
                    proyectoId,
                    TipoNotificacion.ACUERDO_VENCIDO.name(),
                    "Venció un acuerdo a tu cargo y todavía no está cumplido",
                    "/proyectos/" + proyectoId + "/calendario");

            acuerdo.setAvisadoEn(Instant.now());
        }

        return vencidos.size();
    }
}
