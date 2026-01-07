package com.example.mini_project.entities.course;

public class CourseResponseDTOMapper {
    public static CourseResponseDTO toDTO(Course course) {
        CourseResponseDTO dto = new CourseResponseDTO();
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
