package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.*;
import java.security.SecureRandom;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import com.trama.tpo.demo.common.CifradoConverter;

class CifradoConverterTest {
    private CifradoConverter converter() {
        byte[] clave = new byte[32];
        new SecureRandom().nextBytes(clave);
        return new CifradoConverter(Base64.getEncoder().encodeToString(clave));
    }

    @Test
    void protegeYRecuperaUnicodeConUnNonceDistintoPorEscritura() {
        var converter = converter();
        String texto = "Descripción ficticia: música y dibujos 🎨";
        byte[] cifrado = converter.convertToDatabaseColumn(texto);
        assertThat(converter.convertToEntityAttribute(cifrado)).isEqualTo(texto);
        assertThat(new String(cifrado, StandardCharsets.UTF_8)).doesNotContain(texto);
        assertThat(converter.convertToDatabaseColumn(texto)).isNotEqualTo(cifrado);
        assertThat(converter.convertToEntityAttribute(converter.convertToDatabaseColumn(""))).isEmpty();
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
        assertThat(converter.convertToEntityAttribute(null)).isNull();
    }

    @Test
    void rechazaDatosManipuladosYUnaClaveDiferente() {
        var converter = converter();
        byte[] cifrado = converter.convertToDatabaseColumn("Texto ficticio");
        assertThatThrownBy(() -> converter().convertToEntityAttribute(cifrado)).isInstanceOf(IllegalStateException.class);
        cifrado[cifrado.length - 1] ^= 1;
        assertThatThrownBy(() -> converter.convertToEntityAttribute(cifrado)).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> converter.convertToEntityAttribute(new byte[4])).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void nuncaEscribeSinClaveValida() {
        for (String clave : new String[] { "", "no es base64", Base64.getEncoder().encodeToString(new byte[16]) }) {
            assertThatThrownBy(() -> new CifradoConverter(clave).convertToDatabaseColumn("Ejemplo ficticio"))
                    .isInstanceOf(IllegalStateException.class);
        }
    }
}
