package com.example.mini_project.entities.course;

import lombok.*;

import java.util.List;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CourseDTO {
    private Long id;
    private String courseCode;
    private String courseName;
    private String endDate;
    private Boolean isPrivate;
    private String createdBy;
    private String courseDescription;
}
