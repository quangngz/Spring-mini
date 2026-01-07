package com.example.mini_project.entities.assignment;

public class AssignmentResponseDTOMapper {
    public static AssignmentResponseDTO toDTO(Assignment assignment) {
        AssignmentResponseDTO result = new AssignmentResponseDTO();
        result.setId(assignment.getId());
        result.setAssignmentName(assignment.getAssignmentName());
        result.setAssignmentDue(assignment.getAssignmentDue().toString());
        result.setCreatedBy(assignment.getCreatedBy().getUsername());
        result.setCourseCode(assignment.getCourse().getCourseCode());
        result.setAssignmentWeight(assignment.getAssignmentWeight());
        return result;
    }
}
