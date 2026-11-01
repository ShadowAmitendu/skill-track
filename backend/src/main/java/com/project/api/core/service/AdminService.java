package com.project.api.core.service;

import com.project.api.common.ResourceNotFoundException;
import com.project.api.core.dto.AdminDashboardDto;
import com.project.api.core.dto.CourseProviderDto;
import com.project.api.core.dto.TraineeProfileDto;
import com.project.api.core.dto.TraineeRequestDto;
import com.project.api.core.entity.EmploymentStatus;
import com.project.api.core.entity.Trainee;
import com.project.api.core.repository.CourseProviderRepository;
import com.project.api.core.repository.CourseRepository;
import com.project.api.core.repository.TraineeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final TraineeRepository traineeRepository;
    private final CourseProviderRepository providerRepository;
    private final CourseRepository courseRepository;
    private final TraineeService traineeService;
    private final CourseProviderService providerService;

    public AdminService(TraineeRepository traineeRepository,
                        CourseProviderRepository providerRepository,
                        CourseRepository courseRepository,
                        TraineeService traineeService,
                        CourseProviderService providerService) {
        this.traineeRepository = traineeRepository;
        this.providerRepository = providerRepository;
        this.courseRepository = courseRepository;
        this.traineeService = traineeService;
        this.providerService = providerService;
    }

    @Transactional(readOnly = true)
    public AdminDashboardDto getDashboardStats() {
        AdminDashboardDto dto = new AdminDashboardDto();
        dto.setTotalTrainees(traineeRepository.count());
        dto.setTotalCourseProviders(providerRepository.count());
        dto.setTotalCourses(courseRepository.count());

        dto.setEmployedStudentsCount(traineeRepository.countByEmploymentStatus(EmploymentStatus.EMPLOYED));
        dto.setUnemployedStudentsCount(traineeRepository.countByEmploymentStatus(EmploymentStatus.UNEMPLOYED));
        dto.setJobSeekingStudentsCount(traineeRepository.countByEmploymentStatus(EmploymentStatus.SEEKING));

        // Group unemployed trainees by their stated reasons
        Map<String, Long> reasonsBreakdown = traineeRepository.findByEmploymentStatus(EmploymentStatus.UNEMPLOYED).stream()
                .filter(t -> t.getUnemployedReason() != null && !t.getUnemployedReason().trim().isEmpty())
                .collect(Collectors.groupingBy(Trainee::getUnemployedReason, Collectors.counting()));

        dto.setUnemployedReasonsBreakdown(reasonsBreakdown);
        return dto;
    }

    @Transactional
    public void setAdminEmailStop(Long traineeId, boolean stop) {
        Trainee trainee = traineeRepository.findById(traineeId)
                .orElseThrow(() -> new ResourceNotFoundException("Trainee not found with id: " + traineeId));
        trainee.setAdminStoppedEmail(stop);
        traineeRepository.save(trainee);
    }

    // Pass-through admin helper methods
    public CourseProviderDto addCourseProvider(CourseProviderDto dto) {
        return providerService.createProvider(dto);
    }

    public CourseProviderDto updateCourseProvider(Long id, CourseProviderDto dto) {
        return providerService.updateProvider(id, dto);
    }

    public TraineeProfileDto addTrainee(TraineeRequestDto dto) {
        return traineeService.createTrainee(dto);
    }

    public void removeTrainee(Long id) {
        traineeService.deleteTrainee(id);
    }

    public List<TraineeProfileDto> getAllTraineesReadOnly() {
        return traineeService.getAllTrainees();
    }

    public List<CourseProviderDto> getAllCourseProvidersReadOnly() {
        return providerService.getAllProviders();
    }
}
