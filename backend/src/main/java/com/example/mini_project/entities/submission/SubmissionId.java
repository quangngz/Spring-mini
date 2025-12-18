package com.example.mini_project.entities.submission;

import com.example.mini_project.entities.assignment.AssignmentId;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class SubmissionId implements Serializable {
    @EqualsAndHashCode.Include
    @Column(name = "user_id")
    private Long userId;

    @EqualsAndHashCode.Include
    private AssignmentId assignmentId;
}
