package com.example.mini_project.controllers;

import com.example.mini_project.entities.ResponseDTO;
import com.example.mini_project.entities.course.CourseDTO;
import com.example.mini_project.entities.course.CourseDTOMapper;
import com.example.mini_project.entities.user.User;
import com.example.mini_project.entities.course.Course;
import com.example.mini_project.entities.course.CourseRole;
import com.example.mini_project.entities.usercourse.UserCourse;
import com.example.mini_project.entities.usercourse.UserCourseDTO;
import com.example.mini_project.entities.usercourse.UserCourseDTOMapping;
import com.example.mini_project.exception.CourseNotFoundException;
import com.example.mini_project.exception.UserNotFoundException;
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
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static com.example.mini_project.controllers.UserController.buildResponse;

@Slf4j
@RestController
@RequestMapping("/users-courses")
public class UserCourseController {
    private final UserCourseRepository userCourseRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final PasswordEncoder encoder;
    public UserCourseController(UserCourseRepository userCourseRepository, UserRepository userRepository,
                                CourseRepository courseRepository, PasswordEncoder encoder) {
        this.userCourseRepository = userCourseRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.encoder = encoder;
    }
    // // Helper methods

    public static User getUserFromAuth(Authentication auth, String action, UserRepository userRepository)
            throws UserNotFoundException {
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        Optional<User> userOptional = userRepository.findByUsername(userDetails.getUsername());
        if (userOptional.isEmpty()) {
            throw new UserNotFoundException(action + ": Không tìm thấy User!");
        }
        return userOptional.get();
    }

    public static Course getCourseFromHttp(String courseCode, String action, CourseRepository courseRepository) throws CourseNotFoundException{
        Optional<Course> courseOptional = courseRepository.findByCourseCode(courseCode);
        if (courseOptional.isEmpty()) {
            throw new CourseNotFoundException(action + ": Không tìm thấy course!");
        }
        return courseOptional.get();
    }
    
    @PostMapping("/enroll/{courseCode}")
    @Transactional
    public ResponseEntity enrollUserInCourse(@PathVariable("courseCode") String courseCode, Authentication auth,
                                             @RequestBody(required = false) CourseEnrollRequest req)
            throws UserNotFoundException, CourseNotFoundException {
        // Bước 1: Lấy user từ authentication
        User user = getUserFromAuth(auth, "Enroll", this.userRepository);
        // Bước 2: Lấy Course từ courseCode qua http
        Course course = getCourseFromHttp(courseCode, "Enroll", this.courseRepository);

        // Bước 3: Kiểm tra tồn tại bằng quan hệ user/course
        if (userCourseRepository.existsByUser_IdAndCourse_Id(user.getId(), course.getId())) {
            return buildResponse(HttpStatus.FORBIDDEN, "Enroll: User đã ở trong course!", null);
        }
        // Bước 4: Bắt user nhập mật khẩu của course nếu course là private
        boolean verified = true;
        if (course.getIsPrivate().equals(Boolean.TRUE)) {
            verified = false;
        }
        if (encoder.matches(req.password(), course.getPassword())) {
            verified = true;
        }
        if (!verified) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Enroll: Sai mật khẩu của khóa học, vui lòng nhập lại", null);
        }
        // Mặc định sẽ là Role STUDENT
        UserCourse userCourse = new UserCourse(null, user, course, LocalDate.now(), CourseRole.STUDENT);

