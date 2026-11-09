package com.project.api.core.dto;

import com.project.api.core.entity.EmploymentStatus;
import java.util.List;

public class TraineeProfileDto {

    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private boolean consentGiven;
    private boolean allowEmails;
    private boolean adminStoppedEmail;
    private EmploymentStatus employmentStatus;
    private String companyName;
    private String currentRole;
    private Double currentSalary;
    private String salaryProgression;
    private String unemployedReason;
    private String projectsSummary;
    private String projectRepoUrl;

    private List<String> skills;
    private List<String> certifications;
    private List<String> enrolledCourses;
    private List<String> completedCourses;
    private List<String> followUpNotes;

    public TraineeProfileDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public boolean isConsentGiven() {
        return consentGiven;
    }

    public void setConsentGiven(boolean consentGiven) {
        this.consentGiven = consentGiven;
    }

    public boolean isAllowEmails() {
        return allowEmails;
    }

    public void setAllowEmails(boolean allowEmails) {
        this.allowEmails = allowEmails;
    }

    public boolean isAdminStoppedEmail() {
        return adminStoppedEmail;
    }

    public void setAdminStoppedEmail(boolean adminStoppedEmail) {
        this.adminStoppedEmail = adminStoppedEmail;
    }

    public EmploymentStatus getEmploymentStatus() {
        return employmentStatus;
    }

    public void setEmploymentStatus(EmploymentStatus employmentStatus) {
        this.employmentStatus = employmentStatus;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCurrentRole() {
        return currentRole;
    }

    public void setCurrentRole(String currentRole) {
        this.currentRole = currentRole;
    }

    public Double getCurrentSalary() {
        return currentSalary;
    }

    public void setCurrentSalary(Double currentSalary) {
        this.currentSalary = currentSalary;
    }

    public String getSalaryProgression() {
        return salaryProgression;
    }

    public void setSalaryProgression(String salaryProgression) {
        this.salaryProgression = salaryProgression;
    }

    public String getUnemployedReason() {
        return unemployedReason;
    }

    public void setUnemployedReason(String unemployedReason) {
        this.unemployedReason = unemployedReason;
    }

    public String getProjectsSummary() {
        return projectsSummary;
    }

    public void setProjectsSummary(String projectsSummary) {
        this.projectsSummary = projectsSummary;
    }

    public String getProjectRepoUrl() {
        return projectRepoUrl;
    }

    public void setProjectRepoUrl(String projectRepoUrl) {
        this.projectRepoUrl = projectRepoUrl;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    public List<String> getCertifications() {
        return certifications;
    }

    public void setCertifications(List<String> certifications) {
        this.certifications = certifications;
    }

    public List<String> getEnrolledCourses() {
        return enrolledCourses;
    }

    public void setEnrolledCourses(List<String> enrolledCourses) {
        this.enrolledCourses = enrolledCourses;
    }

    public List<String> getCompletedCourses() {
        return completedCourses;
    }

    public void setCompletedCourses(List<String> completedCourses) {
        this.completedCourses = completedCourses;
    }

    public List<String> getFollowUpNotes() {
        return followUpNotes;
    }

    public void setFollowUpNotes(List<String> followUpNotes) {
        this.followUpNotes = followUpNotes;
    }
}
