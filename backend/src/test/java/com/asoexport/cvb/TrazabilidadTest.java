package com.asoexport.cvb;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TrazabilidadTest {

    private static final String FINCAS = "/api/v1/trazabilidad/fincas";
    private static final String LOTES = "/api/v1/trazabilidad/lotes";
    private static final String SYNC = "/api/v1/trazabilidad/sync";

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper mapper;

    private String login(String email) throws Exception {
        String body = "{\"email\":\"" + email + "\",\"password\":\"Demo2026!\"}";
        String response = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(response).get("token").asText();
    }

    private JsonNode getJson(String url, String token) throws Exception {
        String response = mvc.perform(get(url).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(response);
    }

    private JsonNode postJson(String url, String token, String body) throws Exception {
        String response = mvc.perform(post(url)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(response);
    }

    @Test
    void listarFincasComoCumplimientoIncluyeFincaEnRiesgo() throws Exception {
        JsonNode fincas = getJson(FINCAS, login("cumplimiento@cordillera-demo.co"));

        assertTrue(fincas.isArray());
        assertEquals(6, fincas.size());

        JsonNode fincaBuscada = null;
        for (JsonNode finca : fincas) {
            if ("F-HU-004".equals(finca.path("id").asText())) {
                fincaBuscada = finca;
                break;
            }
        }
        assertNotNull(fincaBuscada, "F-HU-004 no aparece en el listado de fincas");
        assertEquals("riesgo", fincaBuscada.path("estado").asText());
    }

    @Test
    void crearLotesCalculaElEstadoSegunFincasYHumedad() throws Exception {
        String token = login("acopio@cordillera-demo.co");

        JsonNode riesgo = postJson(LOTES, token, """
                {"id":"LT-2026-9001","fincaIds":["F-HU-001","F-HU-004"],
                 "kg":1200,"humedad":11.2,"puntaje":84.0,
                 "destino":"Hamburgo, Alemania","comprador":"Nordkaffee"}
                """);
        assertEquals("LT-2026-9001", riesgo.path("id").asText());
        assertEquals("riesgo", riesgo.path("estado").asText());

        JsonNode revision = postJson(LOTES, token, """
                {"id":"LT-2026-9002","fincaIds":["F-HU-001"],
                 "kg":800,"humedad":13,"puntaje":82.0,
                 "destino":"Amberes, Bélgica","comprador":"Nordkaffee"}
                """);
        assertEquals("LT-2026-9002", revision.path("id").asText());
        assertEquals("revision", revision.path("estado").asText());

        JsonNode cumple = postJson(LOTES, token, """
                {"id":"LT-2026-9003","fincaIds":["F-HU-001","F-HU-002"],
                 "kg":950,"humedad":11,"puntaje":85.0,
                 "destino":"Nueva York, EE. UU.","comprador":"Nordkaffee"}
                """);
        assertEquals("LT-2026-9003", cumple.path("id").asText());
        assertEquals("cumple", cumple.path("estado").asText());
    }

    @Test
    void sincronizarDosVecesElMismoRegistroDevuelveCreadoYDuplicado() throws Exception {
        String token = login("acopio@cordillera-demo.co");
        String body = """
                [{"id":"SYNC-TRAZA-9001","tipo":"lote","detalle":"Lote offline prueba",
                  "fecha":"2026-10-20T08:00:00-05:00",
                  "datos":{"codigo":"LT-SYNC-9001","humedad":11.2}}]
                """;

        JsonNode primera = postJson(SYNC, token, body);
        assertTrue(primera.isArray());
        assertEquals(1, primera.size());
        assertEquals("SYNC-TRAZA-9001", primera.get(0).path("id").asText());
        assertEquals("CREADO", primera.get(0).path("estado").asText());

        JsonNode segunda = postJson(SYNC, token, body);
        assertTrue(segunda.isArray());
        assertEquals(1, segunda.size());
        assertEquals("SYNC-TRAZA-9001", segunda.get(0).path("id").asText());
        assertEquals("DUPLICADO", segunda.get(0).path("estado").asText());
    }

    @Test
    void epcisDelLoteSemillaTieneEventosYReadPointConLatitudPrimero() throws Exception {
        String token = login("acopio@cordillera-demo.co");

        JsonNode documento = getJson(LOTES + "/LT-2026-0412/epcis", token);
        JsonNode eventos = documento.path("epcisBody").path("eventList");

        assertTrue(eventos.isArray());
        assertTrue(eventos.size() > 0, "eventList está vacío");

        String readPoint = eventos.get(0).path("readPoint").path("id").asText();
        assertTrue(readPoint.startsWith("geo:1."), "readPoint inesperado: " + readPoint);
    }

    @Test
    void compradorNoPuedeCrearLotes() throws Exception {
        String token = login("comprador@nordkaffee-demo.co");

        mvc.perform(post(LOTES)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":\"LT-2026-9050\",\"fincaIds\":[\"F-HU-001\"],\"humedad\":11.2}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void fincasSinTokenRequiereAutenticacion() throws Exception {
        int estado = mvc.perform(get(FINCAS)).andReturn().getResponse().getStatus();
        assertTrue(estado == 401 || estado == 403, "Estado inesperado sin token: " + estado);
    }

    @Test
    void usuarioDeOtraEmpresaNoVeFincasDeCordillera() throws Exception {
        String token = login("exportador@sierraverde-demo.co");

        MvcResult resultado = mvc.perform(get(FINCAS).header("Authorization", "Bearer " + token))
                .andReturn();
        int estado = resultado.getResponse().getStatus();

        if (estado == 403) {
            return;
        }
        if (estado != 200) {
            fail("Estado inesperado para usuario de otra empresa: " + estado);
        }

        JsonNode fincas = mapper.readTree(resultado.getResponse().getContentAsString());
        assertTrue(fincas.isArray());
        assertEquals(0, fincas.size());
    }
}
