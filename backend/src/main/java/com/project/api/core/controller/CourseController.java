package com.project.api.core.controller;

import com.project.api.common.ApiResponse;
import com.project.api.core.dto.CourseDto;
import com.project.api.core.dto.SkillSummaryDto;
import com.project.api.core.service.CourseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseDto>>> getAllCourses() {
        return ResponseEntity.ok(ApiResponse.ok("Courses retrieved", courseService.getAllCourses()));
    }

    @GetMapping("/provider/{providerId}")
    public ResponseEntity<ApiResponse<List<CourseDto>>> getCoursesByProvider(@PathVariable Long providerId) {
        return ResponseEntity.ok(ApiResponse.ok("Courses for provider dropdown", courseService.getCoursesByProvider(providerId)));
    }

    @GetMapping("/skills-summary")
    public ResponseEntity<ApiResponse<List<SkillSummaryDto>>> getSkillsSummary() {
        return ResponseEntity.ok(ApiResponse.ok("Skills and enrolled trainees summary", courseService.getSkillsSummary()));
    }
}
