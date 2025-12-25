package com.example.mini_project.entities.user;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EnrolledCourseDTO {
    private String courseCode;
    private String courseName;
    private String courseRole;
    private String enrolledDate;
}