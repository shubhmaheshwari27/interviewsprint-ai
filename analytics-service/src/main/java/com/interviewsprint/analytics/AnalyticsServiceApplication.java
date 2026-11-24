package com.interviewsprint.analytics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Stateless analytics service for InterviewSprint AI.
 * The Next.js app sends a user's applications / screened jobs and gets the
 * summaries back. The web app falls back to its own TypeScript implementation
 * whenever this service is slow or down, so it is never a single point of failure.
 */
@SpringBootApplication
public class AnalyticsServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AnalyticsServiceApplication.class, args);
    }
}
