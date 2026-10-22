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

    /** 1.11: mail de recuperacion de contraseña, valido por 1 hora. */
    public void enviarRecuperacion(
            String destinatario,
            String enlaceRecuperacion) {

        enviarMensaje(
            destinatario,
            "Recupera tu contraseña en Trama",
            "Hola!\n\n" +
            "Recibimos un pedido para recuperar tu contraseña en Trama.\n\n" +
            "Para elegir una nueva contraseña, ingresa al siguiente enlace:\n\n" +
            enlaceRecuperacion + "\n\n" +
            "Este enlace tiene una validez de 1 hora.\n\n" +
            "Si no pediste este cambio, podes ignorar este mensaje: tu contraseña actual sigue siendo valida.\n\n" +
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
