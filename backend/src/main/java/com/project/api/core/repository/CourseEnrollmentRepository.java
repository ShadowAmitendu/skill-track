package com.project.api.core.repository;

import com.project.api.core.entity.CourseEnrollment;
import com.project.api.core.entity.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {

    List<CourseEnrollment> findByTraineeId(Long traineeId);

    List<CourseEnrollment> findByCourseId(Long courseId);

    List<CourseEnrollment> findByCourseIdAndStatus(Long courseId, EnrollmentStatus status);

    Optional<CourseEnrollment> findByTraineeIdAndCourseId(Long traineeId, Long courseId);
}
