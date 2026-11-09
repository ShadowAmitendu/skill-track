package com.project.api.core.dto;

import com.project.api.core.entity.EmploymentStatus;

public class TraineeRequestDto {

    private String fullName;
    private String email;
    private String phoneNumber;
    private Boolean consentGiven;
    private Boolean allowEmails;
    private EmploymentStatus employmentStatus;
    private String companyName;
    private String currentRole;
    private Double currentSalary;
    private String salaryProgression;
    private String unemployedReason;
    private String projectsSummary;
    private String projectRepoUrl;

    public TraineeRequestDto() {
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

    public Boolean getConsentGiven() {
        return consentGiven;
    }

    public void setConsentGiven(Boolean consentGiven) {
        this.consentGiven = consentGiven;
    }

    public Boolean getAllowEmails() {
        return allowEmails;
    }

    public void setAllowEmails(Boolean allowEmails) {
        this.allowEmails = allowEmails;
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
}
