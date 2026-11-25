package com.interviewsprint.analytics.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Request and response types. Field names match the TypeScript types in lib/analytics.ts and lib/market.ts. */
public final class Models {
    private Models() {}

    // ─── Analytics ─────────────────────────────────────────────────────────

    public record ApplicationInput(
            @NotBlank String applicationDate, // ISO date or date-time
            @NotBlank String status,          // APPLIED | SCREENING | INTERVIEWING | OFFER | REJECTED | WITHDRAWN
            String portal,
            @NotBlank String channel) {}

    public record AnalyticsRequest(@NotNull @Size(max = 20_000) List<@Valid ApplicationInput> applications) {}

    public record FunnelStage(String stage, int count) {}
    public record PortalStat(String portal, int applications, int responses, double responseRate) {}
    public record ChannelStat(String channel, int applications) {}
    public record DayStat(String date, int applications) {}

    public record AnalyticsSummary(
            int totalApplications,
            int responses,
            double responseRate,
            int interviews,
            int offers,
            int activeDays,
            double averagePerActiveDay,
            List<FunnelStage> funnel,
            List<PortalStat> byPortal,
            List<ChannelStat> byChannel,
            List<DayStat> perDay) {}

    // ─── Market gap ────────────────────────────────────────────────────────

    public record SignalInput(
            @NotBlank String decision, // APPLIED | SKIPPED
            @NotBlank String blocker,
            @NotBlank String expBand,
            @NotNull List<String> skills) {}

    public record MarketRequest(
            @NotNull List<String> userSkills,
            @NotNull @Size(max = 50_000) List<@Valid SignalInput> signals) {}

    public record SkillDemand(String skill, int jobs, double share, boolean have) {}
    public record LearnNext(String skill, int jobs, int skippedJobs, int onlyGapJobs) {}
    public record BlockerStat(String blocker, int jobs) {}
    public record BandStat(String band, int jobs) {}

    public record MarketSummary(
            int totalJobs,
            int applied,
            int skipped,
            List<SkillDemand> skillDemand,
            List<BlockerStat> blockers,
            List<BandStat> experienceBands,
            List<LearnNext> learnNext,
            double coverage) {}
}
