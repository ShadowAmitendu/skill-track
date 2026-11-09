package com.project.api.email.controller;

import com.project.api.common.ApiResponse;
import com.project.api.email.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/email")
public class EmailController {

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping("/trigger-quarterly-reminders")
    public ResponseEntity<ApiResponse<String>> triggerQuarterlyReminders() {
        int count = emailService.sendQuarterlyUpdateReminders();
        return ResponseEntity.ok(ApiResponse.ok("Quarterly update reminders triggered successfully", "Emails queued/sent: " + count));
    }
}
