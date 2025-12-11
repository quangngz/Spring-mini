package com.example.mini_project.controllers;

import com.example.mini_project.entities.User;
import com.example.mini_project.repositories.UserRepository;
import com.example.mini_project.security.JwtUtil;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/auth")
public class AuthController {
    private PasswordEncoder encoder;
    private AuthenticationManager authenticationManager;
    private JwtUtil jwtUtil;
    private UserRepository userRepository;

    // Can add @Autowired neu 1 class gom nhieu constructor de chon cai nao duoc uu tien
    @Autowired
    public AuthController(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            PasswordEncoder encoder,
            JwtUtil jwtUtil
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/signin")
    public String authentication(@RequestBody SigninRequest req) {
        Authentication authentication = authenticationManager.authenticate(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        req.getUsername(),
                        req.getPassword()
                )
        );

        final UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        return jwtUtil.generateToken(userDetails.getUsername());
    }

    @PostMapping("/signup")
    public String registerUser(@RequestBody @Validated User user,
                               BindingResult bindingResult) throws BindException{
        if (bindingResult.hasErrors()) {
            throw new BindException(bindingResult);
        }
        if (userRepository.existsByUsername(user.getUsername())) {
            return "User đã tồn tại!";
        }

        if (user.getPassword() != null) {
            user.setPassword(encoder.encode(user.getPassword()));
        }
        if (user.getAuthorities().isEmpty()) {
            user.addRole("USER");
        }

        userRepository.save(user);
        return "User đăng ký tài khoản thành công!";
    }
}

@Data
class SigninRequest {
    @NotNull
    private String username;
    @NotNull
    private String password;
}
