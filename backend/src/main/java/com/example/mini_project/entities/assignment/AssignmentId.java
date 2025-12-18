package com.example.mini_project.entities.assignment;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class AssignmentId implements Serializable {
    @EqualsAndHashCode.Include
    @Column(name = "assignment_id")
    private Long assignmentId;

    @EqualsAndHashCode.Include
    @Column(name = "course_id")
    private Long courseId;
}
