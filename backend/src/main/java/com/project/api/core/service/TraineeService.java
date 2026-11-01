package com.project.api.core.service;

import com.project.api.common.ResourceNotFoundException;
import com.project.api.core.dto.TraineeProfileDto;
import com.project.api.core.dto.TraineeRequestDto;
import com.project.api.core.entity.Course;
import com.project.api.core.entity.CourseEnrollment;
import com.project.api.core.entity.EnrollmentStatus;
import com.project.api.core.entity.FollowUp;
import com.project.api.core.entity.Skill;
import com.project.api.core.entity.Trainee;
import com.project.api.core.repository.CourseEnrollmentRepository;
import com.project.api.core.repository.CourseRepository;
import com.project.api.core.repository.TraineeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TraineeService {

    private final TraineeRepository traineeRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;

    public TraineeService(TraineeRepository traineeRepository,
                          CourseRepository courseRepository,
                          CourseEnrollmentRepository enrollmentRepository) {
        this.traineeRepository = traineeRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    @Transactional(readOnly = true)
    public List<TraineeProfileDto> getAllTrainees() {
        return traineeRepository.findAll().stream()
                .map(this::mapToProfileDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TraineeProfileDto getTraineeProfile(Long id) {
        Trainee trainee = traineeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trainee not found with id: " + id));
        return mapToProfileDto(trainee);
    }

    @Transactional
    public TraineeProfileDto createTrainee(TraineeRequestDto dto) {
        Trainee trainee = new Trainee();
        applyRequestToEntity(dto, trainee);
        trainee = traineeRepository.save(trainee);
        return mapToProfileDto(trainee);
    }

    @Transactional
    public TraineeProfileDto updateTrainee(Long id, TraineeRequestDto dto) {
        Trainee trainee = traineeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trainee not found with id: " + id));
        applyRequestToEntity(dto, trainee);
        trainee = traineeRepository.save(trainee);
        return mapToProfileDto(trainee);
    }

    @Transactional
    public void deleteTrainee(Long id) {
        if (!traineeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Trainee not found with id: " + id);
        }
        traineeRepository.deleteById(id);
    }

    @Transactional
    public void updateConsentStatus(Long traineeId, boolean consentGiven) {
        Trainee trainee = traineeRepository.findById(traineeId)
                .orElseThrow(() -> new ResourceNotFoundException("Trainee not found with id: " + traineeId));
        trainee.setConsentGiven(consentGiven);
        traineeRepository.save(trainee);
    }

    @Transactional
    public void updateEmailPreference(Long traineeId, boolean allowEmails) {
        Trainee trainee = traineeRepository.findById(traineeId)
                .orElseThrow(() -> new ResourceNotFoundException("Trainee not found with id: " + traineeId));
        trainee.setAllowEmails(allowEmails);
        traineeRepository.save(trainee);
    }

    @Transactional
    public void removeEmploymentInfo(Long traineeId, boolean forbidEmails) {
        Trainee trainee = traineeRepository.findById(traineeId)
                .orElseThrow(() -> new ResourceNotFoundException("Trainee not found with id: " + traineeId));
        trainee.setCompanyName(null);
        trainee.setCurrentRole(null);
        trainee.setCurrentSalary(null);
        trainee.setSalaryProgression(null);
        trainee.setUnemployedReason(null);
        if (forbidEmails) {
            trainee.setAllowEmails(false);
        }
        traineeRepository.save(trainee);
    }

    @Transactional
    public void enrollCourse(Long traineeId, Long courseId) {
        Trainee trainee = traineeRepository.findById(traineeId)
                .orElseThrow(() -> new ResourceNotFoundException("Trainee not found with id: " + traineeId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        enrollmentRepository.findByTraineeIdAndCourseId(traineeId, courseId).ifPresent(e -> {
            throw new IllegalArgumentException("Trainee is already enrolled in this course");
        });

        CourseEnrollment enrollment = new CourseEnrollment(trainee, course);
        enrollmentRepository.save(enrollment);
    }

    @Transactional
    public void dropCourse(Long traineeId, Long courseId, String dropReason) {
        if (dropReason == null || dropReason.trim().isEmpty()) {
            throw new IllegalArgumentException("Dropping a course requires a mandatory reason.");
        }
        CourseEnrollment enrollment = enrollmentRepository.findByTraineeIdAndCourseId(traineeId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found for course id: " + courseId));

        enrollment.setStatus(EnrollmentStatus.DROPPED);
        enrollment.setReason(dropReason);
        enrollmentRepository.save(enrollment);
    }

    @Transactional
    public void completeCourse(Long traineeId, Long courseId) {
        CourseEnrollment enrollment = enrollmentRepository.findByTraineeIdAndCourseId(traineeId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found for course id: " + courseId));

        enrollment.setStatus(EnrollmentStatus.COMPLETED);
        enrollment.setCompletedAt(LocalDateTime.now());
        enrollmentRepository.save(enrollment);

        // Add course skills to trainee earned skills
        Trainee trainee = enrollment.getTrainee();
        Course course = enrollment.getCourse();
        trainee.getSkills().addAll(course.getSkillsTaught());
        traineeRepository.save(trainee);
    }

    private void applyRequestToEntity(TraineeRequestDto dto, Trainee trainee) {
        if (dto.getFullName() != null) trainee.setFullName(dto.getFullName());
        if (dto.getEmail() != null) trainee.setEmail(dto.getEmail());
        if (dto.getPhoneNumber() != null) trainee.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getConsentGiven() != null) trainee.setConsentGiven(dto.getConsentGiven());
        if (dto.getAllowEmails() != null) trainee.setAllowEmails(dto.getAllowEmails());
        if (dto.getEmploymentStatus() != null) trainee.setEmploymentStatus(dto.getEmploymentStatus());
        if (dto.getCompanyName() != null) trainee.setCompanyName(dto.getCompanyName());
        if (dto.getCurrentRole() != null) trainee.setCurrentRole(dto.getCurrentRole());
        if (dto.getCurrentSalary() != null) trainee.setCurrentSalary(dto.getCurrentSalary());
        if (dto.getSalaryProgression() != null) trainee.setSalaryProgression(dto.getSalaryProgression());
        if (dto.getUnemployedReason() != null) trainee.setUnemployedReason(dto.getUnemployedReason());
        if (dto.getProjectsSummary() != null) trainee.setProjectsSummary(dto.getProjectsSummary());
        if (dto.getProjectRepoUrl() != null) trainee.setProjectRepoUrl(dto.getProjectRepoUrl());
    }

    public TraineeProfileDto mapToProfileDto(Trainee trainee) {
        TraineeProfileDto dto = new TraineeProfileDto();
        dto.setId(trainee.getId());
        dto.setFullName(trainee.getFullName());
        dto.setEmail(trainee.getEmail());
        dto.setPhoneNumber(trainee.getPhoneNumber());
        dto.setConsentGiven(trainee.isConsentGiven());
        dto.setAllowEmails(trainee.isAllowEmails());
        dto.setAdminStoppedEmail(trainee.isAdminStoppedEmail());
        dto.setEmploymentStatus(trainee.getEmploymentStatus());
        dto.setCompanyName(trainee.getCompanyName());
        dto.setCurrentRole(trainee.getCurrentRole());
        dto.setCurrentSalary(trainee.getCurrentSalary());
        dto.setSalaryProgression(trainee.getSalaryProgression());
        dto.setUnemployedReason(trainee.getUnemployedReason());
        dto.setProjectsSummary(trainee.getProjectsSummary());
        dto.setProjectRepoUrl(trainee.getProjectRepoUrl());

        dto.setSkills(trainee.getSkills().stream().map(Skill::getName).collect(Collectors.toList()));
        dto.setCertifications(trainee.getCertifications().stream().map(c -> c.getTitle()).collect(Collectors.toList()));
        dto.setEnrolledCourses(trainee.getEnrollments().stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ENROLLED)
                .map(e -> e.getCourse().getTitle()).collect(Collectors.toList()));
        dto.setCompletedCourses(trainee.getEnrollments().stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.COMPLETED)
                .map(e -> e.getCourse().getTitle()).collect(Collectors.toList()));
        dto.setFollowUpNotes(trainee.getFollowUps().stream().map(FollowUp::getNotes).collect(Collectors.toList()));

        return dto;
    }
}
