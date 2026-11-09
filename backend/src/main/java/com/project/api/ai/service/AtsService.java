package com.project.api.ai.service;

import com.project.api.ai.dto.AtsAnalysisResponseDto;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AtsService {

    // Common IT skills/technologies dictionary for ATS token extraction
    private static final Set<String> KNOWN_IT_SKILLS = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);

    static {
        KNOWN_IT_SKILLS.addAll(Arrays.asList(
                "Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "Kotlin", "Swift",
                "Spring Boot", "Hibernate", "Node.js", "Express", "React", "Angular", "Vue.js", "Next.js",
                "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra", "Oracle",
                "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Jenkins", "Terraform", "Ansible",
                "Git", "GitHub", "REST", "GraphQL", "gRPC", "Kafka", "RabbitMQ", "Microservices",
                "Linux", "OAuth2", "JWT", "JPA", "HTML", "CSS", "Tailwind", "Agile", "Scrum"
        ));
    }

    private static final Pattern TOKEN_SPLIT = Pattern.compile("[\\s,;./()\\[\\]{}|:]+");

    public AtsAnalysisResponseDto parseResume(String resumeText) {
        if (resumeText == null || resumeText.isBlank()) {
            return new AtsAnalysisResponseDto(0, Collections.emptySet(), Collections.emptyList());
        }

        String[] rawTokens = TOKEN_SPLIT.split(resumeText);
        Set<String> tokenSet = Arrays.stream(rawTokens)
                .map(String::trim)
                .filter(t -> !t.isEmpty())
                .collect(Collectors.toSet());

        List<String> matchedSkills = new ArrayList<>();
        for (String skill : KNOWN_IT_SKILLS) {
            if (resumeText.toLowerCase().contains(skill.toLowerCase())) {
                matchedSkills.add(skill);
            }
        }

        return new AtsAnalysisResponseDto(rawTokens.length, tokenSet, matchedSkills);
    }

    public List<String> extractSkillsFromText(String resumeText) {
        return parseResume(resumeText).getDetectedTechnologies();
    }
}
