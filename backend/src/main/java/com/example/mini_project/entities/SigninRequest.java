package com.example.mini_project.entities;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SigninRequest {
    @NotNull
    private String username;
    @NotNull
    private String password;
}
