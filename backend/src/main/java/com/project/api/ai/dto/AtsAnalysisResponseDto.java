package com.project.api.ai.dto;

import java.util.List;
import java.util.Set;

public class AtsAnalysisResponseDto {

    private int totalTokens;
    private Set<String> extractedSkillTokens;
    private List<String> detectedTechnologies;

    public AtsAnalysisResponseDto() {
    }

    public AtsAnalysisResponseDto(int totalTokens, Set<String> extractedSkillTokens, List<String> detectedTechnologies) {
        this.totalTokens = totalTokens;
        this.extractedSkillTokens = extractedSkillTokens;
        this.detectedTechnologies = detectedTechnologies;
    }

    public int getTotalTokens() {
        return totalTokens;
    }

    public void setTotalTokens(int totalTokens) {
        this.totalTokens = totalTokens;
    }

    public Set<String> getExtractedSkillTokens() {
        return extractedSkillTokens;
    }

    public void setExtractedSkillTokens(Set<String> extractedSkillTokens) {
        this.extractedSkillTokens = extractedSkillTokens;
    }

    public List<String> getDetectedTechnologies() {
        return detectedTechnologies;
    }

    public void setDetectedTechnologies(List<String> detectedTechnologies) {
        this.detectedTechnologies = detectedTechnologies;
    }
}
