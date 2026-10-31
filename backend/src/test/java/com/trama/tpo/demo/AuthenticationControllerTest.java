package com.trama.tpo.demo;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.EmailService;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthenticationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // El registro manda un código por mail: en los tests no hay SMTP.
    @MockBean
    private EmailService emailService;

    // Simula que la persona ya confirmó el código del mail.
    private void verificar(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email).orElseThrow();
        usuario.setEmailVerificado(true);
        usuarioRepository.save(usuario);
    }

    // Emails de los usuarios creados durante cada test
    private final List<String> emailsDePrueba = new ArrayList<>();

    // Generar un email diferente para cada ejecución
    private String nuevoEmail() {
        String email = "ana.test." + UUID.randomUUID()
                + "@example.com";

        emailsDePrueba.add(email);

        return email;
    }

    // Eliminar los usuarios creados al terminar cada test
    @AfterEach
    void limpiarUsuariosDePrueba() {

        for (String email : emailsDePrueba) {

            usuarioRepository.findByEmail(email)
                    .ifPresent(usuarioRepository::delete);
        }

        emailsDePrueba.clear();
    }

    // TEST 1: REGISTRO EXITOSO
    @Test
    void registroExitoso() throws Exception {

        String email = nuevoEmail();

        String usuario = """
            {
                "tipoCuenta": "FAMILIA",
                "nombre": "Ana",
                "apellido": "Prueba",
                "email": "%s",
                "password": "Prueba123!"
            }
            """.formatted(email);

        mockMvc.perform(post("/api/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(usuario))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.verificacionPendiente").value(true))
                .andExpect(jsonPath("$.access_token").isEmpty());
    }

    // TEST 2: EMAIL DUPLICADO
    @Test
    void registroConEmailDuplicado() throws Exception {

        String email = nuevoEmail();

        String usuario = """
            {
                "tipoCuenta": "FAMILIA",
                "nombre": "Ana",
                "apellido": "Prueba",
                "email": "%s",
                "password": "Prueba123!"
            }
            """.formatted(email);

        // Primer registro: debe funcionar
        mockMvc.perform(post("/api/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(usuario))
                .andExpect(status().isCreated());

        // Segundo registro: mismo email
        mockMvc.perform(post("/api/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(usuario))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo")
                        .value("EMAIL_EN_USO"));
    }

    // TEST 3: CONTRASEÑA DÉBIL
    @Test
    void registroConPasswordDebil() throws Exception {

        String email = nuevoEmail();

        String usuario = """
            {
                "tipoCuenta": "FAMILIA",
                "nombre": "Ana",
                "apellido": "Prueba",
                "email": "%s",
                "password": "abc123"
            }
            """.formatted(email);

        mockMvc.perform(post("/api/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(usuario))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo")
                        .value("DATOS_INVALIDOS"));
    }

    // TEST 4: LOGIN EXITOSO
    @Test
    void loginExitoso() throws Exception {

        String email = nuevoEmail();

        String registro = """
            {
                "tipoCuenta": "FAMILIA",
                "nombre": "Ana",
                "apellido": "Prueba",
                "email": "%s",
                "password": "Prueba123!"
            }
            """.formatted(email);

        String login = """
            {
                "email": "%s",
                "password": "Prueba123!"
            }
            """.formatted(email);

        // Crear usuario
        mockMvc.perform(post("/api/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registro))
                .andExpect(status().isCreated());
        verificar(email);

        // Iniciar sesión
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(login))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.access_token").isNotEmpty())
                .andExpect(jsonPath("$.nombre").value("Ana"))
                .andExpect(jsonPath("$.apellido").value("Prueba"))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.id").isNotEmpty());
    }

    // TEST 5: CONTRASEÑA INCORRECTA
    @Test
    void loginConPasswordIncorrecta() throws Exception {

        String email = nuevoEmail();

        String registro = """
            {
                "tipoCuenta": "FAMILIA",
                "nombre": "Ana",
                "apellido": "Prueba",
                "email": "%s",
                "password": "Prueba123!"
            }
            """.formatted(email);

        String login = """
            {
                "email": "%s",
                "password": "Incorrecta123!"
            }
            """.formatted(email);

        // Registrar usuario
        mockMvc.perform(post("/api/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registro))
                .andExpect(status().isCreated());

        // Intentar login con contraseña incorrecta
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(login))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje")
                        .value("Email o contraseña inválidos"));
    }

    // TEST 6: EMAIL INEXISTENTE
    @Test
    void loginConEmailInexistente() throws Exception {

        String email = nuevoEmail();

        String login = """
            {
                "email": "%s",
                "password": "Prueba123!"
            }
            """.formatted(email);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(login))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje")
                        .value("Email o contraseña inválidos"));
    }

    // TEST 7: OBTENER PERFIL CON TOKEN VÁLIDO
    @Test
    void obtenerMiPerfilConTokenValido() throws Exception {

        String email = nuevoEmail();

        String registro = """
            {
                "tipoCuenta": "FAMILIA",
                "nombre": "Ana",
                "apellido": "Prueba",
                "email": "%s",
                "password": "Prueba123!"
            }
            """.formatted(email);

        // Registrar usuario, confirmar el email e iniciar sesión
        mockMvc.perform(
                post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registro))
                .andExpect(status().isCreated());
        verificar(email);

        MvcResult resultado = mockMvc.perform(
                post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Prueba123!\"}"))
                .andExpect(status().isOk())
                .andReturn();

        String respuesta = resultado.getResponse()
                .getContentAsString();

        String token = objectMapper.readTree(respuesta)
                .get("access_token")
                .asText();

        // Consultar perfil autenticado
        mockMvc.perform(get("/api/auth/yo")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.nombre").value("Ana"))
                .andExpect(jsonPath("$.apellido").value("Prueba"))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    // TEST 8: OBTENER PERFIL SIN TOKEN
    @Test
    void obtenerMiPerfilSinToken() throws Exception {

        mockMvc.perform(get("/api/auth/yo"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.codigo")
                        .value("NO_AUTENTICADO"))
                .andExpect(jsonPath("$.mensaje")
                        .value("Debés iniciar sesión"));
    }

    // TEST 9: RUTA DE PROYECTO SIN TOKEN
    @Test
    void rutaDeProyectoSinTokenDevuelve401() throws Exception {

        mockMvc.perform(get("/api/proyectos/" + UUID.randomUUID()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.codigo")
                        .value("NO_AUTENTICADO"));
    }
}