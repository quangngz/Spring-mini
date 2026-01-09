package com.example.mini_project.repositories;

import com.example.mini_project.entities.course.Course;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends CrudRepository<Course, Long> {
    Optional<Course> findById(Long id);

    Optional<Course> findByCourseCode(String code);

    List<Course> findByIsPrivate(Boolean isPrivate);

    @Query("""
            SELECT c FROM Course c
            LEFT JOIN c.createdBy u
            WHERE (
                :q IS NULL
                OR LOWER(c.courseName) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))
                OR LOWER(c.courseCode) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))
                OR LOWER(u.username) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%'))
            )
            AND (:isPrivate IS NULL OR c.isPrivate = :isPrivate)
            """)
    List<Course> search(
            @Param("q") String q,
            @Param("isPrivate") Boolean isPrivate
    );


    // Luật viết JPQL: Khi join không cần dùng ON, và phải sử dụng class attributes chứ kh phải column name
    @Query("SELECT COALESCE(SUM(s.grade * a.assignmentWeight / 100), 0) " +
            " FROM Submission s" +
            " JOIN s.assignment a" +
            " JOIN a.course c" +
            " WHERE c.id = :courseId" +
            " AND s.user.id = :userId")
    Double getTotalWeightedScore(@Param("userId") Long userId, @Param("courseId") Long courseId);
}
