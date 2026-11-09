package com.project.api.core.repository;

import com.project.api.core.entity.CourseProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CourseProviderRepository extends JpaRepository<CourseProvider, Long> {

    Optional<CourseProvider> findByContactEmail(String contactEmail);
}
