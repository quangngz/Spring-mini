package com.example.mini_project.entities.usercourse;

import com.example.mini_project.entities.course.CourseRole;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserCourseDTO {
    private Long id;
    private Long userId;
    private String username;
    private String courseCode;
    private CourseRole role;
}


