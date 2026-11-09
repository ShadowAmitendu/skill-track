package com.project.api.core.repository;

import com.project.api.core.entity.EmploymentStatus;
import com.project.api.core.entity.Trainee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TraineeRepository extends JpaRepository<Trainee, Long> {

    Optional<Trainee> findByEmail(String email);

    long countByEmploymentStatus(EmploymentStatus status);

    List<Trainee> findByEmploymentStatus(EmploymentStatus status);

    @Query("SELECT t FROM Trainee t WHERE t.consentGiven = true AND t.allowEmails = true AND t.adminStoppedEmail = false")
    List<Trainee> findTraineesEligibleForEmail();

    @Query("SELECT t FROM Trainee t JOIN t.skills s WHERE s.id = :skillId")
    List<Trainee> findTraineesBySkillId(Long skillId);
}
