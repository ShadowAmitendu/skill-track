package com.project.api.email.scheduler;

import com.project.api.email.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class TraineeFollowUpScheduler {

    private static final Logger log = LoggerFactory.getLogger(TraineeFollowUpScheduler.class);

    private final EmailService emailService;

    public TraineeFollowUpScheduler(EmailService emailService) {
        this.emailService = emailService;
    }

    /**
     * Executes every 3 months (at 09:00 AM on the 1st day of January, April, July, October)
     * Cron expression: second, minute, hour, day of month, month, day of week
     */
    @Scheduled(cron = "0 0 9 1 1,4,7,10 *")
    public void runQuarterlyFollowUpNotifications() {
        log.info("Running scheduled quarterly trainee follow-up notification job...");
        int dispatched = emailService.sendQuarterlyUpdateReminders();
        log.info("Finished quarterly follow-up job. Sent {} emails.", dispatched);
    }
}
