package com.project.api.core.dto;

import java.util.List;

public class SkillSummaryDto {

    private Long skillId;
    private String skillName;
    private String category;
    private int enrolledTraineesCount;
    private List<String> traineeNames;

    public SkillSummaryDto() {
    }

    public SkillSummaryDto(Long skillId, String skillName, String category, int enrolledTraineesCount, List<String> traineeNames) {
        this.skillId = skillId;
        this.skillName = skillName;
        this.category = category;
        this.enrolledTraineesCount = enrolledTraineesCount;
        this.traineeNames = traineeNames;
    }

    public Long getSkillId() {
        return skillId;
    }

    public void setSkillId(Long skillId) {
        this.skillId = skillId;
    }

    public String getSkillName() {
        return skillName;
    }

    public void setSkillName(String skillName) {
        this.skillName = skillName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getEnrolledTraineesCount() {
        return enrolledTraineesCount;
    }

    public void setEnrolledTraineesCount(int enrolledTraineesCount) {
        this.enrolledTraineesCount = enrolledTraineesCount;
    }

    public List<String> getTraineeNames() {
        return traineeNames;
    }

    public void setTraineeNames(List<String> traineeNames) {
        this.traineeNames = traineeNames;
    }
}
