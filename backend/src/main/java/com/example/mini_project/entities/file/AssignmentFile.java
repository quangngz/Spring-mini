package com.example.mini_project.entities.file;

import com.example.mini_project.entities.assignment.Assignment;
import com.example.mini_project.entities.submission.Submission;
import com.example.mini_project.service.S3Service;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class AssignmentFile implements StoredFile{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment", nullable = false)
    private Assignment assignment;

    @Column(nullable = false)
    private String s3Key;

    @Column(nullable = false)
    private String originalFilename;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private Long fileSize;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;


    public static String generateS3Key(Assignment assignment, MultipartFile file) {
        return String.format(
                "assignments/assignment-%d/%s",
                assignment.getId(),
                UUID.randomUUID() + "-" + file.getOriginalFilename()
        );
    }

    public static AssignmentFile build(S3Service s3Service, String s3Key,
                                                     Assignment assignment, MultipartFile file) throws IOException {

        s3Service.uploadFile(
                s3Key,
                file.getInputStream(),
                file.getSize(),
                file.getContentType()
        );

        AssignmentFile assignmentFile = new AssignmentFile();
        assignmentFile.setAssignment(assignment);
        assignmentFile.setS3Key(s3Key);
        assignmentFile.setOriginalFilename(file.getOriginalFilename());
        assignmentFile.setContentType(file.getContentType());
        assignmentFile.setFileSize(file.getSize());
        assignmentFile.setUploadedAt(LocalDateTime.now());
        return assignmentFile;
    }


}
