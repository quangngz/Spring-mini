package com.example.mini_project.entities.submission;

import com.example.mini_project.entities.file.SubmissionFile;

public class SubmissionMapper {
    public static SubmissionDTO toDTO(Submission submission) {
        SubmissionDTO dto = new SubmissionDTO();
        dto.setId(submission.getId());
        dto.setAssignmentId(submission.getAssignment() != null ? submission.getAssignment().getId() : null);
        dto.setUsername(submission.getUser().getUsername());
        dto.setGrade(submission.getGrade());
        dto.setStatus(submission.getStatus());
        dto.setFileCount(submission.getFiles() != null ? submission.getFiles().size() : 0);
        dto.setDescription(submission.getDescription());
        dto.setSubmissionTime(submission.getSubmissionTime());
        
        return dto;
    }
}
