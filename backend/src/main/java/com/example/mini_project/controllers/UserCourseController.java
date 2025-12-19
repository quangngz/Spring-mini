package com.example.mini_project.controllers;

import com.example.mini_project.entities.ResponseDTO;
import com.example.mini_project.entities.User;
import com.example.mini_project.entities.course.Course;
import com.example.mini_project.entities.course.CourseRole;
import com.example.mini_project.entities.usercourse.UserCourse;
import com.example.mini_project.entities.usercourse.UserCourseId;
import com.example.mini_project.exception.CourseNotFoundException;
import com.example.mini_project.exception.UserNotFoundException;
import com.example.mini_project.repositories.CourseRepository;
import com.example.mini_project.repositories.UserCourseRepository;
import com.example.mini_project.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Optional;

@RestController
@RequestMapping("/users-courses")
public class UserCourseController {
    private final UserCourseRepository userCourseRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public UserCourseController(UserCourseRepository userCourseRepository, UserRepository userRepository, CourseRepository courseRepository) {
        this.userCourseRepository = userCourseRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
    }
    // Helper methods
    private User getUserFromAuth(Authentication auth, String action) throws UserNotFoundException {
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        Optional<User> userOptional = userRepository.findByUsername(userDetails.getUsername());
        if (userOptional.isEmpty()) {
            throw new UserNotFoundException(action + ": Không tìm thấy User!");
        }
        return userOptional.get();
    }
    private Course getCourseFromHttp(String courseCode, String action) throws CourseNotFoundException{
        Optional<Course> courseOptional = courseRepository.findByCourseCode(courseCode);
        if (courseOptional.isEmpty()) {
            throw new CourseNotFoundException(action + ": Không tìm thấy course!");
        }
        return courseOptional.get();
    }

    public ResponseEntity<ResponseDTO<UserCourse>> buildUserCourseResponse(HttpStatus status, String message, 
        UserCourse usercourse) {
        return ResponseEntity.status(status).body(new ResponseDTO<>(message, usercourse));
    }
    @PostMapping("/enroll/{courseCode}")
    @Transactional
    public ResponseEntity<ResponseDTO<UserCourse>> enrollUserInCourse(@PathVariable("courseCode") String courseCode, Authentication auth)
            throws UserNotFoundException, CourseNotFoundException {
        // Bước 1: Lấy user từ authentication
        User user = getUserFromAuth(auth, "Enroll");
        // Bước 2: Lấy Course từ courseCode qua http
        Course course = getCourseFromHttp(courseCode, "Enroll");

        // Bước 3: Tạo userCourseId và userCourse, sau đó add object đó vào repo.
        UserCourseId userCourseId = new UserCourseId(user.getId(), course.getId());
        if (userCourseRepository.existsById(userCourseId)) {
            return buildUserCourseResponse(HttpStatus.FORBIDDEN, "Enroll: User đã ở trong course!", null);
        }
        // Mặc định sẽ là Role STUDENT
        UserCourse userCourse = new UserCourse(userCourseId, user, course, LocalDate.now(), CourseRole.STUDENT);
        // Important: avoid saving the same entity twice via different paths (explicit save + cascade)
        // Because Course.students has cascade=ALL and Course is managed, adding the child here
        // will persist it automatically at flush. Do NOT call userCourseRepository.save(...) to
        // prevent "different object with the same identifier" errors.
        course.addStudent(userCourse);
        return buildUserCourseResponse(HttpStatus.OK, "Enroll: Đăng ký khóa học thành công", userCourse);
    }

    @DeleteMapping("/withdraw/{courseCode}")
    @Transactional
    public ResponseEntity<String> withdrawUserFromCourse(@PathVariable("courseCode") String courseCode, Authentication auth)
            throws UserNotFoundException, CourseNotFoundException{

        User user = getUserFromAuth(auth, "Withdraw");

        Course course = getCourseFromHttp(courseCode, "Withdraw");

        UserCourseId userCourseId = new UserCourseId(user.getId(), course.getId());

        Optional<UserCourse> userCourseOptional = userCourseRepository.findById(userCourseId);

        if (userCourseOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Withdraw: Không tìm thấy dữ liệu nhập học");
        }
        // userCourseRepository.deleteById(userCourseId);
        course.removeStudent(userCourseOptional.get());
        return ResponseEntity.ok("Withdraw: Rút khỏi khóa học thành công");
    }

