package com.example.mini_project.controllers;
import com.example.mini_project.entities.ResponseDTO;
import com.example.mini_project.entities.User;
import com.example.mini_project.repositories.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/users")
public class UserController {
    private final UserRepository userRepository;
    private final PasswordEncoder encoder;

    public UserController(UserRepository userRepository, PasswordEncoder encoder) {
        this.userRepository = userRepository;
        this.encoder = encoder;
    }

    @GetMapping()
    public ResponseEntity<ResponseDTO<Iterable<User>>> getUsers() {
        Iterable<User> users = userRepository.findAll();
        return buildResponse(HttpStatus.OK, "Lấy dữ liệu thành công", users);
    }


    @GetMapping("/search")
    public ResponseEntity<ResponseDTO<List<User>>> searchPeople(
//            @RequestParam(name="username", required = false) String username,
            @RequestParam(name="firstname", required = false) String firstname,
            @RequestParam(name="lastname", required = false) String lastname,
            @RequestParam(name="phoneNum", required = false) String phoneNum,
            @RequestParam(name="address", required = false) String address,
            @RequestParam(name="age", required = false) Integer age,
            @RequestParam(name="city", required = false) String cityname
    ) {
        LocalDate begin = null;
        LocalDate end = null;
        if (age != null) {
            begin = LocalDate.now().minusYears(age + 1).plusDays(1);
            end = LocalDate.now().minusYears(age);
        }
        List<User> results = userRepository.searchByCustom(firstname, lastname, address, phoneNum, cityname, begin, end);
        return buildResponse(HttpStatus.OK, "Tìm kiếm thành công!", results);
    }

    @GetMapping("/{username}")
    public ResponseEntity<ResponseDTO<User>> getByUsername(@PathVariable("username") String username) {
        return userRepository.findByUsername(username)
                .map(user -> buildResponse(HttpStatus.OK, "User fetched successfully", user))
                .orElseGet(() -> buildResponse(HttpStatus.NOT_FOUND, "User not found", null));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/create")
    public ResponseEntity<ResponseDTO<User>> createNewUser(@RequestBody @Validated User user, BindingResult bindingResult)
    throws  BindException{
        if (bindingResult.hasErrors()) {
            throw new BindException(bindingResult);
     }
        user.setPassword(encoder.encode(user.getPassword()));
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole(
                    user.getAuthorities().stream()
                            .map(grantedAuthority -> grantedAuthority.getAuthority())
                            .collect(Collectors.toSet())
            );
        }
        User saved = userRepository.save(user);
        return buildResponse(HttpStatus.CREATED, "User created successfully", saved);
    }

    /**
     * Chỉ thay đổi được nếu là admin or là chủ sở hữu thông tin
     */
    @PutMapping("/update/{username}")
    public ResponseEntity<ResponseDTO<User>> updateUser(@PathVariable("username") String username, @RequestBody User user,
                                                        Authentication auth, HttpServletRequest request) {
        log.info("Received request URI: {}", request.getRequestURI());
        log.info("Path variable username: {}", username);
        if (!isOwnerOrAdmin(auth, username)) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Bạn chỉ có thể edit thông tin của bạn!", null);
        }
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isEmpty()) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Không có gì để update", null);
        }
        User updatedUser = getUser(user, userOptional);
        if (user.getPassword() != null) {
            updatedUser.setPassword(encoder.encode(user.getPassword()));
        }
        userRepository.save(updatedUser);
        return buildResponse(HttpStatus.OK, "Thay đổi thông tin thành công!", updatedUser);
    }
    // Helper method
    private User getUser(User user, Optional<User> userOptional) {
        User updatedUser = userOptional.get();
        if (user.getAddress() != null && !user.getAddress().isEmpty()) {
            updatedUser.setAddress(user.getAddress());
        }
        if (user.getDob() != null) {
            updatedUser.setDob(user.getDob());
        }
        if (user.getFirstname() != null && !user.getFirstname().isEmpty()) {
            updatedUser.setFirstname(user.getFirstname());
        }
        if (user.getLastname() != null && !user.getLastname().isEmpty()) {
            updatedUser.setLastname(user.getLastname());
        }
        if (user.getPhoneNum() != null && !user.getPhoneNum().isEmpty()) {
            updatedUser.setPhoneNum(user.getPhoneNum());
        }
        return updatedUser;
    }

    /**
     * Helper method, check principal của authentication với 1 entry fetch từ db theo username.
     * Note: auth la mot object duoc tao ra tu token?
     * @param auth
     * @param updateUsername
     * @return
     */
    private boolean isOwnerOrAdmin(Authentication auth, String updateUsername) {
        boolean isAdmin =  auth.getAuthorities().stream()
                .anyMatch(a->a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return true;
        Object principal = auth.getPrincipal();

        boolean isOwner = false;
        if (principal instanceof UserDetails userDetails) {
            isOwner = updateUsername.equals(userDetails.getUsername());
        }
        if (principal instanceof String p) {
            isOwner = updateUsername.equals(p);
        }
        if (isOwner) log.info("User là chủ sở hữu"); // debug
        else log.info("User không phải chủ sở hữu"); // debug
        return isOwner;
    }

    @DeleteMapping("/delete/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<User>> deleteUser(@PathVariable("username") String username, Authentication auth){
        Optional<User> optionalUser = userRepository.findByUsername(username);
        if (optionalUser.isEmpty()) {
            return buildResponse(HttpStatus.BAD_REQUEST, "User không tồn tại để xóa", null);
        }

        User user = optionalUser.get();
        boolean containAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (containAdmin) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Không thể xóa admin role", null);
        }
        userRepository.delete(user);
        return buildResponse(HttpStatus.OK, "Xóa thành công user", user);
    }


    private <T> ResponseEntity<ResponseDTO<T>> buildResponse(HttpStatus status, String message, T data) {
        return ResponseEntity.status(status).body(new ResponseDTO<>(message, data));
    }
}