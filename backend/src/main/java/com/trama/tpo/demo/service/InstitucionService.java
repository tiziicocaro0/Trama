package com.trama.tpo.demo.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.AsociarProfesionalRequest;
import com.trama.tpo.demo.entity.dto.ContratarPaqueteRequest;
import com.trama.tpo.demo.entity.dto.InstitucionResponse;
import com.trama.tpo.demo.entity.dto.PaginaInstitucionResponse;
import com.trama.tpo.demo.entity.dto.PaqueteResponse;
import com.trama.tpo.demo.entity.plan.Institucion;
import com.trama.tpo.demo.entity.plan.LicenciaProfesional;
import com.trama.tpo.demo.entity.plan.MotivoCambioPaquete;
import com.trama.tpo.demo.entity.plan.Paquete;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.InstitucionRepository;
import com.trama.tpo.demo.repository.LicenciaProfesionalRepository;
import com.trama.tpo.demo.repository.PaqueteRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

/**
 * 9.2: paquetes institucionales con pago simulado.
 * Todo opera sobre la institución del usuario logueado (se busca por responsable_id), así que
 * nadie puede ver ni tocar la de otro. El responsable no recibe ningún dato de los niños.
 */
@Service
public class InstitucionService {

    private final InstitucionRepository institucionRepository;
    private final PaqueteRepository paqueteRepository;
    private final LicenciaProfesionalRepository licenciaRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioActual usuarioActual;

    public InstitucionService(
            InstitucionRepository institucionRepository,
            PaqueteRepository paqueteRepository,
            LicenciaProfesionalRepository licenciaRepository,
            UsuarioRepository usuarioRepository,
            UsuarioActual usuarioActual) {
        this.institucionRepository = institucionRepository;
        this.paqueteRepository = paqueteRepository;
        this.licenciaRepository = licenciaRepository;
        this.usuarioRepository = usuarioRepository;
        this.usuarioActual = usuarioActual;
    }

    @Transactional(readOnly = true)
    public PaginaInstitucionResponse obtenerPagina() {
        InstitucionResponse institucion = institucionRepository.findByResponsableId(usuarioActual.obtenerId())
                .map(this::respuesta)
                .orElse(null);
        List<PaqueteResponse> paquetes = paqueteRepository.findAllByOrderByPrecioAsc().stream()
                .map(PaqueteResponse::from)
                .toList();
        return new PaginaInstitucionResponse(institucion, paquetes);
    }

    @Transactional
    public InstitucionResponse contratar(ContratarPaqueteRequest request) {
        UUID usuarioId = usuarioActual.obtenerId();
        if (institucionRepository.existsByResponsableId(usuarioId)) {
            throw new ApiException("YA_ES_RESPONSABLE",
                    "Ya sos responsable de una institución", HttpStatus.CONFLICT);
        }
        Paquete paquete = paqueteRepository.findById(request.paqueteId())
                .orElseThrow(() -> new ApiException("PAQUETE_NO_ENCONTRADO",
                        "No encontramos ese paquete", HttpStatus.NOT_FOUND));

        Institucion institucion = institucionRepository.save(Institucion.builder()
                .nombre(request.nombre().trim())
                .paquete(paquete)
                .responsableId(usuarioId)
                .build());
        return respuesta(institucion);
    }

    @Transactional
    public InstitucionResponse asociar(AsociarProfesionalRequest request) {
        Institucion institucion = miInstitucion();
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        Usuario profesional = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException("EMAIL_NO_REGISTRADO",
                        "Ese email no está registrado en Trama: pedile que cree su cuenta primero",
                        HttpStatus.NOT_FOUND));

        if (licenciaRepository.existsByInstitucionIdAndUsuarioId(institucion.getId(), profesional.getId())) {
            throw new ApiException("YA_ASOCIADO",
                    "Ese profesional ya está asociado a la institución", HttpStatus.CONFLICT);
        }

        licenciaRepository.saveAndFlush(LicenciaProfesional.builder()
                .institucion(institucion)
                .usuario(profesional)
                .desde(LocalDate.now())
                .build());

