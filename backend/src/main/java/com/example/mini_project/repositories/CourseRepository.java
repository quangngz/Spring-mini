package com.example.mini_project.repositories;

import com.example.mini_project.entities.course.Course;
import org.springframework.data.repository.CrudRepository;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends CrudRepository<Course, Integer> {
    Optional<Course> findByCourseName(String coursename);
    List<Course> findByCourseNameContaining(String coursename);
    List<Course> findByIsPrivateTrue();
    List<Course> findByIsPrivateFalse();
    List<Course> findByIsPrivateTrueAndCourseNameContaining(String coursename);
    List<Course> findByIsPrivateFalseAndCourseNameContaining(String coursename);
}
