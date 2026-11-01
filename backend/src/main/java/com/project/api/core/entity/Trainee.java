package com.project.api.core.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "trainees")
public class Trainee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(length = 30)
    private String phoneNumber;

    // Consent and Email preferences
    @Column(nullable = false)
    private boolean consentGiven = true;

    @Column(nullable = false)
    private boolean allowEmails = true;

    @Column(nullable = false)
    private boolean adminStoppedEmail = false;

    // Employment details
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EmploymentStatus employmentStatus = EmploymentStatus.SEEKING;

    @Column(length = 150)
    private String companyName;

    @Column(length = 100)
    private String currentRole;

    private Double currentSalary;

    @Column(length = 200)
    private String salaryProgression;

    @Column(length = 500)
    private String unemployedReason;

    // Projects & Portfolio
    @Column(length = 1000)
    private String projectsSummary;

    @Column(length = 500)
    private String projectRepoUrl;

    // Relationships
    @ManyToMany
    @JoinTable(
            name = "trainee_skills",
            joinColumns = @JoinColumn(name = "trainee_id"),
            inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    private Set<Skill> skills = new HashSet<>();

    @OneToMany(mappedBy = "trainee", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Certification> certifications = new ArrayList<>();

    @OneToMany(mappedBy = "trainee", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CourseEnrollment> enrollments = new ArrayList<>();

    @OneToMany(mappedBy = "trainee", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FollowUp> followUps = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Trainee() {
    }

    public Trainee(String fullName, String email, String phoneNumber) {
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.createdAt = LocalDateTime.now();
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

    public Set<Skill> getSkills() {
        return skills;
    }

    public void setSkills(Set<Skill> skills) {
        this.skills = skills;
    }

    public List<Certification> getCertifications() {
        return certifications;
    }

    public void setCertifications(List<Certification> certifications) {
        this.certifications = certifications;
    }

    public List<CourseEnrollment> getEnrollments() {
        return enrollments;
    }

    public void setEnrollments(List<CourseEnrollment> enrollments) {
        this.enrollments = enrollments;
    }

    public List<FollowUp> getFollowUps() {
        return followUps;
    }

    public void setFollowUps(List<FollowUp> followUps) {
        this.followUps = followUps;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
