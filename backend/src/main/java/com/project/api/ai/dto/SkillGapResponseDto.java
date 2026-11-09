package com.project.api.ai.dto;

import java.util.List;

public class SkillGapResponseDto {

    private String targetRole;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private double matchPercentage;
    private List<String> recommendedTopics;

    public SkillGapResponseDto() {
    }

    public SkillGapResponseDto(String targetRole, List<String> matchedSkills, List<String> missingSkills, double matchPercentage, List<String> recommendedTopics) {
        this.targetRole = targetRole;
        this.matchedSkills = matchedSkills;
        this.missingSkills = missingSkills;
        this.matchPercentage = matchPercentage;
        this.recommendedTopics = recommendedTopics;
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public List<String> getMatchedSkills() {
        return matchedSkills;
    }

    public void setMatchedSkills(List<String> matchedSkills) {
        this.matchedSkills = matchedSkills;
    }

    public List<String> getMissingSkills() {
        return missingSkills;
    }

    public void setMissingSkills(List<String> missingSkills) {
        this.missingSkills = missingSkills;
    }

    public double getMatchPercentage() {
        return matchPercentage;
    }

    public void setMatchPercentage(double matchPercentage) {
        this.matchPercentage = matchPercentage;
    }

    public List<String> getRecommendedTopics() {
        return recommendedTopics;
    }

    public void setRecommendedTopics(List<String> recommendedTopics) {
        this.recommendedTopics = recommendedTopics;
    }
}
