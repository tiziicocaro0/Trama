package com.trama.tpo.demo;

import com.trama.tpo.demo.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import static org.mockito.Mockito.*;

class EmailServiceMailpitIT {

    @Test
    @SuppressWarnings("unchecked")
    void enviarCorreoDePruebaAMailpit() {

        // Conectarse al servidor SMTP local
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost("127.0.0.1");
        sender.setPort(1025);

        sender.getJavaMailProperties().put(
            "mail.smtp.connectiontimeout", "5000"
        );

        // Preparar EmailService
        ObjectProvider<JavaMailSender> provider =
                mock(ObjectProvider.class);

        when(provider.getIfAvailable()).thenReturn(sender);

        EmailService emailService = new EmailService(
            provider,
            "no-reply@trama.test"
        );

        // Enviar una invitacion ficticia
        emailService.enviarInvitacion(
            "docente@ejemplo.test",
            "Proyecto de prueba",
            "http://localhost:5173/invitacion/token-ficticio"
        );
    }
}