        course.addStudent(userCourse);
        return buildResponse(HttpStatus.OK, "Enroll: Đăng ký khóa học thành công", UserCourseDTOMapping.toDTO(userCourse));
    }

    @DeleteMapping("/withdraw/{courseCode}")
    @Transactional
    public ResponseEntity<String> withdrawUserFromCourse(@PathVariable("courseCode") String courseCode, Authentication auth)
            throws UserNotFoundException, CourseNotFoundException{

        User user = getUserFromAuth(auth, "Withdraw", this.userRepository);

        Course course = getCourseFromHttp(courseCode, "Withdraw", this.courseRepository);

        Optional<UserCourse> userCourseOptional = userCourseRepository.findByUser_IdAndCourse_Id(user.getId(), course.getId());

        if (userCourseOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Withdraw: Không tìm thấy dữ liệu nhập học");
        }
        // userCourseRepository.deleteById(userCourseId);
        course.removeStudent(userCourseOptional.get());
        return ResponseEntity.ok("Withdraw: Rút khỏi khóa học thành công");
    }

    @PutMapping("/promote-tutor")
    @Transactional
    public ResponseEntity promoteTutor(@RequestParam("courseCode") String courseCode,
            @RequestParam("userId") Long targetUserId, Authentication auth) throws UserNotFoundException, CourseNotFoundException{
        // Bước 1: Lấy các dữ liệu liên quan.
        User owner = getUserFromAuth(auth, "Promote Tutor - owner", this.userRepository);
        Course course = getCourseFromHttp(courseCode, "Promote Tutor", this.courseRepository);

        // Bước 2: check xem người dùng hiện tại có đủ thẩm quyền để tạo thêm tutor.
        User courseCreator = course.getCreatedBy();
        if (!courseCreator.getId().equals(owner.getId())) {
            return buildResponse(HttpStatus.FORBIDDEN, 
                "Promote Tutor: Chỉ người tạo khóa học mới có thể thêm tutor", null);
        }

        // Buoớc 3: Lấy targetUserCourse từ targetUserId và courseId
        Optional<UserCourse> targetUserCourseOptional= userCourseRepository.findByUser_IdAndCourse_Id(targetUserId, course.getId());
        if (targetUserCourseOptional.isEmpty())
            return buildResponse(HttpStatus.FORBIDDEN, 
                "Promote Tutor - targetUser: Không tìm thấy thông tin enroll", null);
        UserCourse targetUserCourse = targetUserCourseOptional.get();

        // Bước 4: Nếu đã là tutor thì không cần update.
        if (targetUserCourse.getRole() == CourseRole.TUTOR) {
            return buildResponse(HttpStatus.OK, 
                "Promote Tutor: Người dùng đã là tutor", targetUserCourse);
        }
        // Bước 5: Update
        targetUserCourse.setRole(CourseRole.TUTOR);
        // userCourseRepository.save(userCourse); Khong can phai lam v trong nhung method nao duoc goi la Transactional
        return buildResponse(HttpStatus.OK, 
            "Promote Tutor: Thăng cấp người dùng thành tutor thành công", UserCourseDTOMapping.toDTO(targetUserCourse));
    }

    @PutMapping("/demote-tutor")
    @Transactional
    public ResponseEntity demoteTutor(@RequestParam("courseCode") String courseCode,
            @RequestParam("userId") Long targetUserId, Authentication auth) throws UserNotFoundException, CourseNotFoundException {
        // Bước 1: Lấy các dữ liệu liên quan
        User owner = getUserFromAuth(auth, "Demote Tutor", this.userRepository);
        Course course = getCourseFromHttp(courseCode, "Demote Tutor", this.courseRepository);
        // Bước 2: check xem người dùng hiện tại có đủ thẩm quyền để hạ cấp tutor.
        User courseCreator = course.getCreatedBy();
        if (!courseCreator.getId().equals(owner.getId())) {
            return buildResponse(HttpStatus.FORBIDDEN, 
                "Demote Tutor: Chỉ người tạo khóa học mới có thể hạ cấp tutor", null);
        }   

        Optional<UserCourse> targetUserCourseOptional= userCourseRepository.findByUser_IdAndCourse_Id(targetUserId, course.getId());
        if (targetUserCourseOptional.isEmpty())
            return buildResponse(HttpStatus.FORBIDDEN, 
                "Demote Tutor - targetUser: Không tìm thấy thông tin enroll", null);
        UserCourse targetUserCourse = targetUserCourseOptional.get();
        if (targetUserCourse.getRole() == CourseRole.STUDENT)
            return buildResponse(HttpStatus.OK, 
                "Demote Tutor: Người dùng đã là student", targetUserCourse);

        targetUserCourse.setRole(CourseRole.STUDENT);
        // userCourseRepository.save(userCourse); Khong can phai lam v trong nhung method nao duoc goi la Transactional
        return buildResponse(HttpStatus.OK, 
            "Demote Tutor: Hạ cấp người dùng thành student thành công", UserCourseDTOMapping.toDTO(targetUserCourse));
    }

    @DeleteMapping("/remove-all-student/{courseCode}")
    @Transactional
    public ResponseEntity removeAllStudentsFromCourse(@PathVariable("courseCode") String courseCode,
            Authentication auth) throws UserNotFoundException, CourseNotFoundException {

        User user = getUserFromAuth(auth, "Remove All Students", this.userRepository);

        Course course = getCourseFromHttp(courseCode, "Remove All Students", this.courseRepository);

        User courseCreator = course.getCreatedBy();
        if (!courseCreator.getId().equals(user.getId())) {
            return buildResponse(HttpStatus.FORBIDDEN, 
                "Remove All Students: Chỉ người tạo khóa học mới có thể xóa tất cả sinh viên", null);
        }

        // userCourseRepository.deleteAllByCourse_Id(course.getId());
        course.getStudents().clear();
        return buildResponse(HttpStatus.OK, 
            "Remove All Students: Xóa tất cả sinh viên khỏi khóa học thành công", null);
    }

    @DeleteMapping("/remove-all-courses-for-user/{userId}")
    @Transactional
    public ResponseEntity<ResponseDTO<UserCourse>> removeAllCoursesForUser(@PathVariable("userId") Long userId, Authentication auth)
            throws UserNotFoundException {

        User user = getUserFromAuth(auth, "Remove All Courses", this.userRepository);

        if (!user.getId().equals(userId)) {
            return buildResponse(HttpStatus.FORBIDDEN, 
                "Remove All Courses: Chỉ người dùng hiện tại mới có thể xóa tất cả khóa học của họ", null);
        }
        // userCourseRepository.deleteAllByUser_Id(userId);
        user.getCourses().clear();
        return buildResponse(HttpStatus.OK, 
            "Remove All Courses: Xóa tất cả khóa học của người dùng thành công", null);
    }

    @GetMapping("/all-courses")
    public ResponseEntity getUserEnrolledCourses(Authentication auth) throws UserNotFoundException{
        User user = getUserFromAuth(auth, "Get All Courses", this.userRepository);

        List<UserCourse>  userCourseList = userCourseRepository.findAllByUser_Id(user.getId());
        List<CourseDTO> courseList = userCourseList.stream().map(
                userCourse -> CourseDTOMapper.toDTO(userCourse.getCourse())).toList();
        return buildResponse(HttpStatus.OK, "Get all courses: thành công", courseList);
    }

}

