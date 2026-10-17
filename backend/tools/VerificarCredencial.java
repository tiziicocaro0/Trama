import com.trama.tpo.demo.config.ApplicationConfig;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.Console;
import java.nio.CharBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.DriverManager;
import java.util.Arrays;
import java.util.Locale;
import java.util.Properties;
import java.util.regex.Pattern;

/** Diagnóstico local de solo lectura: no inicia Spring, Flyway ni DataSeeder. */
class VerificarCredencial {
    public static void main(String[] args) throws Exception {
        Path raiz = Path.of(args[0]);
        PasswordEncoder encoder = new ApplicationConfig(null).passwordEncoder();

        if (args.length > 1 && args[1].equals("--comprobar-seed")) {
            String sql = Files.readString(raiz.resolve("bd/sql/datos_mock_dev.sql"));
            var matcher = Pattern.compile("SET @pass = '([^']+)';").matcher(sql);
            if (!matcher.find()) throw new IllegalStateException("No se encontró el hash del seed SQL");
            System.out.printf("Encoder: %s%nSeed SQL coincide con la contraseña ficticia documentada: %s%n",
                    encoder.getClass().getSimpleName(), encoder.matches("Trama1234!", matcher.group(1)));
            return;
        }

        Console consola = System.console();
        if (consola == null) {
            System.err.println("Ejecutá este diagnóstico en una terminal interactiva. No acepta contraseñas por argumentos ni archivos.");
            System.exit(1);
            return;
        }
        Properties entorno = new Properties();
        Path archivo = raiz.resolve(".env");
        if (Files.exists(archivo)) {
            try (var reader = Files.newBufferedReader(archivo, StandardCharsets.UTF_8)) {
                entorno.load(reader);
            }
        }
        String puerto = valor("MYSQL_PORT", "3307", entorno);
        if (!puerto.matches("[0-9]{1,5}")) throw new IllegalArgumentException("MYSQL_PORT no es válido");
        String url = "jdbc:mysql://localhost:" + puerto + "/trama";
        Properties conexion = new Properties();
        conexion.setProperty("user", "trama");
        conexion.setProperty("password", valor("MYSQL_PASSWORD", "", entorno));
        conexion.setProperty("connectTimeout", "5000");
        conexion.setProperty("socketTimeout", "5000");

        String email = consola.readLine("Email de la cuenta: ").trim().toLowerCase(Locale.ROOT);
        char[] password = consola.readPassword("Contraseña a verificar (no se muestra): ");
        if (password == null) return;
        try (var db = DriverManager.getConnection(url, conexion)) {
            db.setReadOnly(true);
            db.setAutoCommit(false);
            try (var consulta = db.prepareStatement("SELECT password_hash, intentos_fallidos, bloqueado_hasta FROM usuario WHERE email = ?")) {
                consulta.setString(1, email);
                try (var filas = consulta.executeQuery()) {
                    consola.printf("Base consultada: %s; puerto local: %s; tabla: usuario%n", db.getCatalog(), puerto);
                    if (!filas.next()) {
                        consola.printf("La cuenta no existe en esta base local.%n");
                        return;
                    }
                    String hash = filas.getString("password_hash");
                    boolean formato = hash != null && hash.matches("\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}");
                    boolean coincide = formato && encoder.matches(CharBuffer.wrap(password), hash);
                    consola.printf("Formato BCrypt completo válido: %s%nContraseña coincide: %s%nIntentos fallidos: %d%nBloqueo configurado: %s%n",
                            formato, coincide, filas.getInt("intentos_fallidos"), filas.getTimestamp("bloqueado_hasta") != null);
                    consola.printf("No se modificaron la contraseña, el contador ni los datos de la cuenta.%n");
                }
            } finally {
                db.rollback();
            }
        } catch (java.sql.SQLException error) {
            consola.printf("No se pudo consultar la base local. SQLState: %s. Revisá la conexión y MYSQL_PASSWORD.%n", error.getSQLState());
            System.exit(1);
        } finally {
            Arrays.fill(password, '\0');
        }
    }

    private static String valor(String nombre, String defecto, Properties entorno) {
        String valor = System.getenv(nombre);
        return valor == null ? entorno.getProperty(nombre, defecto) : valor;
    }
}
