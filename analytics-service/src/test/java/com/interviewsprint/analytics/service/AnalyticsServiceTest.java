package com.interviewsprint.analytics.service;

import com.interviewsprint.analytics.model.Models.*;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AnalyticsServiceTest {

    private final AnalyticsService service = new AnalyticsService();

    private static ApplicationInput app(String date, String status, String portal) {
        return new ApplicationInput(date + "T00:00:00.000Z", status, portal, "PORTAL");
    }

    @Test
    void emptyInputGivesZeros() {
        AnalyticsSummary s = service.summarize(List.of());
        assertThat(s.totalApplications()).isZero();
        assertThat(s.responseRate()).isZero();
        assertThat(s.averagePerActiveDay()).isZero();
        assertThat(s.perDay()).isEmpty();
    }

    @Test
    void countsFunnelAndRatesLikeTheTypeScriptVersion() {
        AnalyticsSummary s = service.summarize(List.of(
                app("2026-11-10", "APPLIED", "Naukri"),
                app("2026-11-10", "SCREENING", "Naukri"),
                app("2026-11-11", "REJECTED", "Email"),
                app("2026-11-11", "INTERVIEWING", "LinkedIn"),
                app("2026-11-12", "OFFER", "LinkedIn"),
                app("2026-11-12", "WITHDRAWN", "Wellfound")));

        assertThat(s.totalApplications()).isEqualTo(6);
        assertThat(s.responses()).isEqualTo(4);
        assertThat(s.responseRate()).isEqualTo(66.7);
        assertThat(s.interviews()).isEqualTo(2);
        assertThat(s.offers()).isEqualTo(1);
        assertThat(s.funnel()).extracting(FunnelStage::count).containsExactly(6, 4, 2, 1);
        assertThat(s.activeDays()).isEqualTo(3);
        assertThat(s.averagePerActiveDay()).isEqualTo(2.0);
    }

    @Test
    void groupsByPortalAndSortsDays() {
        AnalyticsSummary s = service.summarize(List.of(
                app("2026-11-12", "APPLIED", "Naukri"),
                app("2026-11-10", "SCREENING", "Naukri"),
                app("2026-11-11", "APPLIED", null)));

        assertThat(s.byPortal().get(0)).isEqualTo(new PortalStat("Naukri", 2, 1, 50.0));
        assertThat(s.byPortal().get(1).portal()).isEqualTo("Other");
        assertThat(s.perDay()).extracting(DayStat::date).containsExactly("2026-11-10", "2026-11-11", "2026-11-12");
    }
}
