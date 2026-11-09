package com.project.api.ai.dto;

import java.util.List;

public class CourseImprovementDto {

    private String currentCourseTitle;
    private List<String> suggestedCurriculumAdditions;
    private List<String> outdatedTopicsToRemove;
    private List<String> newCourseIdeas;
    private String marketRationale;

    public CourseImprovementDto() {
    }

    public String getCurrentCourseTitle() {
        return currentCourseTitle;
    }

    public void setCurrentCourseTitle(String currentCourseTitle) {
        this.currentCourseTitle = currentCourseTitle;
    }

    public List<String> getSuggestedCurriculumAdditions() {
        return suggestedCurriculumAdditions;
    }

    public void setSuggestedCurriculumAdditions(List<String> suggestedCurriculumAdditions) {
        this.suggestedCurriculumAdditions = suggestedCurriculumAdditions;
    }

    public List<String> getOutdatedTopicsToRemove() {
        return outdatedTopicsToRemove;
    }

    public void setOutdatedTopicsToRemove(List<String> outdatedTopicsToRemove) {
        this.outdatedTopicsToRemove = outdatedTopicsToRemove;
    }

    public List<String> getNewCourseIdeas() {
        return newCourseIdeas;
    }

    public void setNewCourseIdeas(List<String> newCourseIdeas) {
        this.newCourseIdeas = newCourseIdeas;
    }

    public String getMarketRationale() {
        return marketRationale;
    }

    public void setMarketRationale(String marketRationale) {
        this.marketRationale = marketRationale;
    }
}
