package com.trama.tpo.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

// Habilita las tareas programadas (@Scheduled). La primera: el aviso de acuerdos vencidos (5.6)
@Configuration
@EnableScheduling
public class TareasProgramadasConfig {
}
