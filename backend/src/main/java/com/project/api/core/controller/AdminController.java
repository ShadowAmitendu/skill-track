package com.project.api.core.controller;

import com.project.api.common.ApiResponse;
import com.project.api.core.dto.AdminDashboardDto;
import com.project.api.core.dto.CourseProviderDto;
import com.project.api.core.dto.TraineeProfileDto;
import com.project.api.core.dto.TraineeRequestDto;
import com.project.api.core.service.AdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardDto>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.ok("Dashboard statistics retrieved", adminService.getDashboardStats()));
    }

    @GetMapping("/trainees")
    public ResponseEntity<ApiResponse<List<TraineeProfileDto>>> getAllTrainees() {
        return ResponseEntity.ok(ApiResponse.ok("All trainees (read-only)", adminService.getAllTraineesReadOnly()));
    }

    @PostMapping("/trainees")
    public ResponseEntity<ApiResponse<TraineeProfileDto>> addTrainee(@RequestBody TraineeRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Trainee created successfully", adminService.addTrainee(dto)));
    }

    @DeleteMapping("/trainees/{id}")
    public ResponseEntity<ApiResponse<Void>> removeTrainee(@PathVariable Long id) {
        adminService.removeTrainee(id);
        return ResponseEntity.ok(ApiResponse.ok("Trainee removed successfully", null));
    }

    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<List<CourseProviderDto>>> getAllProviders() {
        return ResponseEntity.ok(ApiResponse.ok("All course providers (read-only)", adminService.getAllCourseProvidersReadOnly()));
    }

    @PostMapping("/providers")
    public ResponseEntity<ApiResponse<CourseProviderDto>> addCourseProvider(@RequestBody CourseProviderDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Course provider created", adminService.addCourseProvider(dto)));
    }

    @PutMapping("/providers/{id}")
    public ResponseEntity<ApiResponse<CourseProviderDto>> updateCourseProvider(@PathVariable Long id, @RequestBody CourseProviderDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Course provider updated", adminService.updateCourseProvider(id, dto)));
    }

    @PatchMapping("/trainees/{traineeId}/stop-emails")
    public ResponseEntity<ApiResponse<Void>> stopEmailService(@PathVariable Long traineeId, @RequestParam boolean stop) {
        adminService.setAdminEmailStop(traineeId, stop);
        String msg = stop ? "Email service stopped for trainee" : "Email service unblocked for trainee";
        return ResponseEntity.ok(ApiResponse.ok(msg, null));
    }
}
