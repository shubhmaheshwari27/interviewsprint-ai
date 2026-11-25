# Analytics service (Spring Boot)

A small, stateless Java 17 / Spring Boot 3 service that computes the job-hunt
analytics and market skill-gap summaries for InterviewSprint AI.

The Next.js app calls it when `ANALYTICS_SERVICE_URL` is set. Every call has a
2-second timeout and its response is validated; if the service is slow, down or
returns something unexpected, the app computes the same summary itself
(`lib/analytics.ts`, `lib/market.ts`). Both implementations are covered by the
same test cases, so the numbers match.

## Endpoints

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/v1/analytics/summary` | `{ applications: [{ applicationDate, status, portal, channel }] }` | totals, funnel, per-portal response rates, per-day counts |
| POST | `/api/v1/market/summary` | `{ userSkills: [...], signals: [{ decision, blocker, expBand, skills }] }` | skill demand, skills to learn next, skip reasons, experience bands |
| GET | `/actuator/health` | – | health check |

If `SERVICE_TOKEN` is set, `/api/**` requires the same value in the
`X-Service-Token` header (the app sends `ANALYTICS_SERVICE_TOKEN`).

## Run

```bash
cd analytics-service
mvn spring-boot:run            # http://localhost:8080
# or
docker build -t interviewsprint-analytics . && docker run -p 8080:8080 interviewsprint-analytics
```

Then start the web app with `ANALYTICS_SERVICE_URL=http://localhost:8080`.
The Analytics and Market Gap pages show "Computed by the Java analytics service"
when it answered, and "Computed in the app" when the fallback was used.

## Test

```bash
mvn verify
```
