package com.project.api.core.controller;

import com.project.api.common.ApiResponse;
import com.project.api.core.dto.CourseDto;
import com.project.api.core.dto.CourseProviderDto;
import com.project.api.core.dto.EnrollmentActionDto;
import com.project.api.core.dto.TraineeProfileDto;
import com.project.api.core.service.CourseProviderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/providers")
public class CourseProviderController {

    private final CourseProviderService providerService;

    public CourseProviderController(CourseProviderService providerService) {
        this.providerService = providerService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseProviderDto>>> getAllProviders() {
        return ResponseEntity.ok(ApiResponse.ok(providerService.getAllProviders()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseProviderDto>> getProviderById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(providerService.getProviderById(id)));
    }

    @PostMapping("/{providerId}/courses")
    public ResponseEntity<ApiResponse<CourseDto>> addCourse(@PathVariable Long providerId, @RequestBody CourseDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Course added successfully", providerService.addCourse(providerId, dto)));
    }

    @PutMapping("/courses/{courseId}")
    public ResponseEntity<ApiResponse<CourseDto>> updateCourse(@PathVariable Long courseId, @RequestBody CourseDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Course updated successfully", providerService.updateCourse(courseId, dto)));
    }

    @DeleteMapping("/courses/{courseId}")
    public ResponseEntity<ApiResponse<Void>> removeCourse(@PathVariable Long courseId) {
        providerService.removeCourse(courseId);
        return ResponseEntity.ok(ApiResponse.ok("Course deleted successfully", null));
    }

    @PostMapping("/courses/{courseId}/kick/{traineeId}")
    public ResponseEntity<ApiResponse<Void>> kickTrainee(
            @PathVariable Long courseId,
            @PathVariable Long traineeId,
            @RequestBody EnrollmentActionDto actionDto) {
        providerService.kickTrainee(courseId, traineeId, actionDto.getReason());
        return ResponseEntity.ok(ApiResponse.ok("Trainee kicked from course", null));
    }

    @GetMapping("/trainees")
    public ResponseEntity<ApiResponse<List<TraineeProfileDto>>> getAllTraineesReadOnly() {
        return ResponseEntity.ok(ApiResponse.ok("Trainee list (read-only for course providers)", providerService.getAllTraineesReadOnly()));
    }
}
