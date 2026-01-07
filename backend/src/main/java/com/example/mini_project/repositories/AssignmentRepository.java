package com.example.mini_project.repositories;

import com.example.mini_project.entities.assignment.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;

import java.util.List;
import java.util.Optional;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    public List<Assignment> findByCourse_Id(Long id);
}
