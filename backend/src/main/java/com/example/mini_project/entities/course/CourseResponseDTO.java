package com.example.mini_project.entities.course;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponseDTO {
    private Long id;
    private String courseCode;
    private String courseName;
    private String endDate;
    private Boolean isPrivate;
    private String createdBy;
    private String courseDescription;
}
