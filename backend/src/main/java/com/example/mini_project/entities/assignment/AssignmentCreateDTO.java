package com.example.mini_project.entities.assignment;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentCreateDTO {

    @NotNull
    private String assignmentName;

    @NotNull
    private LocalDateTime assignmentDue;

    @NotNull
    private Double assignmentWeight;
}
