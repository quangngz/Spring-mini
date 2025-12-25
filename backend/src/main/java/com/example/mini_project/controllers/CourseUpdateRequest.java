package com.example.mini_project.controllers;

import com.example.mini_project.entities.course.Course;
import jakarta.validation.Valid;
import lombok.Getter;


public record CourseUpdateRequest(@Valid Course course, String oldPassword, String password1, String password2) {}
