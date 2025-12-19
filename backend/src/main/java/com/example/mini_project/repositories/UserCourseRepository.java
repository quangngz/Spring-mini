package com.example.mini_project.repositories;

import com.example.mini_project.entities.usercourse.UserCourse;
import com.example.mini_project.entities.usercourse.UserCourseId;
import org.springframework.data.repository.CrudRepository;

import java.util.List;
import java.util.Optional;

public interface UserCourseRepository extends CrudRepository<UserCourse, UserCourseId> {
    void deleteAllByUser_Id(Long userId);
    void deleteAllByCourse_Id(Long courseId);

    void deleteById(UserCourseId id);
    boolean existsById(UserCourseId id);


    Optional<UserCourse> findById(UserCourseId id);

}
