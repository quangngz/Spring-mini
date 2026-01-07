package com.example.mini_project.entities.submission;

import com.example.mini_project.entities.file.SubmissionFile;
import com.example.mini_project.entities.user.User;
import com.example.mini_project.entities.assignment.Assignment;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

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
    private Double grade;

    @OneToMany(
            mappedBy = "submission",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<SubmissionFile> files = new LinkedList<>();


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status;


    public void addFile(SubmissionFile file) {
        files.add(0,file);
        file.setSubmission(this);
    }
}


