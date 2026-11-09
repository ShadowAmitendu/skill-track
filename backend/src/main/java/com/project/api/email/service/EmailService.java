package com.project.api.email.service;

import com.project.api.core.entity.Trainee;
import com.project.api.core.repository.TraineeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final TraineeRepository traineeRepository;

    public EmailService(TraineeRepository traineeRepository) {
        this.traineeRepository = traineeRepository;
    }

    /**
     * Sends quarterly update reminders to all eligible trainees.
     * Eligible trainees:
     * 1. consentGiven == true
     * 2. allowEmails == true
     * 3. adminStoppedEmail == false
     */
    public int sendQuarterlyUpdateReminders() {
        List<Trainee> eligibleTrainees = traineeRepository.findTraineesEligibleForEmail();
        log.info("Found {} eligible trainees for quarterly information update email.", eligibleTrainees.size());

        for (Trainee trainee : eligibleTrainees) {
            sendUpdateEmail(trainee);
        }

        return eligibleTrainees.size();
    }

    public void sendUpdateEmail(Trainee trainee) {
        // Email dispatch logic (SMTP / JavaMailSender / Mock template logger)
        log.info("Dispatching 3-month profile update email to: {} <{}>", trainee.getFullName(), trainee.getEmail());
    }
}
