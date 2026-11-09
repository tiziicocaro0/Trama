package com.trama.datosprueba;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.springframework.boot.SpringApplication;

import com.trama.tpo.demo.DemoApplication;

// Levanta TRAMA con datos ficticios, solo para desarrollo:
//   Windows:      .\datos-prueba.cmd
//   macOS/Linux:  sh scripts/datos-prueba.sh
// Usa el perfil dev más "datosprueba", que apunta a la base trama_prueba (no toca la base trama).
// Está en src/test: no entra en el jar, y el nombre no termina en Test, así que el CI no lo corre.
public class TramaConDatosDePrueba {

    public static void main(String[] args) {
        // Con las cuentas @trama.test los mails van a Mailpit; con cuentas reales en el .env, salen por Gmail
        String perfiles = hayCuentasReales() ? "dev,datosprueba" : "dev,datosprueba,datosprueba-mailpit";
        System.setProperty("spring.profiles.active", perfiles);
        SpringApplication.from(DemoApplication::main)
                .with(CargadorDatosDePrueba.class)
                .run(args);
    }

    private static boolean hayCuentasReales() {
        if (System.getenv().keySet().stream().anyMatch(clave -> clave.startsWith("DATOS_PRUEBA_EMAIL_"))) {
            return true;
        }
        Path env = Path.of("..", ".env");
        if (!Files.exists(env)) {
            return false;
        }
        try {
            List<String> lineas = Files.readAllLines(env);
            return lineas.stream()
                    .map(String::trim)
                    .anyMatch(linea -> linea.startsWith("DATOS_PRUEBA_EMAIL_") && linea.indexOf('=') < linea.length() - 1);
        } catch (IOException e) {
            return false;
        }
    }
}
