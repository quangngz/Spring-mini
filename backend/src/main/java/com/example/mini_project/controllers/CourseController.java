package com.example.mini_project.controllers;

import com.example.mini_project.entities.ResponseDTO;
import com.example.mini_project.entities.User;
import com.example.mini_project.entities.course.Course;
import com.example.mini_project.entities.usercourse.UserCourse;
import com.example.mini_project.repositories.CourseRepository;
import com.example.mini_project.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/courses")
public class CourseController {
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    public CourseController(CourseRepository courseRepository, UserRepository userRepository) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }
    @GetMapping()
    private ResponseEntity<ResponseDTO<Iterable<Course>>> getAllCourse() {
        Iterable<Course> courses = courseRepository.findAll();
        return ResponseEntity.ok(new ResponseDTO<>("Lấy dữ liệu course thành công", courses));
    }
    
    @GetMapping("/{coursecode}")
    public ResponseEntity<ResponseDTO<Course>> getCourseByCode(@PathVariable("coursecode") String courseCode) {
        Optional<Course> courseOptional = courseRepository.findByCourseCode(courseCode);
        if (courseOptional.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseDTO("Không tìm tháy course hợp lệ", null));
        return ResponseEntity.ok(new ResponseDTO("Tìm thấy course thành công!", courseOptional.get()));
    }


    @GetMapping("/all-users/{coursecode}")
    public ResponseEntity<ResponseDTO<List<UserCourse>>> getAllUsersInCourse(@PathVariable("coursecode") String courseCode) {
        Optional<Course> courseOptional = courseRepository.findByCourseCode(courseCode);
        if (courseOptional.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseDTO<>("Không tìm thấy course hợp lệ", null));
        Course course = courseOptional.get();
        List<UserCourse> users = new ArrayList<>();
        course.getStudents().forEach(userCourse -> users.add(userCourse));// TODO:
        return ResponseEntity.ok(new ResponseDTO<>("Lấy danh sách user trong course thành công", users));
    }

    @GetMapping("/search")
    public ResponseEntity<ResponseDTO<List<Course>>> searchCourse(@RequestParam("q") String keyword,
                                                                  @RequestParam("is-private") Boolean isPrivate) {
        List<Course> resultList = courseRepository.search(keyword, isPrivate);
        if (resultList == null) return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseDTO<>("Vui lòng tìm kiếm trường phù hợp", null));
        if (resultList.isEmpty()) return ResponseEntity.ok(
                new ResponseDTO<>("Không có course phù hợp mô tả", null));
        int n = resultList.size();
        return ResponseEntity.ok(new ResponseDTO<>("Tìm kiếm được " + n + " dữ liệu!", resultList));
    }

    @PostMapping("/create")
    public ResponseEntity<ResponseDTO<Course>> addCourse(@RequestBody @Validated Course course,
                                                         BindingResult bindingResult, 
                                                        Authentication auth) throws BindException {
        if (bindingResult.hasErrors()) {
            throw new BindException(bindingResult);
        }
        Object principal = auth.getPrincipal();
        Optional<User> userOptional = null;
        if (principal instanceof UserDetails userDetails) {
            userOptional= userRepository.findByUsername(userDetails.getUsername());
        }
        if (principal instanceof String p) {
            userOptional = userRepository.findByUsername(p);
        }
        if (userOptional == null || userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ResponseDTO<>("Người dùng không hợp lệ", null));
        }
        if (courseRepository.findByCourseCode(course.getCourseCode()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ResponseDTO<>("Course code đã tồn tại", null));
        }

        User user = userOptional.get();
        
        course.setCreatedBy(user);

        Course addedCourse = courseRepository.save(course);

        return ResponseEntity.ok(new ResponseDTO<>("Tạo thành công course mới", addedCourse));
    }

    @PutMapping("/update/{coursecode}")
    public ResponseEntity<ResponseDTO<Course>> updateCourse(@PathVariable("coursecode") String courseCode,
                                                          @RequestBody @Validated Course course,
                                                          BindingResult bindingResult) throws BindException {
        if (bindingResult.hasErrors()) {
            throw new BindException(bindingResult);
        }
        Optional<Course> courseOptional = courseRepository.findByCourseCode(courseCode);
        if (courseOptional.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseDTO<>("Không tìm thấy course hợp lệ", null));
        Course existingCourse = courseOptional.get();
        existingCourse.setCourseName(course.getCourseName());
        existingCourse.setCourseCode(course.getCourseCode());
        existingCourse.setIsPrivate(course.getIsPrivate());
        existingCourse.setEndDate(course.getEndDate());
        Course updatedCourse = courseRepository.save(existingCourse);
        return ResponseEntity.ok(new ResponseDTO<>("Cập nhật course thành công", updatedCourse));
    }

    @DeleteMapping("/delete/{coursecode}")
    public ResponseEntity<ResponseDTO<Course>> deleteCourse(@PathVariable("coursecode") String courseCode,
                                                            Authentication auth) {
        Optional<Course> courseOptional = courseRepository.findByCourseCode(courseCode);
        if (courseOptional.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseDTO<>("Xóa course: Không tìm thấy course hợp lệ", null));
        Course course = courseOptional.get();
        Object principal = auth.getPrincipal();
        String userCreatedUsername = null;
        if (principal instanceof UserDetails userDetails) {
            userCreatedUsername = userDetails.getUsername();
        }
        if (principal instanceof  String s) {
            userCreatedUsername = s;
        }
        if (userCreatedUsername == null || !userCreatedUsername.equals(course.getCreatedBy().getUsername())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ResponseDTO<>("Xóa course: Chỉ user tạo ra mới có thể xóa course này", null));
        }

        courseRepository.delete(courseOptional.get());
        return ResponseEntity.ok(new ResponseDTO<>("Xóa course thành công", null));
    }
}
