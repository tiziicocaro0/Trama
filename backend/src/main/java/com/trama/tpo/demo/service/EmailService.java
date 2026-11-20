package com.trama.tpo.demo.service;

import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Todos los mails de TRAMA salen de acá, en segundo plano (hallazgo C9 del informe de carga):
 * - Si el pedido está dentro de una transacción, el mail sale recién después del commit:
 *   nunca se manda un código o una invitación que después no quedó guardada.
 * - Se envía en los hilos de correo (CorreoConfig): un SMTP lento no frena la respuesta
 *   ni retiene la conexión a la base.
 * - Si el envío falla, queda en el log (sin el email, que es dato personal) y la acción del
 *   usuario no se cae: el código de registro se puede reenviar y la invitación, cancelar y repetir.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String remitente;
    private final Executor correoExecutor;

    public EmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${trama.mail.from:}") String remitente,
            @Qualifier("correoExecutor") Executor correoExecutor) {

        this.mailSenderProvider = mailSenderProvider;
        this.remitente = remitente;
        this.correoExecutor = correoExecutor;
    }

    public void enviarInvitacion(
            String destinatario,
            String nombreProyecto,
            String enlaceInvitacion) {

        enviarMensaje(
            destinatario,
            "Invitacion para unirte a Trama",
            "Hola!\n\n" +
            "Te invitaron a participar en el proyecto " +
            nombreProyecto + " dentro de Trama.\n\n" +
            "Para acceder a la invitacion, ingresa al siguiente enlace:\n\n" +
            enlaceInvitacion + "\n\n" +
            "Este enlace tiene una validez de 7 dias.\n\n" +
            "Si no esperabas esta invitacion, podes ignorar este mensaje.\n\n" +
            "Equipo Trama"
        );
    }

    /** 1.11: mail con el codigo de 6 digitos para recuperar la contraseña. */
    public void enviarCodigoRecuperacion(
            String destinatario,
            String codigo,
            int minutosVigencia) {

        enviarMensaje(
            destinatario,
            "Tu codigo para recuperar la contraseña de Trama",
            "Hola!\n\n" +
            "Recibimos un pedido para recuperar tu contraseña en Trama.\n\n" +
            "Tu codigo es: " + codigo + "\n\n" +
            "Vence en " + minutosVigencia + " minutos. No lo compartas con nadie.\n\n" +
            "Si no pediste este cambio, podes ignorar este mensaje: tu contraseña actual sigue siendo valida.\n\n" +
            "Equipo Trama"
        );
    }

    /** Registro: código de 6 dígitos para confirmar el email de una cuenta nueva. */
    public void enviarCodigoVerificacion(
            String destinatario,
            String codigo,
            int minutosVigencia) {

        enviarMensaje(
            destinatario,
            "Tu codigo para activar tu cuenta de Trama",
            "Hola!\n\n" +
            "Gracias por sumarte a Trama. Para activar tu cuenta, ingresa este codigo:\n\n" +
            codigo + "\n\n" +
            "Vence en " + minutosVigencia + " minutos. No lo compartas con nadie.\n\n" +
            "Si no creaste una cuenta en Trama, podes ignorar este mensaje.\n\n" +
            "Equipo Trama"
        );
    }

    /**
     * 6.1: la misma notificación de la campana, por mail. El texto ya viene sin datos sensibles
     * (sin el nombre del niño ni contenido de aportes); el link lleva a la pantalla en TRAMA.
     */
    public void enviarNotificacion(
            String destinatario,
            String texto,
            String enlace) {

        enviarMensaje(
            destinatario,
            "Tenes una novedad en Trama",
            "Hola!\n\n" +
            texto + "\n\n" +
            (enlace == null ? "Ingresa a Trama para verla.\n\n" : "Para verla, ingresa a:\n\n" + enlace + "\n\n") +
            "Podes elegir que avisos te llegan por mail desde la campana de notificaciones de Trama.\n\n" +
            "Equipo Trama"
        );
    }

    private void enviarMensaje(
            String destinatario,
            String asunto,
            String cuerpo) {

        SimpleMailMessage mensaje = new SimpleMailMessage();

        mensaje.setFrom(remitente);
        mensaje.setTo(destinatario);
        mensaje.setSubject(asunto);
        mensaje.setText(cuerpo);

        Runnable enviar = () -> enviarSinFallar(mensaje);

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    despachar(enviar, asunto);
                }
            });
        } else {
            despachar(enviar, asunto);
        }
    }

    private void despachar(Runnable enviar, String asunto) {
        try {
            correoExecutor.execute(enviar);
        } catch (RejectedExecutionException e) {
            log.warn("No se pudo encolar el mail \"{}\": {}", asunto, e.getMessage());
        }
    }

    private void enviarSinFallar(SimpleMailMessage mensaje) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();

        if (mailSender == null || remitente.isBlank()) {
            log.error("El servicio de correo SMTP no está configurado: no se envió \"{}\"",
                    mensaje.getSubject());
            return;
        }

        try {
            mailSender.send(mensaje);
        } catch (RuntimeException e) {
            // Sin el destinatario en el log: es dato personal.
            log.warn("No se pudo enviar el mail \"{}\": {}", mensaje.getSubject(), e.getMessage());
        }
    }
}
