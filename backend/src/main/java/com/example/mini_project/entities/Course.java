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
    private Long created_user_id;

    @OneToMany(mappedBy="course")
    private Set<UserCourse> students = new HashSet<>();

}
