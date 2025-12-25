package com.example.mini_project.repositories;

import com.example.mini_project.entities.assignment.Assignment;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface AssignmentRepository extends CrudRepository<Assignment, Long> {
    public List<Assignment> findByCourse_CourseCode(String CourseCode);
}
