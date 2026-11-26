package com.trama.tpo.demo.config;

import java.util.concurrent.Executor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SyncTaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Hilos propios para mandar mails sin frenar el pedido que los dispara (hallazgo C9 del informe de carga).
 *
 * Pocos hilos y una cola acotada: un SMTP lento o una ráfaga de registros no puede quedarse con
 * todos los hilos ni con toda la memoria. Si la cola se llena, el mail se descarta y queda en el log.
 * En los tests (trama.mail.asincrono=false) se manda en el mismo hilo, así los resultados son inmediatos.
 */
@Configuration
public class CorreoConfig {

    private static final Logger log = LoggerFactory.getLogger(CorreoConfig.class);

    static final int HILOS = 2;
    static final int CAPACIDAD_COLA = 500;

    @Bean(name = "correoExecutor")
    public Executor correoExecutor(@Value("${trama.mail.asincrono:true}") boolean asincrono) {
        if (!asincrono) {
            return new SyncTaskExecutor();
        }
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(HILOS);
        executor.setMaxPoolSize(HILOS);
        executor.setQueueCapacity(CAPACIDAD_COLA);
        executor.setThreadNamePrefix("correo-");
        // Al apagar el backend, termina los mails que ya estaban en la cola (hasta 10 s).
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);
        executor.setRejectedExecutionHandler((tarea, pool) ->
                log.warn("Cola de mails llena: se descartó un envío"));
        executor.initialize();
        return executor;
    }
}
