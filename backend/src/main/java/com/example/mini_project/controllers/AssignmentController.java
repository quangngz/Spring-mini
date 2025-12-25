package com.example.mini_project.controllers;

import com.example.mini_project.entities.ResponseDTO;
import com.example.mini_project.entities.assignment.AssignmentDTO;
import com.example.mini_project.entities.assignment.AssignmentDTOMapper;
import com.example.mini_project.entities.user.User;
import com.example.mini_project.entities.assignment.Assignment;
import com.example.mini_project.entities.course.Course;
import com.example.mini_project.entities.course.CourseRole;
import com.example.mini_project.entities.usercourse.UserCourse;
import com.example.mini_project.exception.CourseNotFoundException;
import com.example.mini_project.exception.UserNotFoundException;
import com.example.mini_project.repositories.AssignmentRepository;
import com.example.mini_project.repositories.CourseRepository;
import com.example.mini_project.repositories.UserCourseRepository;
import com.example.mini_project.repositories.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static com.example.mini_project.controllers.UserController.buildResponse;

@RestController
@RequestMapping("courses/{courseCode}/assignments")
public class AssignmentController {
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final UserCourseRepository userCourseRepository;
    public AssignmentController(AssignmentRepository assignmentRepository, UserRepository userRepository,
                                CourseRepository courseRepository, UserCourseRepository userCourseRepository) {
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.userCourseRepository = userCourseRepository;
    }

    private User getUserFromAuth(Authentication auth, String action) throws UserNotFoundException {
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        Optional<User> userOptional = userRepository.findByUsername(userDetails.getUsername());
        if (userOptional.isEmpty()) {
            throw new UserNotFoundException(action + ": Không tìm thấy User!");
        }
        return userOptional.get();
    }
    private Course getCourseFromHttp(String courseCode, String action) throws CourseNotFoundException {
        Optional<Course> courseOptional = courseRepository.findByCourseCode(courseCode);
        if (courseOptional.isEmpty()) {
            throw new CourseNotFoundException(action + ": Không tìm thấy course!");
        }
        return courseOptional.get();
    }

    @GetMapping()
    public ResponseEntity getAllCourseAssignment(@PathVariable("courseCode") String courseCode) {
        List <AssignmentDTO> assignmentDTOList = StreamSupport.stream(this.assignmentRepository
                        .findByCourse_CourseCode(courseCode).spliterator(), false)
                        .map(AssignmentDTOMapper::toDTO).collect(Collectors.toList());
        return buildResponse(HttpStatus.OK, "Assignment: Lấy dữ liệu assignment thành công", assignmentDTOList);
    }

    private boolean isTutor(String username, String courseCode) {
        Optional<UserCourse> userCourseOptional = userCourseRepository.findByUser_UsernameAndCourse_CourseCode(username, courseCode);
        if (userCourseOptional.isEmpty())
            return false;
        return userCourseOptional.get().getRole().equals(CourseRole.TUTOR);
    }
    @PostMapping("/create")
    @Transactional
    public ResponseEntity createAssignment(@PathVariable("courseCode") String courseCode,
            @RequestBody @Validated Assignment assignment, Authentication auth)
            throws UserNotFoundException, CourseNotFoundException, Exception {

        User user = getUserFromAuth(auth, "Tạo assignment");
        Course course = getCourseFromHttp(courseCode, "Tạo assignment");
        if (!isTutor(user.getUsername(), course.getCourseCode())) {
            return buildResponse(HttpStatus.FORBIDDEN,
                    "Tạo assignment: Không phải tutor hoặc không tìm thấy bạn trong hệ thống!", null);
        }
        assignment.setCourse(course);
        assignment.setCreatedBy(user);
        course.addAssignment(assignment);
        return buildResponse(HttpStatus.CREATED,
                "Tạo assignment: Assignment created successfully", AssignmentDTOMapper.toDTO(assignment));
    }

    @PutMapping("/edit")
    @Transactional
    public ResponseEntity editAssignment(@PathVariable("courseCode") String courseCode,
            @RequestBody Assignment newAssignment, Authentication auth)
            throws UserNotFoundException, CourseNotFoundException, Exception{
        Course course = getCourseFromHttp(courseCode, "Edit assignment");
        User user = getUserFromAuth(auth, "Edit assignment");
        if (!isTutor(user.getUsername(), course.getCourseCode())) {
           return buildResponse(HttpStatus.FORBIDDEN,
                   "Edit assignment: Không phải tutor hoặc không tìm thấy bạn trong hệ thống!", null);
       }
       if (newAssignment.getId() == null) {
           return buildResponse(HttpStatus.BAD_REQUEST, "Edit assignment: Assignment cần edit thiếu id", null);
       }
        Optional<Assignment> assignmentOptional = assignmentRepository.findById(newAssignment.getId());

       if (assignmentOptional.isEmpty())
           return buildResponse(HttpStatus.BAD_REQUEST, "Edit assignment: Không tìm thấy assignment cần edit", null);

        Assignment updateAssignment = assignmentOptional.get();
        // Không update những mục nào liên quan tới id và id.
        if (newAssignment.getAssignmentDue() != null) {
            updateAssignment.setAssignmentDue(newAssignment.getAssignmentDue());
        }
        if (newAssignment.getAssignmentName() != null && !newAssignment.getAssignmentName().isEmpty()) {
            updateAssignment.setAssignmentName(newAssignment.getAssignmentName());
        }
        if (newAssignment.getAssignmentWeight() != null) {
            updateAssignment.setAssignmentWeight(newAssignment.getAssignmentWeight());
        }
        course.addAssignment(updateAssignment);
        return buildResponse(HttpStatus.OK, "Edit assignment: Thành công!", AssignmentDTOMapper.toDTO(updateAssignment));
    }

    @DeleteMapping("/delete")
    @Transactional
    public ResponseEntity deleteAssignment(@PathVariable("courseCode") String courseCode,
            @RequestBody Assignment newAssignment, Authentication auth) throws UserNotFoundException, CourseNotFoundException{
        Course course = getCourseFromHttp(courseCode, "Xóa assignment");
        User user = getUserFromAuth(auth, "Xóa assignment");
        if (!isTutor(user.getUsername(), course.getCourseCode())) {
            return buildResponse(HttpStatus.FORBIDDEN,
                    "Xóa assignment: Không phải tutor hoặc không tìm thấy bạn trong hệ thống!", null);
        }
        if (newAssignment.getId() == null) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Xóa assignment: Assignment cần xóa thiếu id", null);
        }
        Optional<Assignment> assignmentOptional = assignmentRepository.findById(newAssignment.getId());

        if (assignmentOptional.isEmpty())
            return buildResponse(HttpStatus.BAD_REQUEST, "Xóa assignment: Không tìm thấy assignment cần xóa", null);
        Assignment deleteAssignment = assignmentOptional.get();
        course.removeAssignment(assignmentOptional.get());
        return buildResponse(HttpStatus.OK, "Xóa assignment: Thành công!", AssignmentDTOMapper.toDTO(deleteAssignment));
    }
}
