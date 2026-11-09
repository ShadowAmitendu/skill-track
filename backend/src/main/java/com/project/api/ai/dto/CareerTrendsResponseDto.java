package com.project.api.ai.dto;

import java.util.List;

public class CareerTrendsResponseDto {

    private String itRole;
    private List<String> currentMarketTrends;
    private List<String> emergingFutureRoles;
    private String futureCareerProspect;
    private List<String> evolvingSkillDemands;

    public CareerTrendsResponseDto() {
    }

    public String getItRole() {
        return itRole;
    }

    public void setItRole(String itRole) {
        this.itRole = itRole;
    }

    public List<String> getCurrentMarketTrends() {
        return currentMarketTrends;
    }

    public void setCurrentMarketTrends(List<String> currentMarketTrends) {
        this.currentMarketTrends = currentMarketTrends;
    }

    public List<String> getEmergingFutureRoles() {
        return emergingFutureRoles;
    }

    public void setEmergingFutureRoles(List<String> emergingFutureRoles) {
        this.emergingFutureRoles = emergingFutureRoles;
    }

    public String getFutureCareerProspect() {
        return futureCareerProspect;
    }

    public void setFutureCareerProspect(String futureCareerProspect) {
        this.futureCareerProspect = futureCareerProspect;
    }

    public List<String> getEvolvingSkillDemands() {
        return evolvingSkillDemands;
    }

    public void setEvolvingSkillDemands(List<String> evolvingSkillDemands) {
        this.evolvingSkillDemands = evolvingSkillDemands;
    }
}
