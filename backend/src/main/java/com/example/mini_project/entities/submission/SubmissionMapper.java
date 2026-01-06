package com.example.mini_project.entities.submission;

public class SubmissionMapper {
    public static SubmissionDTO toDTO(Submission submission) {
        SubmissionDTO dto = new SubmissionDTO();
        dto.setId(submission.getId());
        dto.setUsername(submission.getUser().getUsername());
        dto.setGrade(submission.getGrade());
        dto.setStatus(submission.getStatus());
        return dto;
    }
}
