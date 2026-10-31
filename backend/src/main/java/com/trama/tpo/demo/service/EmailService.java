package com.trama.tpo.demo.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String remitente;

    public EmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${trama.mail.from:}") String remitente) {

        this.mailSenderProvider = mailSenderProvider;
        this.remitente = remitente;
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

    private void enviarMensaje(
            String destinatario,
            String asunto,
            String cuerpo) {

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();

        if (mailSender == null || remitente.isBlank()) {
            throw new IllegalStateException(
                "El servicio de correo SMTP no esta configurado."
            );
        }

        SimpleMailMessage mensaje = new SimpleMailMessage();

        mensaje.setFrom(remitente);
        mensaje.setTo(destinatario);
        mensaje.setSubject(asunto);
        mensaje.setText(cuerpo);

        mailSender.send(mensaje);
    }
}
