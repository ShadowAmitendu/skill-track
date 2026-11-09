package com.project.api.ai.controller;

import com.project.api.ai.dto.*;
import com.project.api.ai.service.AtsService;
import com.project.api.ai.service.MarketResearchService;
import com.project.api.ai.service.SkillGapService;
import com.project.api.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ai")
public class AiController {

    private final AtsService atsService;
    private final SkillGapService skillGapService;
    private final MarketResearchService marketResearchService;

    public AiController(AtsService atsService,
                        SkillGapService skillGapService,
                        MarketResearchService marketResearchService) {
        this.atsService = atsService;
        this.skillGapService = skillGapService;
        this.marketResearchService = marketResearchService;
    }

    @PostMapping("/ats-extract")
    public ResponseEntity<ApiResponse<AtsAnalysisResponseDto>> parseResumeTokens(@RequestBody String resumeText) {
        return ResponseEntity.ok(ApiResponse.ok("Resume tokens and skills extracted", atsService.parseResume(resumeText)));
    }

    @PostMapping("/skill-gap")
    public ResponseEntity<ApiResponse<SkillGapResponseDto>> analyzeSkillGap(@RequestBody SkillGapRequestDto request) {
        return ResponseEntity.ok(ApiResponse.ok("Skill gap analysis completed", skillGapService.analyzeSkillGap(request)));
    }

    @PostMapping("/matchmaking")
    public ResponseEntity<ApiResponse<List<RoleMatchmakingResponseDto>>> matchRoles(@RequestBody List<String> skills) {
        return ResponseEntity.ok(ApiResponse.ok("Role matchmaking results", skillGapService.matchRoles(skills)));
    }

    @GetMapping("/career-trends")
    public ResponseEntity<ApiResponse<CareerTrendsResponseDto>> getCareerTrends(@RequestParam(defaultValue = "Backend Developer") String role) {
        return ResponseEntity.ok(ApiResponse.ok("IT Career trends retrieved", skillGapService.getCareerTrends(role)));
    }

    @GetMapping("/course-improvements")
    public ResponseEntity<ApiResponse<CourseImprovementDto>> suggestCourseImprovements(@RequestParam(defaultValue = "Java Backend") String courseTitle) {
        return ResponseEntity.ok(ApiResponse.ok("Course improvement suggestions", skillGapService.suggestCourseImprovements(courseTitle)));
    }

    @PostMapping("/provider-chatbot")
    public ResponseEntity<ApiResponse<ChatResponseDto>> chatWithProviderAdvisor(@RequestBody ChatRequestDto request) {
        return ResponseEntity.ok(ApiResponse.ok("Chatbot reply", skillGapService.providerChatbotReply(request)));
    }

    @GetMapping("/market-research/documents")
    public ResponseEntity<ApiResponse<List<String>>> listMarketResearchDocs() {
        return ResponseEntity.ok(ApiResponse.ok("Market research documents in repository", marketResearchService.listResearchDocuments()));
    }

    @GetMapping("/market-research/documents/{fileName}")
    public ResponseEntity<ApiResponse<String>> readMarketResearchDoc(@PathVariable String fileName) {
        return ResponseEntity.ok(ApiResponse.ok("Document content", marketResearchService.readDocument(fileName)));
    }
}
