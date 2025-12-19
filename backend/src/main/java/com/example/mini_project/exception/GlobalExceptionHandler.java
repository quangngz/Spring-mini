package com.example.mini_project.exception;

import com.example.mini_project.entities.ResponseDTO;
import com.example.mini_project.entities.usercourse.UserCourse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BindException.class)
    public ResponseEntity<ResponseDTO<Void>> handleBindingException(BindException bindException) {
        String message = bindException.getBindingResult().getFieldErrors()
                .stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseDTO<>(message, null));
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ResponseDTO<UserCourse>> handleUserNotFoundException(UserNotFoundException ex) {
        return buildUserCourseResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), null);
    }

    @ExceptionHandler(CourseNotFoundException.class)
    public ResponseEntity<ResponseDTO<UserCourse>> handleCourseNotFoundException(CourseNotFoundException ex) {
        return buildUserCourseResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), null);
    }

    public ResponseEntity<ResponseDTO<UserCourse>> buildUserCourseResponse(HttpStatus status, String message,
                                                                           UserCourse usercourse) {
        return ResponseEntity.status(status).body(new ResponseDTO<>(message, usercourse));
    }
}
