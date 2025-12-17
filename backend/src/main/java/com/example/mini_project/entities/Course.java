package com.example.mini_project.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name="course")
@Entity
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="course_code", unique = true)
    private String courseCode;

    @Column(name="course_name", unique = true)
    private String courseName;

    @Column(name="end_date")
    private LocalDate endDate;

    // Store user_id của người tạo ra course
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="created_user_id", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy="course", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserCourse> students = new HashSet<>();


    public void addStudent(UserCourse userCourse) {
        this.students.add(userCourse);
        userCourse.setCourse(this);
    }

    public void removeStudent(UserCourse userCourse) {
        this.students.remove(userCourse);
        userCourse.setCourse(null);
    }
}
