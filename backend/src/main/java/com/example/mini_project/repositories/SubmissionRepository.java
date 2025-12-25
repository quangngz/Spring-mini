package com.example.mini_project.repositories;

import com.example.mini_project.entities.submission.Submission;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SubmissionRepository extends CrudRepository<Submission, Long> {

	// Derived query using nested property traversal
	List<Submission> findByAssignment_Course_CourseCode(String courseCode);

    List<Submission> findByAssignment_Id(Long id);
	boolean existsByUser_IdAndAssignment_Id(Long userId, Long assignmentId);
}
