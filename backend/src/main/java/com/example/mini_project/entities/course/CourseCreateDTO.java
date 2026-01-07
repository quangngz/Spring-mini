package com.example.mini_project.entities.course;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class CourseCreateDTO {
    private String courseCode;
    private String courseName;
    private LocalDate endDate;
    private Boolean isPrivate;
    private String password;
}
