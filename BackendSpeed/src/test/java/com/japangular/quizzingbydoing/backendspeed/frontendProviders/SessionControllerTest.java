// Place at:
// BackendSpeed/src/test/java/com/japangular/quizzingbydoing/backendspeed/frontendProviders/SessionControllerTest.java

package com.japangular.quizzingbydoing.backendspeed.frontendProviders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.japangular.quizzingbydoing.backendspeed.persistence.session.ProvisionRequest;
import com.japangular.quizzingbydoing.backendspeed.persistence.session.ProvisionResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("ci")          // in-memory SQLite, dictionary not required -> context boots cleanly
@Testcontainers
class SessionControllerTest {

  // One throwaway Postgres for the whole class. Flyway runs against it on startup.
  @Container
  static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
      // One migration hardcodes "speedquizdb", so the container's DB must use that name.
      .withDatabaseName("speedquizdb");

  @DynamicPropertySource
  static void datasourceProps(DynamicPropertyRegistry registry) {
    // The app uses custom property names (spring.datasource.postgresql.*),
    // so point both the datasource and Flyway at the container explicitly.
    registry.add("spring.datasource.postgresql.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.postgresql.username", postgres::getUsername);
    registry.add("spring.datasource.postgresql.password", postgres::getPassword);
    registry.add("spring.flyway.url", postgres::getJdbcUrl);
    registry.add("spring.flyway.user", postgres::getUsername);
    registry.add("spring.flyway.password", postgres::getPassword);
  }

  @Autowired
  MockMvc mockMvc;

  @Autowired
  ObjectMapper objectMapper;

  @Test
  void provisionThenValidate_roundTrips() throws Exception {
    // 1. Provision a session -> 201 with a token and the (sanitized) name.
    String body = objectMapper.writeValueAsString(new ProvisionRequest("Akira"));

    String responseJson = mockMvc.perform(post("/session/provision")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.displayName", is("Akira")))
        .andExpect(jsonPath("$.token", notNullValue()))
        .andReturn().getResponse().getContentAsString();

    UUID token = objectMapper.readValue(responseJson, ProvisionResponse.class).getToken();

    // 2. Validate that token via the header -> 200 with the same name.
    mockMvc.perform(get("/session/validate")
            .header("X-Session-Token", token.toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.displayName", is("Akira")));
  }

  @Test
  void provision_rejectsDisplayNameWithIllegalCharacters() throws Exception {
    // "@" is outside the SAFE_NAME pattern ^[\w\- ]{1,30}$ -> 400.
    String body = objectMapper.writeValueAsString(new ProvisionRequest("bad@name"));

    mockMvc.perform(post("/session/provision")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body))
        .andExpect(status().isBadRequest());
  }

  @Test
  void validate_withoutToken_isUnauthorized() throws Exception {
    mockMvc.perform(get("/session/validate"))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void validate_withMalformedToken_isBadRequest() throws Exception {
    mockMvc.perform(get("/session/validate")
            .header("X-Session-Token", "not-a-uuid"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void validate_withUnknownToken_isNotFound() throws Exception {
    mockMvc.perform(get("/session/validate")
            .header("X-Session-Token", UUID.randomUUID().toString()))
        .andExpect(status().isNotFound());
  }
}