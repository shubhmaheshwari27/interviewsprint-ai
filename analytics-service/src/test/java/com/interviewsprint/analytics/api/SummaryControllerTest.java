package com.interviewsprint.analytics.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "service.token=test-token")
@AutoConfigureMockMvc
class SummaryControllerTest {

    @Autowired
    private MockMvc mvc;

    private static final String BODY = """
            {"applications":[
              {"applicationDate":"2026-11-10","status":"SCREENING","portal":"Email","channel":"EMAIL"},
              {"applicationDate":"2026-11-10","status":"APPLIED","portal":"Naukri","channel":"PORTAL"}
            ]}""";

    @Test
    void returnsTheAnalyticsSummary() throws Exception {
        mvc.perform(post("/api/v1/analytics/summary").header("X-Service-Token", "test-token")
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalApplications").value(2))
                .andExpect(jsonPath("$.responseRate").value(50.0))
                .andExpect(jsonPath("$.byPortal[0].portal").exists());
    }

    @Test
    void rejectsCallsWithoutTheServiceToken() throws Exception {
        mvc.perform(post("/api/v1/analytics/summary").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsInvalidPayloads() throws Exception {
        mvc.perform(post("/api/v1/analytics/summary").header("X-Service-Token", "test-token")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"applications\":[{\"status\":\"\"}]}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void healthIsOpen() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
