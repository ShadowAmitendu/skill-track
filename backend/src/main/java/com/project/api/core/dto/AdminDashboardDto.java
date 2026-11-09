package com.project.api.core.dto;

import java.util.Map;

public class AdminDashboardDto {

    private long totalTrainees;
    private long totalCourseProviders;
    private long totalCourses;
    private long employedStudentsCount;
    private long unemployedStudentsCount;
    private long jobSeekingStudentsCount;
    private Map<String, Long> unemployedReasonsBreakdown;

    public AdminDashboardDto() {
    }

    public long getTotalTrainees() {
        return totalTrainees;
    }

    public void setTotalTrainees(long totalTrainees) {
        this.totalTrainees = totalTrainees;
    }

    public long getTotalCourseProviders() {
        return totalCourseProviders;
    }

    public void setTotalCourseProviders(long totalCourseProviders) {
        this.totalCourseProviders = totalCourseProviders;
    }

    public long getTotalCourses() {
        return totalCourses;
    }

    public void setTotalCourses(long totalCourses) {
        this.totalCourses = totalCourses;
    }

    public long getEmployedStudentsCount() {
        return employedStudentsCount;
    }

    public void setEmployedStudentsCount(long employedStudentsCount) {
        this.employedStudentsCount = employedStudentsCount;
    }

    public long getUnemployedStudentsCount() {
        return unemployedStudentsCount;
    }

    public void setUnemployedStudentsCount(long unemployedStudentsCount) {
        this.unemployedStudentsCount = unemployedStudentsCount;
    }

    public long getJobSeekingStudentsCount() {
        return jobSeekingStudentsCount;
    }

    public void setJobSeekingStudentsCount(long jobSeekingStudentsCount) {
        this.jobSeekingStudentsCount = jobSeekingStudentsCount;
    }

    public Map<String, Long> getUnemployedReasonsBreakdown() {
        return unemployedReasonsBreakdown;
    }

    public void setUnemployedReasonsBreakdown(Map<String, Long> unemployedReasonsBreakdown) {
        this.unemployedReasonsBreakdown = unemployedReasonsBreakdown;
    }
}
