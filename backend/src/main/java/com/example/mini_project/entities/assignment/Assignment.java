package com.example.mini_project.entities.assignment;


import com.example.mini_project.entities.course.Course;
import com.example.mini_project.entities.file.AssignmentFile;
import com.example.mini_project.entities.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="assignments")
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    private String assignmentName;

    private LocalDateTime assignmentDue;

    private Double assignmentWeight;

    // Store user_id của người tạo ra assignment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="assignment_created_by", nullable = false)
    private User createdBy;

    // S3 file meta data
    @OneToMany(
            mappedBy = "assignment",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<AssignmentFile> files = new ArrayList<>();

    private String objectKey; // Lấy từ S3.

    private ContentType contentType;


    public void addFile(AssignmentFile file) {
        this.files.add(0, file);
    }
}

