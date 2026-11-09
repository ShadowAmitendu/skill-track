package com.project.api.ai.dto;

import java.util.List;

public class SkillGapRequestDto {

    private String targetRole;
    private String resumeText;
    private List<String> currentSkills;

    public SkillGapRequestDto() {
    }

    public String getTargetRole() {
        return targetRole;
    }

    public void setTargetRole(String targetRole) {
        this.targetRole = targetRole;
    }

    public String getResumeText() {
        return resumeText;
    }

    public void setResumeText(String resumeText) {
        this.resumeText = resumeText;
    }

    public List<String> getCurrentSkills() {
        return currentSkills;
    }

    public void setCurrentSkills(List<String> currentSkills) {
        this.currentSkills = currentSkills;
    }
}
