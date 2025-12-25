package com.example.mini_project.controllers;

import com.example.mini_project.entities.ResponseDTO;
import com.example.mini_project.entities.course.CourseDTO;
import com.example.mini_project.entities.course.CourseDTOMapper;
import com.example.mini_project.entities.course.CourseRole;
import com.example.mini_project.entities.user.User;
import com.example.mini_project.entities.course.Course;
import com.example.mini_project.entities.usercourse.UserCourse;
import com.example.mini_project.repositories.CourseRepository;
import com.example.mini_project.repositories.UserCourseRepository;
import com.example.mini_project.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static com.example.mini_project.controllers.UserController.buildResponse;
@Slf4j
@RestController
@RequestMapping("/courses")
public class CourseController {
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final UserCourseRepository userCourseRepository;
    private final PasswordEncoder encoder;
    public CourseController(CourseRepository courseRepository, UserRepository userRepository,
                            UserCourseRepository userCourseRepository, PasswordEncoder encoder) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.userCourseRepository = userCourseRepository;
        this.encoder = encoder;
    }
    @GetMapping()
    public ResponseEntity getAllCourse() {
        Iterable<Course> courses = courseRepository.findAll();
        List<CourseDTO> result = StreamSupport.stream(courses.spliterator(), false)
                .map(CourseDTOMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(new ResponseDTO<>("Lấy dữ liệu course thành công", result));
    }
    
    @GetMapping("/{coursecode}")
    public ResponseEntity getCourseByCode(@PathVariable("coursecode") String courseCode) {
        Optional<Course> courseOptional = courseRepository.findByCourseCode(courseCode);
        if (courseOptional.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseDTO("Không tìm tháy course hợp lệ", null));
        return ResponseEntity.ok(new ResponseDTO("Tìm thấy course thành công!", CourseDTOMapper.toDTO(courseOptional.get())));
    }


    @GetMapping("/all-users/{coursecode}")
    public ResponseEntity getAllUsersInCourse(@PathVariable("coursecode") String courseCode) {
        Optional<Course> courseOptional = courseRepository.findByCourseCode(courseCode);
        if (courseOptional.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseDTO<>("Không tìm thấy course hợp lệ", null));
        Course course = courseOptional.get();
        List<UserCourse> users = new ArrayList<>();
        course.getStudents().forEach(userCourse -> users.add(userCourse));
        return ResponseEntity.ok(new ResponseDTO<>("Lấy danh sách user trong course thành công", users));
    }

    @GetMapping("/search")
    public ResponseEntity searchCourse(@RequestParam(value = "q", required = false) String keyword,
                                                                  @RequestParam(value = "is-private", required = false) Boolean isPrivate) {
        List<Course> resultList = courseRepository.search(keyword, isPrivate);
        if (resultList == null) return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseDTO<>("Vui lòng tìm kiếm trường phù hợp", null));
        if (resultList.isEmpty()) return ResponseEntity.ok(
                new ResponseDTO<>("Không có course phù hợp mô tả", null));
        int n = resultList.size();
        return ResponseEntity.ok(new ResponseDTO<>("Tìm kiếm được " + n + " dữ liệu!",
                resultList.stream().map(CourseDTOMapper::toDTO).toList()));
    }

    @PostMapping("/create")
    @Transactional
    public ResponseEntity addCourse(@RequestBody @Validated Course course,
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

        if (course.getIsPrivate()) {
            course.setPassword(encoder.encode(course.getPassword()));
        }
        course.setCreatedBy(user);
        Course addedCourse = courseRepository.save(course);

        UserCourse makeTutor = new UserCourse(null, user, addedCourse, LocalDate.now(), CourseRole.TUTOR);
        userCourseRepository.save(makeTutor);

        return ResponseEntity.ok(new ResponseDTO<>("Tạo thành công course mới", CourseDTOMapper.toDTO(addedCourse)));
    }

    @PutMapping("/update/{coursecode}")
    @Transactional
    public ResponseEntity updateCourse(@PathVariable("coursecode") String courseCode,
                                                          @RequestBody @Validated CourseUpdateRequest req,
                                                          BindingResult bindingResult) throws BindException {
        if (bindingResult.hasErrors()) {
            throw new BindException(bindingResult);
        }

        Optional<Course> courseOptional = courseRepository.findByCourseCode(courseCode);
        if (courseOptional.isEmpty()) return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ResponseDTO<>("Không tìm thấy course hợp lệ", null));
        Course existingCourse = courseOptional.get();
        Course input = req.course();
        if (input.getCourseName() != null && !input.getCourseName().isEmpty()) {
            existingCourse.setCourseName(input.getCourseName());
        }

        Boolean requestedPrivacy = input.getIsPrivate();
        if (requestedPrivacy == null) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Trạng thái private không hợp lệ", null);
        }
        // trạng thái hiện tại
        boolean wasPrivate = Boolean.TRUE.equals(existingCourse.getIsPrivate());
        // trạng tái tiếp tới
        boolean willBePrivate = Boolean.TRUE.equals(requestedPrivacy);
        // Nếu trạng thái hiện tại không set nhưng trạng thái sắp tới sẽ set private, thì sẽ là lần đầu set mật khẩu mới
        boolean isSettingInitialPassword = !wasPrivate && willBePrivate;
        // Nếu đã private và tương lai cũng sẽ là private thì là đang đổi mật khẩu thông thường
        boolean isChangingPassword = wasPrivate &&
                (req.password1() != null || req.password2() != null);

        // Chưa từng là private và không chỉnh lại thành private thì không set được mật khẩu
        if (!wasPrivate && !willBePrivate &&
                (req.password1() != null || req.password2() != null || req.oldPassword() != null)) {
            return buildResponse(
                    HttpStatus.BAD_REQUEST,
                    "Course công khai không thể đổi mật khẩu",
                    null
            );
        }

        /* Từ: PUBLIC → PRIVATE */
        if (isSettingInitialPassword) {
            if (req.password1() == null || req.password2() == null || !req.password1().equals(req.password2())) {
                return buildResponse(HttpStatus.BAD_REQUEST,"Cần mật khẩu hợp lệ khi chuyển sang private",null);
            }
            if (req.password1().isBlank()) {
                return buildResponse(HttpStatus.BAD_REQUEST,"Mật khẩu không được rỗng",null);
            }
            existingCourse.setPassword(encoder.encode(req.password1()));
        }
        if (isChangingPassword) {
            if (req.oldPassword() == null || !encoder.matches(req.oldPassword(), existingCourse.getPassword())) {
                return buildResponse(HttpStatus.BAD_REQUEST,"Xác thực thất bại",null);
            }
            if (req.password1() == null || req.password2() == null || !req.password1().equals(req.password2())) {
                return buildResponse(HttpStatus.BAD_REQUEST,"Mật khẩu xác nhận không khớp",null);
            }
            if (req.password1().isBlank()) {
                return buildResponse(HttpStatus.BAD_REQUEST,"Mật khẩu không được rỗng",null);
            }
            existingCourse.setPassword(encoder.encode(req.password1()));
        }
        if (wasPrivate && !willBePrivate) {
            existingCourse.setPassword(null);
        }
        existingCourse.setIsPrivate(willBePrivate);
        if (input.getEndDate() != null) {
            existingCourse.setEndDate(input.getEndDate());
        }

        if (input.getCourseDescription() != null && !input.getCourseDescription().isEmpty()) {
            log.info("Course description: " + input.getCourseDescription());
            existingCourse.setCourseDescription(input.getCourseDescription());
        }


        Course updatedCourse = courseRepository.save(existingCourse);
        return ResponseEntity.ok(new ResponseDTO<>("Cập nhật course thành công", CourseDTOMapper.toDTO(updatedCourse)));
    }

    @DeleteMapping("/delete/{coursecode}")
    @Transactional
    public ResponseEntity deleteCourse(@PathVariable("coursecode") String courseCode, Authentication auth) {
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
        return ResponseEntity.ok(new ResponseDTO<>("Xóa course thành công",
                CourseDTOMapper.toDTO(courseOptional.get())));
    }

}

