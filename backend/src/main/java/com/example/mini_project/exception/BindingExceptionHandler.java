package com.example.mini_project.exception;

import com.example.mini_project.entities.ResponseDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class BindingExceptionHandler {

    @ExceptionHandler(BindException.class)
    public ResponseEntity<ResponseDTO<Void>> handleBindingException(BindException bindException) {
        String message = bindException.getBindingResult().getFieldErrors()
                .stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseDTO<>(message, null));
    }
}
