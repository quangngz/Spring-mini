package com.example.mini_project.entities.submission;

import com.example.mini_project.entities.User;
import com.example.mini_project.entities.assignment.Assignment;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="submissions")
public class Submission {
    @EmbeddedId
    private SubmissionId submissionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name="user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("assignmentId")
    @JoinColumns({
        @JoinColumn(name = "course_id", referencedColumnName = "course_id"),
        @JoinColumn(name = "assignment_id", referencedColumnName = "assignment_id")
    })
    private Assignment assignment;

    @Column(nullable = false)
    private LocalDateTime submissionTime;

    private Double grade;

    public Submission(User user, Assignment assignment) {
        this.user = user;
        this.assignment = assignment;
        this.submissionId = new SubmissionId(
                user.getId(),
                assignment.getAssignmentId()
        );
    }
}
