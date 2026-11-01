package com.project.api.ai.dto;

import java.util.List;

public class RoleMatchmakingResponseDto {

    private String roleTitle;
    private double fitScore;
    private List<String> matchingSkills;
    private List<String> growthAreas;

    public RoleMatchmakingResponseDto() {
    }

    public RoleMatchmakingResponseDto(String roleTitle, double fitScore, List<String> matchingSkills, List<String> growthAreas) {
        this.roleTitle = roleTitle;
        this.fitScore = fitScore;
        this.matchingSkills = matchingSkills;
        this.growthAreas = growthAreas;
    }

    public String getRoleTitle() {
        return roleTitle;
    }

    public void setRoleTitle(String roleTitle) {
        this.roleTitle = roleTitle;
    }

    public double getFitScore() {
        return fitScore;
    }

    public void setFitScore(double fitScore) {
        this.fitScore = fitScore;
    }

    public List<String> getMatchingSkills() {
        return matchingSkills;
    }

    public void setMatchingSkills(List<String> matchingSkills) {
        this.matchingSkills = matchingSkills;
    }

    public List<String> getGrowthAreas() {
        return growthAreas;
    }

    public void setGrowthAreas(List<String> growthAreas) {
        this.growthAreas = growthAreas;
    }
}
