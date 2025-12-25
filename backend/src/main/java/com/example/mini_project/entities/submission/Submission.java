package com.example.mini_project.entities.submission;

import com.example.mini_project.entities.user.User;
import com.example.mini_project.entities.assignment.Assignment;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="submissions",
        uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "assignment_id"})
})

public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(nullable = false)
    private LocalDateTime submissionTime;

    private Double grade;

    // TODO: tương lai sẽ đổi cái này lại thành file
    private String content;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status;
}


