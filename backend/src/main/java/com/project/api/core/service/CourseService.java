package com.project.api.core.service;

import com.project.api.common.ResourceNotFoundException;
import com.project.api.core.dto.CourseDto;
import com.project.api.core.dto.SkillSummaryDto;
import com.project.api.core.entity.Course;
import com.project.api.core.entity.CourseProvider;
import com.project.api.core.entity.Skill;
import com.project.api.core.entity.Trainee;
import com.project.api.core.repository.CourseProviderRepository;
import com.project.api.core.repository.CourseRepository;
import com.project.api.core.repository.SkillRepository;
import com.project.api.core.repository.TraineeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseProviderRepository providerRepository;
    private final SkillRepository skillRepository;
    private final TraineeRepository traineeRepository;

    public CourseService(CourseRepository courseRepository,
                         CourseProviderRepository providerRepository,
                         SkillRepository skillRepository,
                         TraineeRepository traineeRepository) {
        this.courseRepository = courseRepository;
        this.providerRepository = providerRepository;
        this.skillRepository = skillRepository;
        this.traineeRepository = traineeRepository;
    }

    @Transactional(readOnly = true)
    public List<CourseDto> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CourseDto> getCoursesByProvider(Long providerId) {
        return courseRepository.findByProviderId(providerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CourseDto createCourse(CourseDto dto) {
        CourseProvider provider = providerRepository.findById(dto.getProviderId())
                .orElseThrow(() -> new ResourceNotFoundException("Course provider not found with id: " + dto.getProviderId()));

        Course course = new Course(dto.getTitle(), dto.getDescription(), provider);

        if (dto.getSkillsTaught() != null) {
            Set<Skill> skills = new HashSet<>();
            for (String skillName : dto.getSkillsTaught()) {
                Skill skill = skillRepository.findByNameIgnoreCase(skillName.trim())
                        .orElseGet(() -> skillRepository.save(new Skill(skillName.trim(), "General")));
                skills.add(skill);
            }
            course.setSkillsTaught(skills);
        }

        course = courseRepository.save(course);
        return mapToDto(course);
    }

    @Transactional(readOnly = true)
    public List<SkillSummaryDto> getSkillsSummary() {
        return skillRepository.findAll().stream().map(skill -> {
            List<Trainee> trainees = traineeRepository.findTraineesBySkillId(skill.getId());
            List<String> traineeNames = trainees.stream().map(Trainee::getFullName).collect(Collectors.toList());
            return new SkillSummaryDto(
                    skill.getId(),
                    skill.getName(),
                    skill.getCategory(),
                    traineeNames.size(),
                    traineeNames
            );
        }).collect(Collectors.toList());
    }

    public CourseDto mapToDto(Course course) {
        CourseDto dto = new CourseDto();
        dto.setId(course.getId());
        dto.setTitle(course.getTitle());
        dto.setDescription(course.getDescription());
        dto.setProviderId(course.getProvider().getId());
        dto.setProviderName(course.getProvider().getName());
        dto.setSkillsTaught(course.getSkillsTaught().stream().map(Skill::getName).collect(Collectors.toList()));
        return dto;
    }
}
