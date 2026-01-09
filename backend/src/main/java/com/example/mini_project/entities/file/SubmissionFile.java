package com.example.mini_project.entities.file;


import com.example.mini_project.entities.submission.Submission;
import com.example.mini_project.service.S3Service;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * One to many relationship, Submission 1---*Submisisonfile
 *
 */
@Setter
@Getter
@Entity
public class SubmissionFile implements StoredFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

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

    public static String generateS3Key(Submission context, MultipartFile file) {
        return String.format(
                "submissions/assignment-%d/user-%d/submission-%d/%s",
                context.getAssignment().getId(),
                context.getUser().getId(),
                context.getId(),
                UUID.randomUUID() + "-" + file.getOriginalFilename()
        );
    }

    public static SubmissionFile buildSubmissionFile(S3Service s3Service, String s3Key,
                                                     Submission submission, MultipartFile file) throws IOException {

        s3Service.uploadFile(
                s3Key,
                file.getInputStream(),
                file.getSize(),
                file.getContentType()
        );

        SubmissionFile submissionFile = new SubmissionFile();
        submissionFile.setSubmission(submission);
        submissionFile.setS3Key(s3Key);
        submissionFile.setOriginalFilename(file.getOriginalFilename());
        submissionFile.setContentType(file.getContentType());
        submissionFile.setFileSize(file.getSize());
        submissionFile.setUploadedAt(LocalDateTime.now());
        return submissionFile;
    }
}
