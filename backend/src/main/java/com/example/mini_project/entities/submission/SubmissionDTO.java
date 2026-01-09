package com.example.mini_project.entities.submission;

import lombok.Getter;
import lombok.Setter;

import java.io.InputStream;
import java.time.LocalDateTime;

@Setter
@Getter
public class SubmissionDTO {
    private Long id;
    private Long assignmentId;
    private String username;
    private String description;
    private LocalDateTime submissionTime;
    private SubmissionStatus status;
    private Double grade;
    private Integer fileCount;
}
