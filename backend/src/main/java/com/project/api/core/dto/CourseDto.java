package com.project.api.core.dto;

import java.util.List;

public class CourseDto {

    private Long id;
    private String title;
    private String description;
    private Long providerId;
    private String providerName;
    private List<String> skillsTaught;

    public CourseDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getProviderId() {
        return providerId;
    }

    public void setProviderId(Long providerId) {
        this.providerId = providerId;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public List<String> getSkillsTaught() {
        return skillsTaught;
    }

    public void setSkillsTaught(List<String> skillsTaught) {
        this.skillsTaught = skillsTaught;
    }
}
