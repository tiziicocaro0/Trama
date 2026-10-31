package com.trama.tpo.demo.service;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.trama.tpo.demo.entity.notificacion.TipoNotificacion;
import com.trama.tpo.demo.entity.usuario.Usuario;

/**
 * 6.1: además de la campana, manda la notificación por mail a quien lo tenga activado.
 *
 * El mail sale después de confirmar la transacción: si algo falla antes, no se avisa de algo que
 * no pasó. Y si el servidor de correo falla, solo se registra en el log: la notificación de la
 * campana ya quedó guardada y la acción del usuario (crear una nota, invitar...) no se cae por eso.
 */
@Service
public class AvisoPorEmailService {

    private static final Logger log = LoggerFactory.getLogger(AvisoPorEmailService.class);

    private final PreferenciaNotificacionService preferenciaService;
    private final EmailService emailService;
    private final String urlApp;

    public AvisoPorEmailService(
            PreferenciaNotificacionService preferenciaService,
            EmailService emailService,
            @Value("${trama.app.url:}") String urlApp) {

        this.preferenciaService = preferenciaService;
        this.emailService = emailService;
        this.urlApp = urlApp == null ? "" : urlApp.trim().replaceAll("/+$", "");
    }

    public void avisar(List<Usuario> destinatarios, String tipo, String texto, String link) {

        TipoNotificacion tipoConocido = TipoNotificacion.desde(tipo);
        Set<UUID> conMail = preferenciaService.quierenMail(
                destinatarios.stream().map(Usuario::getId).toList(), tipoConocido);

        if (conMail.isEmpty()) {
            return;
        }

        List<String> emails = destinatarios.stream()
                .filter(usuario -> conMail.contains(usuario.getId()))
                .map(Usuario::getEmail)
                .toList();
        String enlace = urlApp.isBlank() ? null : urlApp + link;

        Runnable enviar = () -> emails.forEach(email -> enviarSinFallar(email, texto, enlace));

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    enviar.run();
                }
            });
        } else {
            enviar.run();
        }
    }

    private void enviarSinFallar(String email, String texto, String enlace) {
        try {
            emailService.enviarNotificacion(email, texto, enlace);
        } catch (RuntimeException e) {
            // Sin el email en el log: es dato personal.
            log.warn("No se pudo enviar el mail de una notificación: {}", e.getMessage());
        }
    }
}
