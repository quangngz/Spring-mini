package com.example.mini_project.entities.assignment;


import com.example.mini_project.entities.course.Course;
import com.example.mini_project.entities.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="assignments")
public class Assignment {
    @EmbeddedId
    private AssignmentId assignmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("courseId")
    @JoinColumn(name = "course_id")
    private Course course;

    private String assignmentName;

    private LocalDateTime assignmentDue;

    private Double assignmentWeight;

    // Store user_id của người tạo ra assignment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="assignment_created_by", nullable = false)
    private User createdBy;
}
