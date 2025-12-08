package com.example.mini_project.controllers;
import com.example.mini_project.entities.User;
import com.example.mini_project.exception.UserIdNotFoundException;
import com.example.mini_project.repositories.UserRepository;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;


@RestController
@RequestMapping("/users")
public class UserController {
    private final UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    @GetMapping()
    public Iterable<User> getUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/search")
    public List<User> searchPeople(
            @RequestParam(name="firstName", required = false) String firstName,
            @RequestParam(name="lastName", required = false) String lastName,
            @RequestParam(name="phoneNum", required = false) String phoneNum,
            @RequestParam(name="address", required = false) String address,
            @RequestParam(name="age", required = false) Integer age,
            @RequestParam(name="city", required = false) String cityName
    ) {
        LocalDate begin = null;
        LocalDate end = null;
        if (age != null) {
            begin = LocalDate.now().minusYears(age + 1).plusDays(1);
            end = LocalDate.now().minusYears(age);
        }
        return userRepository.searchByCustom(firstName, lastName, address, phoneNum, cityName, begin, end);
    }

    @Cacheable(value="users", key="#id")
    @GetMapping("/{id}")
    public Optional<User> getUserById(@PathVariable("id") Integer id) {
        return userRepository.findById(id);
    }

    @PostMapping("/")
    public User createNewUser(@RequestBody @Validated User user, BindingResult bindingResult) throws BindException{
        if (bindingResult.hasErrors()) {
            throw new BindException(bindingResult);
        }
        return userRepository.save(user);
    }



    @PutMapping("/{id}")
    public User updateUser(@PathVariable("id") Integer id, @RequestBody @Validated User user,
                           BindException bindException) throws BindException{
        if (bindException.hasErrors()) {
            throw new BindException(bindException);
        }

        Optional<User> userOptional = userRepository.findById(id);

        if (userOptional.isEmpty()) return null;

        User updatedUser = userOptional.get();
        if (user.getUserName() != null) {
            updatedUser.setuserName(user.getUserName());
        }
        if (user.getAddress() != null) {
            updatedUser.setAddress(user.getAddress());
        }
        if (user.getDob() != null) {
            updatedUser.setDob(user.getDob());
        }
        if (user.getFirstName() != null) {
            updatedUser.setFirstName(user.getFirstName());
        }
        if (user.getLastName() != null) {
            updatedUser.setLastName(user.getLastName());
        }
        if (user.getPhoneNum() != null) {
            updatedUser.setPhoneNum(user.getPhoneNum());
        }
        if (user.getId() != null) {
            updatedUser.setId(user.getId());
        }
        userRepository.save(updatedUser);
        return updatedUser;
    }
    @DeleteMapping("/{id}")
    public User deleteUser(@PathVariable("id") Integer id) throws UserIdNotFoundException{
        Optional<User> optionalUser = userRepository.findById(id);
        if (optionalUser.isEmpty()) throw new UserIdNotFoundException("User Id không tồn tại để xóa");
        User deletedUser = optionalUser.get();
        userRepository.delete(deletedUser);
        return deletedUser;
    }

    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String handleBindException(BindException e) {
        List<String> errors = e.getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .toList();
        throw new IllegalArgumentException("Vi phạm yêu cầu của Database tại: "  + errors);
    }


}
