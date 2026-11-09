package com.trama.datosprueba;

import org.springframework.boot.SpringApplication;

import com.trama.tpo.demo.DemoApplication;

// Levanta TRAMA con datos ficticios, solo para desarrollo:
//   Windows:      .\scripts\datos-prueba.ps1
//   macOS/Linux:  sh scripts/datos-prueba.sh
// Usa el perfil dev más "datosprueba", que apunta a la base trama_prueba (no toca la base trama).
// Está en src/test: no entra en el jar, y el nombre no termina en Test, así que el CI no lo corre.
public class TramaConDatosDePrueba {

    public static void main(String[] args) {
        System.setProperty("spring.profiles.active", "dev,datosprueba");
        SpringApplication.from(DemoApplication::main)
                .with(CargadorDatosDePrueba.class)
                .run(args);
    }
}
