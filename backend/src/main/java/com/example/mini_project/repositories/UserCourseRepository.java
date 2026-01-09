package com.example.mini_project.repositories;

import com.example.mini_project.entities.usercourse.UserCourse;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserCourseRepository extends CrudRepository<UserCourse, Long> {
    void deleteAllByUser_Id(Long userId);

    void deleteAllByCourse_Id(Long courseId);

    boolean existsByUser_IdAndCourse_Id(Long userId, Long courseId);

    Optional<UserCourse> findByUser_IdAndCourse_Id(Long userId, Long courseId);

    Optional<UserCourse> findByUser_UsernameAndCourse_Id(String username, Long courseId);

    // Convention: Sử dụng findAll khi fetch từ 1 field one to many
    List<UserCourse> findAllByUser_Id(Long id);
}
