package com.project.api.core.controller;

import com.project.api.common.ApiResponse;
import com.project.api.core.dto.EnrollmentActionDto;
import com.project.api.core.dto.TraineeProfileDto;
import com.project.api.core.dto.TraineeRequestDto;
import com.project.api.core.service.TraineeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trainees")
public class TraineeController {

    private final TraineeService traineeService;

    public TraineeController(TraineeService traineeService) {
        this.traineeService = traineeService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TraineeProfileDto>>> getAllTrainees() {
        return ResponseEntity.ok(ApiResponse.ok("Trainees retrieved successfully", traineeService.getAllTrainees()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TraineeProfileDto>> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Trainee profile retrieved", traineeService.getTraineeProfile(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TraineeProfileDto>> createTrainee(@RequestBody TraineeRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Trainee account created", traineeService.createTrainee(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TraineeProfileDto>> updateTrainee(@PathVariable Long id, @RequestBody TraineeRequestDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Trainee profile updated", traineeService.updateTrainee(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTrainee(@PathVariable Long id) {
        traineeService.deleteTrainee(id);
        return ResponseEntity.ok(ApiResponse.ok("Trainee deleted successfully", null));
    }

    @PatchMapping("/{id}/consent")
    public ResponseEntity<ApiResponse<Void>> updateConsent(@PathVariable Long id, @RequestParam boolean consentGiven) {
        traineeService.updateConsentStatus(id, consentGiven);
        return ResponseEntity.ok(ApiResponse.ok("Consent status updated", null));
    }

    @PatchMapping("/{id}/email-preference")
    public ResponseEntity<ApiResponse<Void>> updateEmailPreference(@PathVariable Long id, @RequestParam boolean allowEmails) {
        traineeService.updateEmailPreference(id, allowEmails);
        return ResponseEntity.ok(ApiResponse.ok("Email preference updated", null));
    }

    @DeleteMapping("/{id}/employment-info")
    public ResponseEntity<ApiResponse<Void>> removeEmploymentInfo(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean forbidEmails) {
        traineeService.removeEmploymentInfo(id, forbidEmails);
        return ResponseEntity.ok(ApiResponse.ok("Employment information removed", null));
    }

    @PostMapping("/{traineeId}/enroll/{courseId}")
    public ResponseEntity<ApiResponse<Void>> enrollInCourse(@PathVariable Long traineeId, @PathVariable Long courseId) {
        traineeService.enrollCourse(traineeId, courseId);
        return ResponseEntity.ok(ApiResponse.ok("Enrolled in course successfully", null));
    }

    @PostMapping("/{traineeId}/drop/{courseId}")
    public ResponseEntity<ApiResponse<Void>> dropCourse(
            @PathVariable Long traineeId,
            @PathVariable Long courseId,
            @RequestBody EnrollmentActionDto actionDto) {
        traineeService.dropCourse(traineeId, courseId, actionDto.getReason());
        return ResponseEntity.ok(ApiResponse.ok("Course dropped successfully", null));
    }

    @PostMapping("/{traineeId}/complete/{courseId}")
    public ResponseEntity<ApiResponse<Void>> completeCourse(@PathVariable Long traineeId, @PathVariable Long courseId) {
        traineeService.completeCourse(traineeId, courseId);
        return ResponseEntity.ok(ApiResponse.ok("Course marked as completed and skills updated", null));
    }
}
