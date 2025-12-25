package com.example.mini_project.entities.usercourse;

import com.example.mini_project.entities.user.User;
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
@Table(name="user_course", uniqueConstraints = {
    @UniqueConstraint(name = "uk_user_course_unique", columnNames = {"user_id", "course_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class UserCourse {

    @EqualsAndHashCode.Include
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="course_id", nullable = false)
    private Course course;

    @Column(name="enrolled_date")
    private LocalDate  enrolledDate;

    @Column(name="role")
    @Enumerated(EnumType.STRING)
    private CourseRole role;
}

