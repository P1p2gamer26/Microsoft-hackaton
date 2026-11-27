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

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityAndTenantIsolationTest {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper mapper;

    private String login(String email) throws Exception {
        String body = "{\"email\":\"" + email + "\",\"password\":\"Demo2026!\"}";
        String resp = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(resp).get("token").asText();
    }

    @Test
    void enforcesAuthRbacAndCrossCompanyIsolation() throws Exception {
        // 1. Unauthenticated blocked
        mvc.perform(get("/api/v1/inventory")).andExpect(status().isForbidden());

        // 2. Viewer cannot create products (403)
        String viewerToken = login("visualizador@cordillera-demo.co");
        mvc.perform(get("/api/v1/inventory").header("Authorization", "Bearer " + viewerToken))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/inventory/products")
                        .header("Authorization", "Bearer " + viewerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"TEST-1\",\"commercialName\":\"Blocked\",\"unitPriceUsdKg\":10}"))
                .andExpect(status().isForbidden());

        // 3. Company 1 cannot read Company 2 inventory or orders (Tenant isolation!)
        String exp1Token = login("exportador@cordillera-demo.co");
        String exp2Token = login("exportador@sierraverde-demo.co");

        String inv1 = mvc.perform(get("/api/v1/inventory").header("Authorization", "Bearer " + exp1Token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String inv2 = mvc.perform(get("/api/v1/inventory").header("Authorization", "Bearer " + exp2Token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

        JsonNode products1 = mapper.readTree(inv1).get("products");
        JsonNode products2 = mapper.readTree(inv2).get("products");
        assertTrue(products1.size() >= 3);
        assertEquals(1, products2.size());
        long cid1 = products1.get(0).get("companyId").asLong();
        long cid2 = products2.get(0).get("companyId").asLong();
        assertNotEquals(cid1, cid2);

        // Company 1 explicitly requesting Company 2's ID must fail with 403!
        mvc.perform(get("/api/v1/inventory?companyId=" + cid2)
                        .header("Authorization", "Bearer " + exp1Token))
                .andExpect(status().isForbidden());
    }
}
