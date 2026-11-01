package com.project.api.core.dto;

public class EnrollmentActionDto {

    private String reason;

    public EnrollmentActionDto() {
    }

    public EnrollmentActionDto(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
