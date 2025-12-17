package com.example.mini_project.entities;

import jakarta.persistence.*;

import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(name="user_course")
public class UserCourse {
    @EmbeddedId
    private UserCourseId userCourseId;

    @ManyToOne
    @MapsId("userId")
    @JoinColumn(name="user_id")
    private User user;

    @ManyToOne
    @MapsId("courseId")
    @JoinColumn(name="course_id")
    private Course course;

    @Column(name="enrolled_date")
    private LocalDate enrolledDate;

    @Column(name="role")
    private String role;
}

