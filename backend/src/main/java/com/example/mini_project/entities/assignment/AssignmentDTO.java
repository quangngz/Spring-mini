package com.example.mini_project.entities.assignment;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentDTO {
    private Long id;
    private String assignmentName;
    private String assignmentDue;
    private Double assignmentWeight;
    private String courseCode;
    private String createdBy;
}


