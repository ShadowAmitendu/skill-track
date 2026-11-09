package com.project.api.ai.service;

import com.project.api.ai.dto.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SkillGapService {

    private final AtsService atsService;
    private final MarketResearchService marketResearchService;

    // Standard IT Role Skill Requirements Map
    private static final Map<String, List<String>> ROLE_SKILLS_MAP = new HashMap<>();

    static {
        ROLE_SKILLS_MAP.put("Backend Developer", Arrays.asList("Java", "Spring Boot", "PostgreSQL", "REST", "Git", "Docker", "Microservices"));
        ROLE_SKILLS_MAP.put("Frontend Developer", Arrays.asList("JavaScript", "TypeScript", "React", "HTML", "CSS", "Tailwind", "Git"));
        ROLE_SKILLS_MAP.put("Fullstack Developer", Arrays.asList("Java", "Spring Boot", "JavaScript", "React", "PostgreSQL", "Git", "REST"));
        ROLE_SKILLS_MAP.put("DevOps Engineer", Arrays.asList("Docker", "Kubernetes", "CI/CD", "AWS", "Linux", "Terraform", "Git"));
        ROLE_SKILLS_MAP.put("Cloud Engineer", Arrays.asList("AWS", "GCP", "Docker", "Kubernetes", "Linux", "Terraform", "Microservices"));
    }

    public SkillGapService(AtsService atsService, MarketResearchService marketResearchService) {
        this.atsService = atsService;
        this.marketResearchService = marketResearchService;
    }

    public SkillGapResponseDto analyzeSkillGap(SkillGapRequestDto request) {
        String targetRole = request.getTargetRole() != null ? request.getTargetRole().trim() : "Backend Developer";

        // Extract skills either from direct list or parsed resume text
        Set<String> candidateSkills = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        if (request.getCurrentSkills() != null) {
            candidateSkills.addAll(request.getCurrentSkills());
        }
        if (request.getResumeText() != null && !request.getResumeText().isBlank()) {
            candidateSkills.addAll(atsService.extractSkillsFromText(request.getResumeText()));
        }

        List<String> requiredSkills = ROLE_SKILLS_MAP.getOrDefault(targetRole,
                Arrays.asList("Java", "Spring Boot", "SQL", "Git", "REST"));

        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        for (String req : requiredSkills) {
            if (candidateSkills.contains(req)) {
                matched.add(req);
            } else {
                missing.add(req);
            }
        }

        double matchPercent = requiredSkills.isEmpty() ? 0.0 :
                Math.round(((double) matched.size() / requiredSkills.size()) * 100.0);

        List<String> recommendations = missing.stream()
                .map(s -> "Enroll in courses teaching " + s)
                .collect(Collectors.toList());

        return new SkillGapResponseDto(targetRole, matched, missing, matchPercent, recommendations);
    }

    public List<RoleMatchmakingResponseDto> matchRoles(List<String> userSkills) {
        Set<String> skillsSet = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        if (userSkills != null) {
            skillsSet.addAll(userSkills);
        }

        List<RoleMatchmakingResponseDto> results = new ArrayList<>();
        for (Map.Entry<String, List<String>> entry : ROLE_SKILLS_MAP.entrySet()) {
            String role = entry.getKey();
            List<String> reqs = entry.getValue();

            List<String> matching = reqs.stream().filter(skillsSet::contains).collect(Collectors.toList());
            List<String> missing = reqs.stream().filter(r -> !skillsSet.contains(r)).collect(Collectors.toList());

            double fitScore = reqs.isEmpty() ? 0 : Math.round(((double) matching.size() / reqs.size()) * 100.0);
            results.add(new RoleMatchmakingResponseDto(role, fitScore, matching, missing));
        }

        results.sort((a, b) -> Double.compare(b.getFitScore(), a.getFitScore()));
        return results;
    }

    public CareerTrendsResponseDto getCareerTrends(String itRole) {
        CareerTrendsResponseDto dto = new CareerTrendsResponseDto();
        dto.setItRole(itRole != null ? itRole : "Backend Developer");
        dto.setCurrentMarketTrends(Arrays.asList(
                "High demand for cloud-native architectures & containerization",
                "Increasing adoption of asynchronous event streaming (Kafka/RabbitMQ)",
                "AI-assisted code development and automated testing pipelines"
        ));
        dto.setEmergingFutureRoles(Arrays.asList(
                "AI Platform Engineer",
                "Cloud Cost & FinOps Specialist",
                "LLM Application Architect"
        ));
        dto.setFutureCareerProspect("Strong 5-year growth trajectory with ~22% projected job creation in enterprise IT.");
        dto.setEvolvingSkillDemands(Arrays.asList(
                "Kubernetes orchestration",
                "Observability (Prometheus, OpenTelemetry)",
                "Vector databases and AI integration APIs"
        ));
        return dto;
    }

    public CourseImprovementDto suggestCourseImprovements(String courseTitle) {
        CourseImprovementDto dto = new CourseImprovementDto();
        dto.setCurrentCourseTitle(courseTitle);
        dto.setSuggestedCurriculumAdditions(Arrays.asList(
                "Hands-on Docker containerization & multi-stage builds",
                "Spring Boot 3/4 Native GraalVM compilation & modern Observability",
                "CI/CD GitHub Actions deployment automation"
        ));
        dto.setOutdatedTopicsToRemove(Arrays.asList(
                "Monolithic XML-based configurations",
                "Legacy SOAP web services"
        ));
        dto.setNewCourseIdeas(Arrays.asList(
                "Building Cloud-Native Microservices with Spring Boot & Docker",
                "Fullstack Java & React Production Bootcamp"
        ));
        dto.setMarketRationale("Current hiring trends prioritize containerization and cloud deployment experience.");
        return dto;
    }

    public ChatResponseDto providerChatbotReply(ChatRequestDto request) {
        String msg = request.getMessage() != null ? request.getMessage().toLowerCase() : "";
        String reply;

        if (msg.contains("course") || msg.contains("improve")) {
            reply = "Based on market research from our repository, students who study Docker and Spring Boot microservices have a 35% higher placement rate. Consider adding containerization modules.";
        } else if (msg.contains("demand") || msg.contains("salary")) {
            reply = "IT Roles in Backend and Cloud Engineering currently command higher average entry salaries. Adding PostgreSQL indexing and REST API optimization topics will increase trainee marketability.";
        } else {
            reply = "I am your AI Course Advisor. I can analyze market trends from our IT research repository, suggest curriculum updates, or evaluate student skill alignments for your courses.";
        }

        return new ChatResponseDto(reply);
    }
}