        revisarCupos(institucion);
        return respuesta(institucion);
    }

    @Transactional
    public InstitucionResponse quitar(UUID licenciaId) {
        Institucion institucion = miInstitucion();
        LicenciaProfesional licencia = licenciaRepository.findByIdAndInstitucionId(licenciaId, institucion.getId())
                .orElseThrow(() -> new ApiException("LICENCIA_NO_ENCONTRADA",
                        "Ese profesional no está asociado a tu institución", HttpStatus.NOT_FOUND));
        licenciaRepository.delete(licencia);
        licenciaRepository.flush();
        return respuesta(institucion);
    }

    // 9.3: el responsable cerró el aviso de cambio de paquete.
    @Transactional
    public InstitucionResponse cerrarAviso() {
        Institucion institucion = miInstitucion();
        institucion.setAvisoPaqueteAnterior(null);
        institucion.setAvisoMotivo(null);
        return respuesta(institucionRepository.save(institucion));
    }

    // 9.3: un profesional con licencia sumó un niño (aceptó una invitación): se revisan los
    // cupos de cada institución que lo cubre.
    @Transactional
    public void revisarCuposDe(UUID profesionalId) {
        licenciaRepository.vigentesDe(profesionalId, LocalDate.now())
                .forEach(licencia -> revisarCupos(licencia.getInstitucion()));
    }

    // 9.3: si se supera el cupo de niños o de profesionales, la institución pasa sola al
    // paquete siguiente (por precio) hasta que entre. El último paquete no tiene límite.
    private void revisarCupos(Institucion institucion) {
        LocalDate hoy = LocalDate.now();
        long profesionales = licenciaRepository.contarProfesionales(institucion.getId(), hoy);
        long ninos = contarNinos(institucion.getId(), hoy);
        Paquete original = institucion.getPaquete();
        MotivoCambioPaquete motivo = motivo(original, ninos, profesionales);
        if (motivo == null) {
            return;
        }

        List<Paquete> paquetes = paqueteRepository.findAllByOrderByPrecioAsc();
        Paquete paquete = original;
        while (motivo(paquete, ninos, profesionales) != null) {
            int siguiente = indiceDe(paquetes, paquete) + 1;
            if (siguiente >= paquetes.size()) {
                break;
            }
            paquete = paquetes.get(siguiente);
        }

        institucion.setPaquete(paquete);
        institucion.setAvisoPaqueteAnterior(original.getNombre());
        institucion.setAvisoMotivo(motivo);
        institucionRepository.save(institucion);
    }

    private static MotivoCambioPaquete motivo(Paquete paquete, long ninos, long profesionales) {
        if (Paquete.supera(paquete.getCupoProfesionales(), profesionales)) {
            return MotivoCambioPaquete.PROFESIONALES;
        }
        if (Paquete.supera(paquete.getCupoNinos(), ninos)) {
            return MotivoCambioPaquete.NINOS;
        }
        return null;
    }

    private static int indiceDe(List<Paquete> paquetes, Paquete paquete) {
        for (int i = 0; i < paquetes.size(); i++) {
            if (paquetes.get(i).getId().equals(paquete.getId())) {
                return i;
            }
        }
        return paquetes.size();
    }

    private Institucion miInstitucion() {
        return institucionRepository.findByResponsableId(usuarioActual.obtenerId())
                .orElseThrow(() -> new ApiException("SIN_INSTITUCION",
                        "No sos responsable de ninguna institución", HttpStatus.NOT_FOUND));
    }

    private long contarNinos(UUID institucionId, LocalDate hoy) {
        return licenciaRepository.contarNinos(institucionId, hoy, PlanService.ROLES_PROFESIONALES);
    }

    private InstitucionResponse respuesta(Institucion institucion) {
        LocalDate hoy = LocalDate.now();
        List<InstitucionResponse.ProfesionalAsociado> profesionales =
                licenciaRepository.listarDeInstitucion(institucion.getId()).stream()
                        .map(l -> new InstitucionResponse.ProfesionalAsociado(l.getId(),
                                l.getUsuario().getNombre(), l.getUsuario().getApellido(),
                                l.getUsuario().getEmail(), l.getDesde()))
                        .toList();
        return new InstitucionResponse(institucion.getId(), institucion.getNombre(),
                PaqueteResponse.from(institucion.getPaquete()),
                contarNinos(institucion.getId(), hoy),
                licenciaRepository.contarProfesionales(institucion.getId(), hoy),
                profesionales,
                institucion.getAvisoMotivo() == null ? null
                        : new InstitucionResponse.AvisoCambioPaquete(
                                institucion.getAvisoPaqueteAnterior(), institucion.getAvisoMotivo()));
    }
}
