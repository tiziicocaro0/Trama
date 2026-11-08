package com.trama.tpo.demo.service;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.notificacion.TipoNotificacion;
import com.trama.tpo.demo.repository.MembresiaRepository;

import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AvisoMencionService {

    // Detecta menciones con @, evitando interpretar
    // como menciones las partes de una dirección de email.
    private static final Pattern INICIO_MENCION =
            Pattern.compile("(?<![\\p{L}\\p{N}._-])@");

    private final MembresiaRepository membresiaRepository;
    private final NotificacionService notificacionService;

    public AvisoMencionService(
            MembresiaRepository membresiaRepository,
            NotificacionService notificacionService) {

        this.membresiaRepository = membresiaRepository;
        this.notificacionService = notificacionService;
    }

    // NOTIFICAR A LOS MIEMBROS MENCIONADOS EN UN COMENTARIO
    public void notificarMenciones(
            Aporte aporte,
            UUID autorComentarioId,
            String texto) {

        if (texto == null || !texto.contains("@")) {
            return;
        }

        UUID proyectoId = aporte.getProyecto().getId();

        // Buscar únicamente integrantes de este proyecto.
        List<Membresia> miembros =
                membresiaRepository.findByProyectoId(proyectoId);

        // Asociar nombres y nombres completos con sus usuarios.
        Map<String, List<Membresia>> aliases = new HashMap<>();

        for (Membresia membresia : miembros) {

            String nombre = membresia.getUsuario().getNombre();
            String apellido = membresia.getUsuario().getApellido();

            agregarAlias(aliases, nombre, membresia);
            agregarAlias(aliases, nombre + " " + apellido, membresia);
        }

        // Priorizar el nombre completo:
        // @María Pérez antes que @María.
        List<String> nombresOrdenados = aliases.keySet().stream()
                .sorted(Comparator.comparingInt(String::length).reversed())
                .toList();

        // El Set evita notificaciones duplicadas.
        Set<UUID> destinatarios = new LinkedHashSet<>();

        Matcher matcher = INICIO_MENCION.matcher(texto);

        while (matcher.find()) {

            String resto = normalizar(
                    texto.substring(matcher.end())
            );

            for (String nombre : nombresOrdenados) {

                if (!resto.startsWith(nombre)
                        || !terminaNombre(resto, nombre.length())) {
                    continue;
                }

                List<Membresia> coincidencias = aliases.get(nombre);

                // Si varias personas tienen el mismo nombre,
                // no seleccionar ninguna arbitrariamente.
                if (coincidencias.size() == 1) {

                    Membresia destinatario = coincidencias.get(0);

                    UUID usuarioId =
                            destinatario.getUsuario().getId();

                    // No notificar al autor del comentario.
                    // Verificar que el mencionado pueda ver el aporte.
                    if (!usuarioId.equals(autorComentarioId)
                            && puedeVerAporte(destinatario, aporte)) {

                        destinatarios.add(usuarioId);
                    }
                }

                // Se encontró la coincidencia más larga.
                break;
            }
        }

        if (destinatarios.isEmpty()) {
            return;
        }

        // No incluir el contenido privado del comentario:
        // las notificaciones también pueden enviarse por email.
        notificacionService.notificar(
                new ArrayList<>(destinatarios),
                proyectoId,
                TipoNotificacion.MENCION.name(),
                "Te mencionaron en un comentario.",
                "/proyectos/" + proyectoId
        );
    }

    // REGISTRAR UN NOMBRE POSIBLE PARA UNA MENCIÓN
    private static void agregarAlias(
            Map<String, List<Membresia>> aliases,
            String nombre,
            Membresia membresia) {

        if (nombre == null) {
            return;
        }

        String alias = normalizar(nombre);

        if (alias.isBlank()) {
            return;
        }

        List<Membresia> coincidencias =
                aliases.computeIfAbsent(
                        alias,
                        clave -> new ArrayList<>()
                );

        if (!coincidencias.contains(membresia)) {
            coincidencias.add(membresia);
        }
    }

    // NORMALIZAR NOMBRES PARA COMPARARLOS
    // Ignora diferencias de mayúsculas y tildes.
    private static String normalizar(String texto) {

        return Normalizer.normalize(
                        texto.trim().replaceAll("\\s+", " "),
                        Normalizer.Form.NFD
                )
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
    }

    // EVITAR COINCIDENCIAS PARCIALES
    // Por ejemplo, @Ana no debe coincidir con @Anabel.
    private static boolean terminaNombre(
            String texto,
            int posicion) {

        if (posicion >= texto.length()) {
            return true;
        }

        char siguiente = texto.charAt(posicion);

        return !Character.isLetterOrDigit(siguiente)
                && siguiente != '_'
                && siguiente != '-';
    }

    // COMPROBAR SI EL MENCIONADO PUEDE VER EL APORTE
    private static boolean puedeVerAporte(
            Membresia membresia,
            Aporte aporte) {

        // Respetar las visibilidades permitidas para cada rol.
        if (!PermisoService
                .visibilidadesPermitidas(membresia.getRol())
                .contains(aporte.getVisibilidad())) {

            return false;
        }

        // Los familiares necesitan autorización para ver
        // las notas profesionales.
        if (aporte.getTipo() == TipoAporte.NOTA_PROFESIONAL
                && membresia.getRol() == Rol.FAMILIAR
                && !Boolean.TRUE.equals(
                        aporte.getProyecto().getFamiliarVeNotas())) {

            return false;
        }

        return true;
    }
}
