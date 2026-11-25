package com.interviewsprint.analytics.service;

import com.interviewsprint.analytics.model.Models.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/** Market skill-gap analysis. Mirrors computeMarket() in lib/market.ts. */
@Service
public class MarketService {

    static final List<String> BAND_ORDER = List.of("0–1 yrs", "1–2 yrs", "2–3 yrs", "3–5 yrs", "5+ yrs", "Not stated");

    public MarketSummary summarize(MarketRequest request) {
        Set<String> have = request.userSkills().stream().map(s -> s.toLowerCase(Locale.ROOT)).collect(Collectors.toSet());

        Map<String, Integer> demand = new HashMap<>();
        Map<String, int[]> learn = new HashMap<>();      // skill -> [jobs, skippedJobs, onlyGapJobs]
        Map<String, Integer> blockers = new HashMap<>();
        Map<String, Integer> bands = new HashMap<>();
        int mentions = 0, owned = 0, applied = 0, skipped = 0;

        for (SignalInput s : request.signals()) {
            boolean isSkipped = "SKIPPED".equals(s.decision());
            if (isSkipped) skipped++; else applied++;

            List<String> skills = new ArrayList<>(new LinkedHashSet<>(s.skills()));
            List<String> missing = skills.stream().filter(k -> !have.contains(k.toLowerCase(Locale.ROOT))).toList();

            for (String k : skills) {
                demand.merge(k, 1, Integer::sum);
                mentions++;
                if (have.contains(k.toLowerCase(Locale.ROOT))) owned++;
            }
            for (String k : missing) {
                int[] e = learn.computeIfAbsent(k, x -> new int[3]);
                e[0]++;
                if (isSkipped) e[1]++;
                if (missing.size() == 1) e[2]++;
            }
            if (isSkipped) blockers.merge(s.blocker(), 1, Integer::sum);
            bands.merge(s.expBand(), 1, Integer::sum);
        }

        int total = request.signals().size();

        List<SkillDemand> skillDemand = demand.entrySet().stream()
                .map(e -> new SkillDemand(e.getKey(), e.getValue(), AnalyticsService.pct(e.getValue(), total),
                        have.contains(e.getKey().toLowerCase(Locale.ROOT))))
                .sorted(Comparator.comparingInt(SkillDemand::jobs).reversed().thenComparing(SkillDemand::skill))
                .limit(15)
                .toList();

        List<BlockerStat> blockerStats = blockers.entrySet().stream()
                .map(e -> new BlockerStat(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingInt(BlockerStat::jobs).reversed())
                .toList();

        List<BandStat> bandStats = bands.entrySet().stream()
                .map(e -> new BandStat(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingInt(b -> BAND_ORDER.indexOf(b.band())))
                .toList();

        List<LearnNext> learnNext = learn.entrySet().stream()
                .map(e -> new LearnNext(e.getKey(), e.getValue()[0], e.getValue()[1], e.getValue()[2]))
                .sorted(Comparator.comparingInt(LearnNext::onlyGapJobs).reversed()
                        .thenComparing(Comparator.comparingInt(LearnNext::jobs).reversed())
                        .thenComparing(LearnNext::skill))
                .limit(8)
                .toList();

        return new MarketSummary(total, applied, skipped, skillDemand, blockerStats, bandStats, learnNext,
                AnalyticsService.pct(owned, mentions));
    }
}
