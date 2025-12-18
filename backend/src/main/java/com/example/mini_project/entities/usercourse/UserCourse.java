package com.example.mini_project.entities.usercourse;

import com.example.mini_project.entities.User;
import com.example.mini_project.entities.course.Course;
import com.example.mini_project.entities.course.CourseRole;
import jakarta.persistence.*;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name="user_course")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class UserCourse {

    @EqualsAndHashCode.Include
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
    private LocalDate  enrolledDate;

    @Column(name="role")
    @Enumerated(EnumType.STRING)
    private CourseRole role;
}

