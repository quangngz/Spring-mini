package com.example.mini_project.entities.user;

import java.util.List;
import java.util.stream.Collectors;

public class UserDTOMapper {
    public static UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setUsername(user.getUsername());
        dto.setFirstname(user.getFirstname());
        dto.setLastname(user.getLastname());
        dto.setPhone(user.getPhoneNum());
        dto.setAddress(user.getAddress());
        dto.setRole(user.getRole());

        List<EnrolledCourseDTO> courseDTOs = user.getCourses().stream().map(uc -> {
            EnrolledCourseDTO courseDTO = new EnrolledCourseDTO();
            courseDTO.setCourseCode(uc.getCourse().getCourseCode());
            courseDTO.setCourseName(uc.getCourse().getCourseName());
            courseDTO.setCourseRole(uc.getRole().name());
            courseDTO.setEnrolledDate(uc.getEnrolledDate().toString());
            return courseDTO;
        }).collect(Collectors.toList());

        dto.setCourses(courseDTOs);
        return dto;
    }
}
