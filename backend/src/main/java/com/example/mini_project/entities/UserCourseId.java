package com.example.mini_project.entities;

import jakarta.persistence.Embeddable;

import java.io.Serializable;

@Embeddable
public class UserCourseId implements Serializable {

    private Long userId;
    private Long courseId;
}
