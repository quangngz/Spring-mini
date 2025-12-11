package com.example.mini_project.service;

import com.example.mini_project.entities.User;
import com.example.mini_project.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

// cần tạo thêm class này và class UserDetails để có thể lưu trữ thông tin User mỗi khi client log in hoặc sign in
@Service
@Slf4j
public class CustomUserDetailService implements UserDetailsService {
    private UserRepository userRepository;

    @Autowired
    public CustomUserDetailService(UserRepository userRepository) {
        log.info("Đang khởi tạo CustomUserDetailsSerrvice...");
        this.userRepository = userRepository;
    }
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            throw new UsernameNotFoundException("User không tìm thấy theo username: " + username);
        }
        User user = userOptional.get();
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                user.getAuthorities()
        );
    }
}