    @PutMapping("/promote-tutor")
    @Transactional
    public ResponseEntity<ResponseDTO<UserCourse>> promoteTutor(@RequestParam("courseCode") String courseCode, 
            @RequestParam("userId") Long targetUserId, Authentication auth) throws UserNotFoundException, CourseNotFoundException{
        // Bước 1: Lấy các dữ liệu liên quan.
        User owner = getUserFromAuth(auth, "Promote Tutor - owner");
        Course course = getCourseFromHttp(courseCode, "Promote Tutor");

        // Bước 2: check xem người dùng hiện tại có đủ thẩm quyền để tạo thêm tutor.
        User courseCreator = course.getCreatedBy();
        if (!courseCreator.getId().equals(owner.getId())) {
            return buildUserCourseResponse(HttpStatus.FORBIDDEN, 
                "Promote Tutor: Chỉ người tạo khóa học mới có thể thêm tutor", null);
        }

        // Buoớc 3: Lấy targetUserCourse từ targetUserId và courseId
        UserCourseId targetUserCourseId = new UserCourseId(targetUserId, course.getId());
        Optional<UserCourse> targetUserCourseOptional= userCourseRepository.findById(targetUserCourseId);
        if (targetUserCourseOptional.isEmpty())
            return buildUserCourseResponse(HttpStatus.FORBIDDEN, 
                "Promote Tutor - targetUser: Không tìm thấy thông tin enroll", null);
        UserCourse targetUserCourse = targetUserCourseOptional.get();

        // Bước 4: Nếu đã là tutor thì không cần update.
        if (targetUserCourse.getRole() == CourseRole.TUTOR) {
            return buildUserCourseResponse(HttpStatus.OK, 
                "Promote Tutor: Người dùng đã là tutor", targetUserCourse);
        }
        // Bước 5: Update
        targetUserCourse.setRole(CourseRole.TUTOR);
        // userCourseRepository.save(userCourse); Khong can phai lam v trong nhung method nao duoc goi la Transactional
        return buildUserCourseResponse(HttpStatus.OK, 
            "Promote Tutor: Thăng cấp người dùng thành tutor thành công", targetUserCourse);
    }

    @PutMapping("/demote-tutor")
    @Transactional
    public ResponseEntity<ResponseDTO<UserCourse>> demoteTutor(@RequestParam("courseCode") String courseCode, 
            @RequestParam("userId") Long targetUserId, Authentication auth) throws UserNotFoundException, CourseNotFoundException {
        // Bước 1: Lấy các dữ liệu liên quan
        User owner = getUserFromAuth(auth, "Demote Tutor");
        Course course = getCourseFromHttp(courseCode, "Demote Tutor");
        // Bước 2: check xem người dùng hiện tại có đủ thẩm quyền để hạ cấp tutor.
        User courseCreator = course.getCreatedBy();
        if (!courseCreator.getId().equals(owner.getId())) {
            return buildUserCourseResponse(HttpStatus.FORBIDDEN, 
                "Demote Tutor: Chỉ người tạo khóa học mới có thể hạ cấp tutor", null);
        }   

        Optional<UserCourse> targetUserCourseOptional= userCourseRepository.findById(new UserCourseId(targetUserId, course.getId()));
        if (targetUserCourseOptional.isEmpty())
            return buildUserCourseResponse(HttpStatus.FORBIDDEN, 
                "Demote Tutor - targetUser: Không tìm thấy thông tin enroll", null);
        UserCourse targetUserCourse = targetUserCourseOptional.get();
        if (targetUserCourse.getRole() == CourseRole.STUDENT)
            return buildUserCourseResponse(HttpStatus.OK, 
                "Demote Tutor: Người dùng đã là student", targetUserCourse);

        targetUserCourse.setRole(CourseRole.STUDENT);
        // userCourseRepository.save(userCourse); Khong can phai lam v trong nhung method nao duoc goi la Transactional
        return buildUserCourseResponse(HttpStatus.OK, 
            "Demote Tutor: Hạ cấp người dùng thành student thành công", targetUserCourse);
    }

    @DeleteMapping("/remove-all-student/{courseCode}")
    @Transactional
    public ResponseEntity<ResponseDTO<UserCourse>> removeAllStudentsFromCourse(@PathVariable("courseCode") String courseCode,
            Authentication auth) throws UserNotFoundException, CourseNotFoundException {

        User user = getUserFromAuth(auth, "Remove All Students");

        Course course = getCourseFromHttp(courseCode, "Remove All Students");

        User courseCreator = course.getCreatedBy();
        if (!courseCreator.getId().equals(user.getId())) {
            return buildUserCourseResponse(HttpStatus.FORBIDDEN, 
                "Remove All Students: Chỉ người tạo khóa học mới có thể xóa tất cả sinh viên", null);
        }

        // userCourseRepository.deleteAllByCourse_Id(course.getId());
        course.getStudents().clear();
        return buildUserCourseResponse(HttpStatus.OK, 
            "Remove All Students: Xóa tất cả sinh viên khỏi khóa học thành công", null);
    }

    @DeleteMapping("/remove-all-courses-for-user/{userId}")
    @Transactional
    public ResponseEntity<ResponseDTO<UserCourse>> removeAllCoursesForUser(@PathVariable("userId") Long userId, Authentication auth)
            throws UserNotFoundException {

        User user = getUserFromAuth(auth, "Remove All Courses");

        if (!user.getId().equals(userId)) {
            return buildUserCourseResponse(HttpStatus.FORBIDDEN, 
                "Remove All Courses: Chỉ người dùng hiện tại mới có thể xóa tất cả khóa học của họ", null);
        }
        // userCourseRepository.deleteAllByUser_Id(userId);
        user.getCourses().clear();
        return buildUserCourseResponse(HttpStatus.OK, 
            "Remove All Courses: Xóa tất cả khóa học của người dùng thành công", null);
    }
}