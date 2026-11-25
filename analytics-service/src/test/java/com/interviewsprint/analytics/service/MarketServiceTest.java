package com.interviewsprint.analytics.service;

import com.interviewsprint.analytics.model.Models.*;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MarketServiceTest {

    private final MarketService service = new MarketService();

    private final List<SignalInput> signals = List.of(
            new SignalInput("APPLIED", "None (applied)", "1–2 yrs", List.of("React", "Node.js")),
            new SignalInput("SKIPPED", "Skills", "1–2 yrs", List.of("React", "Python")),
            new SignalInput("SKIPPED", "Skills", "0–1 yrs", List.of("Python", "Django/FastAPI/Flask")),
            new SignalInput("SKIPPED", "Experience", "3–5 yrs", List.of("React", "Redux")));

    @Test
    void ranksDemandAndMarksOwnedSkills() {
        MarketSummary m = service.summarize(new MarketRequest(List.of("react", "Node.js"), signals));
        assertThat(m.totalJobs()).isEqualTo(4);
        assertThat(m.applied()).isEqualTo(1);
        assertThat(m.skipped()).isEqualTo(3);
        assertThat(m.skillDemand().get(0)).isEqualTo(new SkillDemand("React", 3, 75.0, true));
    }

    @Test
    void learnNextPrefersSkillsThatWereTheOnlyGap() {
        MarketSummary m = service.summarize(new MarketRequest(List.of("React", "Node.js"), signals));
        assertThat(m.learnNext().get(0)).isEqualTo(new LearnNext("Python", 2, 2, 1));
    }

    @Test
    void blockersCountOnlySkippedJobsAndBandsAreOrdered() {
        MarketSummary m = service.summarize(new MarketRequest(List.of(), signals));
        assertThat(m.blockers()).containsExactly(new BlockerStat("Skills", 2), new BlockerStat("Experience", 1));
        assertThat(m.experienceBands()).extracting(BandStat::band).containsExactly("0–1 yrs", "1–2 yrs", "3–5 yrs");
        assertThat(m.coverage()).isZero();
    }
}
