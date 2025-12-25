package com.example.mini_project.entities.usercourse;

public class UserCourseDTOMapping {
    public static UserCourseDTO toDTO(UserCourse userCourse) {
        UserCourseDTO result = new UserCourseDTO();
        Long userId = userCourse.getUser().getId();
        result.setId(userCourse.getId());
        result.setUserId(userId);
        result.setUsername(userCourse.getUser().getUsername());
        result.setCourseCode(userCourse.getCourse().getCourseCode());
        result.setRole(userCourse.getRole());
        
        return result; 
    }
}
