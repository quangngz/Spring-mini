package com.example.mini_project.entities.assignment;

public class AssignmentDTOMapper {
    public static AssignmentDTO toDTO(Assignment assignment) {
        AssignmentDTO result = new AssignmentDTO();
        result.setId(assignment.getId());
        result.setAssignmentName(assignment.getAssignmentName());
        result.setAssignmentDue(assignment.getAssignmentDue().toString());
        result.setCreatedBy(assignment.getCreatedBy().getUsername());
        result.setCourseCode(assignment.getCourse().getCourseCode());
        result.setAssignmentWeight(assignment.getAssignmentWeight());
        return result;
    }
}
