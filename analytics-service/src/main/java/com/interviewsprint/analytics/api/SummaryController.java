package com.interviewsprint.analytics.api;

import com.interviewsprint.analytics.model.Models.*;
import com.interviewsprint.analytics.service.AnalyticsService;
import com.interviewsprint.analytics.service.MarketService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class SummaryController {

    private final AnalyticsService analytics;
    private final MarketService market;

    public SummaryController(AnalyticsService analytics, MarketService market) {
        this.analytics = analytics;
        this.market = market;
    }

    @PostMapping("/analytics/summary")
    public ResponseEntity<AnalyticsSummary> analytics(@Valid @RequestBody AnalyticsRequest request) {
        return ResponseEntity.ok(analytics.summarize(request.applications()));
    }

    @PostMapping("/market/summary")
    public ResponseEntity<MarketSummary> market(@Valid @RequestBody MarketRequest request) {
        return ResponseEntity.ok(market.summarize(request));
    }
}
