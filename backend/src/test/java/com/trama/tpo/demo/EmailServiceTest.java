package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.trama.tpo.demo.service.EmailService;

/** C9: los mails salen después del commit, en segundo plano, y un fallo del SMTP no rompe la acción. */
class EmailServiceTest {

    private JavaMailSender sender;
    private ObjectProvider<JavaMailSender> provider;
    private final List<Runnable> encolados = new ArrayList<>();
    private final Executor executorQueGuarda = encolados::add;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void preparar() {
        sender = mock(JavaMailSender.class);
        provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(sender);
    }

    @AfterEach
    void limpiarTransaccion() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void elMailSeEncolaYNoSeMandaEnElHiloDelPedido() {
        EmailService email = new EmailService(provider, "no-reply@trama.test", executorQueGuarda);

        email.enviarCodigoVerificacion("ana@trama.test", "123456", 10);

        verify(sender, never()).send(any(SimpleMailMessage.class));
        encolados.forEach(Runnable::run);
        verify(sender).send(any(SimpleMailMessage.class));
    }

    @Test
    void dentroDeUnaTransaccionSaleRecienDespuesDelCommit() {
        EmailService email = new EmailService(provider, "no-reply@trama.test", Runnable::run);
        TransactionSynchronizationManager.initSynchronization();

        email.enviarInvitacion("ana@trama.test", "compartido", "https://trama.test/invitaciones/x");

        verify(sender, never()).send(any(SimpleMailMessage.class));
        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        verify(sender).send(any(SimpleMailMessage.class));
    }

    @Test
    void siLaTransaccionNoSeConfirmaNoSaleNingunMail() {
        EmailService email = new EmailService(provider, "no-reply@trama.test", Runnable::run);
        TransactionSynchronizationManager.initSynchronization();

        email.enviarCodigoRecuperacion("ana@trama.test", "123456", 10);

        TransactionSynchronizationManager.getSynchronizations().forEach(sincronizacion ->
                sincronizacion.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
        verify(sender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void unFalloDelServidorDeCorreoNoSePropaga() {
        doThrow(new MailSendException("SMTP caído")).when(sender).send(any(SimpleMailMessage.class));
        EmailService email = new EmailService(provider, "no-reply@trama.test", Runnable::run);

        assertThatCode(() -> email.enviarNotificacion("ana@trama.test", "Novedad", null))
                .doesNotThrowAnyException();
    }

    @Test
    void sinCorreoConfiguradoNoRompeLaAccion() {
        EmailService email = new EmailService(provider, "", Runnable::run);

        assertThatCode(() -> email.enviarCodigoVerificacion("ana@trama.test", "123456", 10))
                .doesNotThrowAnyException();
        verify(sender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void siLaColaEstaLlenaElPedidoSigue() {
        Executor lleno = tarea -> { throw new RejectedExecutionException("cola llena"); };
        EmailService email = new EmailService(provider, "no-reply@trama.test", lleno);

        assertThatCode(() -> email.enviarCodigoVerificacion("ana@trama.test", "123456", 10))
                .doesNotThrowAnyException();
    }
}
