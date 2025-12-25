package com.example.mini_project.entities.user;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
    private String username;
    private String firstname;
    private String lastname;
    private String phone;
    private String address;
    private Set<String> role;
    private List<EnrolledCourseDTO> courses;
}


