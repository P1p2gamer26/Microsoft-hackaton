package com.asoexport.cvb.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Cliente LLM opcional para Export Copilot.
 *
 * <p>Soporta dos formas de conectar, sin afectar el motor experto local:
 * <ul>
 *   <li><b>Ollama nativo</b> (local, sin clave, p. ej. Qwen3):
 *       {@code LLM_API_URL=http://127.0.0.1:11434}, {@code LLM_MODEL=qwen3}
 *       -> POST {base}/api/chat</li>
 *   <li><b>OpenAI-compatible</b>: {@code LLM_API_URL=https://host/v1}
 *       -> POST {base}/chat/completions con {@code Authorization: Bearer LLM_API_KEY}</li>
 * </ul>
 *
 * <p>Si no hay URL configurada o la llamada falla, devuelve vacío y el caller
 * responde solo con el motor determinístico experto (citas + descargos legales).
 */
@Service
public class LlmCopilotClient {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final boolean enabled;
    private final String apiUrl;
    private final String apiKey;
    private final String model;
    private final RestClient restClient;

    public LlmCopilotClient(
            @Value("${app.integrations.llm-enabled:false}") boolean enabled,
            @Value("${app.integrations.llm-api-url:}") String apiUrl,
            @Value("${app.integrations.llm-api-key:}") String apiKey,
            @Value("${app.integrations.llm-model:qwen3}") String model) {
        this.enabled = enabled;
        this.apiUrl = apiUrl == null ? "" : apiUrl.trim();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = (model == null || model.isBlank()) ? "qwen3" : model.trim();

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        // CPU local con Qwen3 puede tardar; esperamos generación larga antes de caer al motor experto.
        factory.setReadTimeout(Duration.ofSeconds(300));
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    /** true solo si el LLM fue activado explícitamente y además tiene URL. */
    public boolean isConfigured() {
        return enabled && !apiUrl.isBlank();
    }

    /** Modelo LLM en uso (p. ej. qwen3). */
    public String model() {
        return model;
    }

    /**
     * Pide al LLM una respuesta en español anclada a los datos/fuentes provistos.
     * Nunca lanza: ante cualquier error devuelve {@link Optional#empty()}.
     */
    public Optional<String> complete(String systemPrompt, String userPrompt) {
        if (!isConfigured()) return Optional.empty();
        try {
            boolean openAi = isOpenAiCompatible();
            String body = openAi ? callOpenAi(systemPrompt, userPrompt) : callOllama(systemPrompt, userPrompt);
            String text = extractText(body, openAi);
            if (text == null) return Optional.empty();
            text = stripThinking(text).trim();
            return text.isEmpty() ? Optional.empty() : Optional.of(text);
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private boolean isOpenAiCompatible() {
        String normalized = apiUrl.toLowerCase().replaceAll("/+$", "");
        return normalized.endsWith("/v1") || normalized.contains("/v1/");
    }

    private String callOllama(String systemPrompt, String userPrompt) {
        String base = apiUrl.replaceAll("/+$", "");
        Map<String, Object> payload = Map.of(
                "model", model,
                "stream", false,
                "think", false,
                "options", Map.of("temperature", 0.3, "num_predict", 600),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        );
        return restClient.post()
                .uri(base + "/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(String.class);
    }

    private String callOpenAi(String systemPrompt, String userPrompt) {
        String base = apiUrl.replaceAll("/+$", "");
        Map<String, Object> payload = Map.of(
                "model", model,
                "temperature", 0.3,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                )
        );
        RestClient.RequestBodySpec spec = restClient.post()
                .uri(base + "/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload);
        if (!apiKey.isBlank()) {
            spec = spec.header("Authorization", "Bearer " + apiKey);
        }
        return spec.retrieve().body(String.class);
    }

    private static String extractText(String json, boolean openAi) {
        if (json == null || json.isBlank()) return null;
        try {
            JsonNode root = MAPPER.readTree(json);
            if (openAi) {
                JsonNode choices = root.get("choices");
                if (choices != null && choices.isArray() && !choices.isEmpty()) {
                    JsonNode content = choices.get(0).path("message").path("content");
                    return content.isTextual() ? content.asText() : null;
                }
                return null;
            }
            JsonNode content = root.path("message").path("content");
            return content.isTextual() ? content.asText() : null;
        } catch (Exception ex) {
            return null;
        }
    }

    /** Qwen3 puede emitir <think>...</think>; lo removemos por seguridad. */
    private static String stripThinking(String text) {
        return text.replaceAll("(?s)<think>.*?</think>", "").trim();
    }
}
