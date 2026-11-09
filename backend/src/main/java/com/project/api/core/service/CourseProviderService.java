package com.project.api.core.service;

import com.project.api.common.ResourceNotFoundException;
import com.project.api.core.dto.CourseDto;
import com.project.api.core.dto.CourseProviderDto;
import com.project.api.core.dto.TraineeProfileDto;
import com.project.api.core.entity.Course;
import com.project.api.core.entity.CourseEnrollment;
import com.project.api.core.entity.CourseProvider;
import com.project.api.core.entity.EnrollmentStatus;
import com.project.api.core.repository.CourseEnrollmentRepository;
import com.project.api.core.repository.CourseProviderRepository;
import com.project.api.core.repository.CourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseProviderService {

    private final CourseProviderRepository providerRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final TraineeService traineeService;
    private final CourseService courseService;

    public CourseProviderService(CourseProviderRepository providerRepository,
                                 CourseRepository courseRepository,
                                 CourseEnrollmentRepository enrollmentRepository,
                                 TraineeService traineeService,
                                 CourseService courseService) {
        this.providerRepository = providerRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.traineeService = traineeService;
        this.courseService = courseService;
    }

    @Transactional(readOnly = true)
    public List<CourseProviderDto> getAllProviders() {
        return providerRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CourseProviderDto getProviderById(Long id) {
        CourseProvider provider = providerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course provider not found with id: " + id));
        return mapToDto(provider);
    }

    @Transactional
    public CourseProviderDto createProvider(CourseProviderDto dto) {
        CourseProvider provider = new CourseProvider(dto.getName(), dto.getContactEmail(), dto.getDescription(), dto.getWebsite());
        provider = providerRepository.save(provider);
        return mapToDto(provider);
    }

    @Transactional
    public CourseProviderDto updateProvider(Long id, CourseProviderDto dto) {
        CourseProvider provider = providerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course provider not found with id: " + id));
        if (dto.getName() != null) provider.setName(dto.getName());
        if (dto.getContactEmail() != null) provider.setContactEmail(dto.getContactEmail());
        if (dto.getDescription() != null) provider.setDescription(dto.getDescription());
        if (dto.getWebsite() != null) provider.setWebsite(dto.getWebsite());
        provider = providerRepository.save(provider);
        return mapToDto(provider);
    }

    @Transactional
    public void deleteProvider(Long id) {
        if (!providerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Course provider not found with id: " + id);
        }
        providerRepository.deleteById(id);
    }

    @Transactional
    public CourseDto addCourse(Long providerId, CourseDto dto) {
        dto.setProviderId(providerId);
        return courseService.createCourse(dto);
    }

    @Transactional
    public CourseDto updateCourse(Long courseId, CourseDto dto) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));
        if (dto.getTitle() != null) course.setTitle(dto.getTitle());
        if (dto.getDescription() != null) course.setDescription(dto.getDescription());
        course = courseRepository.save(course);
        return courseService.mapToDto(course);
    }

    @Transactional
    public void removeCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with id: " + courseId);
        }
        courseRepository.deleteById(courseId);
    }

    @Transactional
    public void kickTrainee(Long courseId, Long traineeId, String kickReason) {
        if (kickReason == null || kickReason.trim().isEmpty()) {
            throw new IllegalArgumentException("Kicking a trainee requires a mandatory reason.");
        }
        CourseEnrollment enrollment = enrollmentRepository.findByTraineeIdAndCourseId(traineeId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Trainee enrollment not found for course id: " + courseId));

        enrollment.setStatus(EnrollmentStatus.KICKED);
        enrollment.setReason(kickReason);
        enrollmentRepository.save(enrollment);
    }

    @Transactional(readOnly = true)
    public List<TraineeProfileDto> getAllTraineesReadOnly() {
        return traineeService.getAllTrainees();
    }

    private CourseProviderDto mapToDto(CourseProvider provider) {
        CourseProviderDto dto = new CourseProviderDto();
        dto.setId(provider.getId());
        dto.setName(provider.getName());
        dto.setContactEmail(provider.getContactEmail());
        dto.setDescription(provider.getDescription());
        dto.setWebsite(provider.getWebsite());
        if (provider.getCourses() != null) {
            dto.setCourses(provider.getCourses().stream().map(courseService::mapToDto).collect(Collectors.toList()));
        }
        return dto;
    }
}
