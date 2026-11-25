package com.interviewsprint.analytics.service;

import com.interviewsprint.analytics.model.Models.*;
import org.springframework.stereotype.Service;

import java.util.*;

/** Job-hunt analytics. Mirrors computeAnalytics() in lib/analytics.ts. */
@Service
public class AnalyticsService {

    /** Anything past "Applied" is a response (a rejection is still an answer); withdrawn is not. */
    static boolean isResponse(String status) {
        return !"APPLIED".equals(status) && !"WITHDRAWN".equals(status);
    }

    static boolean reachedInterview(String status) {
        return "INTERVIEWING".equals(status) || "OFFER".equals(status);
    }

    /** Percentage with one decimal, half-up, same as the TypeScript version. */
    static double pct(int part, int whole) {
        return whole == 0 ? 0 : Math.round(part * 1000.0 / whole) / 10.0;
    }

    public AnalyticsSummary summarize(List<ApplicationInput> input) {
        // Saved (wishlist) jobs are not applications yet.
        List<ApplicationInput> apps = input.stream().filter(a -> !"SAVED".equals(a.status())).toList();
        int total = apps.size();
        int responses = 0, interviews = 0, offers = 0;
        Map<String, int[]> portals = new HashMap<>();   // portal -> [applications, responses]
        Map<String, Integer> channels = new HashMap<>();
        Map<String, Integer> days = new TreeMap<>();     // sorted by date

        for (ApplicationInput a : apps) {
            boolean responded = isResponse(a.status());
            if (responded) responses++;
            if (reachedInterview(a.status())) interviews++;
            if ("OFFER".equals(a.status())) offers++;

            String portal = a.portal() == null || a.portal().isBlank() ? "Other" : a.portal().trim();
            int[] p = portals.computeIfAbsent(portal, k -> new int[2]);
            p[0]++;
            if (responded) p[1]++;

            channels.merge(a.channel(), 1, Integer::sum);
            days.merge(a.applicationDate().substring(0, Math.min(10, a.applicationDate().length())), 1, Integer::sum);
        }

        List<PortalStat> byPortal = portals.entrySet().stream()
                .map(e -> new PortalStat(e.getKey(), e.getValue()[0], e.getValue()[1], pct(e.getValue()[1], e.getValue()[0])))
                .sorted(Comparator.comparingInt(PortalStat::applications).reversed().thenComparing(PortalStat::portal))
                .toList();

        List<ChannelStat> byChannel = channels.entrySet().stream()
                .map(e -> new ChannelStat(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingInt(ChannelStat::applications).reversed())
                .toList();

        List<DayStat> perDay = days.entrySet().stream().map(e -> new DayStat(e.getKey(), e.getValue())).toList();
        double perActiveDay = perDay.isEmpty() ? 0 : Math.round(total * 10.0 / perDay.size()) / 10.0;

        List<FunnelStage> funnel = List.of(
                new FunnelStage("Applied", total),
                new FunnelStage("Responded", responses),
                new FunnelStage("Interview", interviews),
                new FunnelStage("Offer", offers));

        return new AnalyticsSummary(total, responses, pct(responses, total), interviews, offers,
                perDay.size(), perActiveDay, funnel, byPortal, byChannel, perDay);
    }
}
