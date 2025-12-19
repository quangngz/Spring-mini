package com.example.mini_project.repositories;

import com.example.mini_project.entities.course.Course;
import com.example.mini_project.entities.usercourse.UserCourse;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends CrudRepository<Course, Long> {
    Optional<Course> findByCourseCode(String courseCode);
    List<Course> findByIsPrivate(Boolean isPrivate);
    @Query("""
        SELECT c FROM Course c 
        LEFT JOIN c.createdBy u
        WHERE (:q IS NULL
              OR LOWER(c.courseName) LIKE LOWER(CONCAT('%', :q, '%'))
              OR LOWER(c.courseCode) LIKE LOWER(CONCAT('%', :q, '%'))
              OR LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%')))
          AND (:isPrivate IS NULL OR c.isPrivate = :isPrivate)
    """)
    List<Course> search(
                    @Param("q") String q,
                    @Param("isPrivate") Boolean isPrivate
            );
}
