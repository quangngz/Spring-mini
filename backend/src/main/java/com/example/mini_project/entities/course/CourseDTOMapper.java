package com.example.mini_project.entities.course;

import java.time.LocalDateTime;

public class CourseDTOMapper {
    public static CourseDTO toDTO(Course course) {
        CourseDTO dto = new CourseDTO();
        dto.setId(course.getId());
        dto.setCourseCode(course.getCourseCode());
        dto.setCourseName(course.getCourseName());
        dto.setEndDate(course.getEndDate().toString());
        dto.setIsPrivate(course.getIsPrivate());
        dto.setCreatedBy(course.getCreatedBy().getUsername());
        dto.setCourseDescription(course.getCourseDescription());
        return dto;
    }
}
