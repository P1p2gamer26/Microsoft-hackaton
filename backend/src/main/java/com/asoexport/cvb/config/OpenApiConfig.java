package com.asoexport.cvb.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI coffeeValueBridgeOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CoffeBite API")
                        .version("1.0.0")
                        .description("API REST empresarial de trazabilidad EUDR e inteligencia comercial, geoespacial y logística para acelerar la comercialización internacional del café colombiano (ASOEXPORT).")
                        .contact(new Contact().name("ASOEXPORT - CoffeBite")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components().addSecuritySchemes("bearerAuth",
                        new SecurityScheme()
                                .name("bearerAuth")
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
