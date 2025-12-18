package com.example.mini_project.entities.course;

import com.example.mini_project.entities.User;
import com.example.mini_project.entities.usercourse.UserCourse;
import com.example.mini_project.entities.assignment.Assignment;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name="courses")
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

    private Boolean isPrivate;
    // Store user_id của người tạo ra course
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="created_user_id", nullable = false)
    private User createdBy;

    @OneToMany(mappedBy="course", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserCourse> students = new HashSet<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assignment> assignmentList = new ArrayList<>();


    public void addStudent(UserCourse userCourse) {
        this.students.add(userCourse);
        userCourse.setCourse(this);
    }

    public void removeStudent(UserCourse userCourse) {
        this.students.remove(userCourse);
        userCourse.setCourse(null);
    }

    public void addAssignment(Assignment assignment) {
        this.assignmentList.add(assignment);
        assignment.setCourse(this);
    }

    public Double totalAssignmentWeight() {
        Double result = 0.0;
        for (Assignment a : assignmentList) {
            result += a.getAssignmentWeight();
        }
        return result;
    }
}
