package com.example.mini_project.controllers;

import com.example.mini_project.entities.ResponseDTO;
import com.example.mini_project.entities.assignment.AssignmentCreateDTO;
import com.example.mini_project.entities.assignment.AssignmentResponseDTO;
import com.example.mini_project.entities.assignment.AssignmentResponseDTOMapper;
import com.example.mini_project.entities.file.AssignmentFile;
import com.example.mini_project.entities.user.User;
import com.example.mini_project.entities.assignment.Assignment;
import com.example.mini_project.entities.course.Course;
import com.example.mini_project.entities.course.CourseRole;
import com.example.mini_project.entities.usercourse.UserCourse;
import com.example.mini_project.exception.CourseNotFoundException;
import com.example.mini_project.exception.UserNotFoundException;
import com.example.mini_project.repositories.AssignmentRepository;
import com.example.mini_project.repositories.CourseRepository;
import com.example.mini_project.repositories.SubmissionRepository;
import com.example.mini_project.repositories.UserCourseRepository;
import com.example.mini_project.repositories.UserRepository;
import com.example.mini_project.service.S3Service;
import com.example.mini_project.service.UploadPdfService;
import jakarta.transaction.Transactional;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static com.example.mini_project.controllers.UserController.buildResponse;

@RestController
@RequestMapping("courses/{course-id}/assignments")
public class AssignmentController {
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final UserCourseRepository userCourseRepository;
    private final SubmissionRepository submissionRepository;
    private final S3Service s3Service;
    private final UploadPdfService uploadPdfService;
    public AssignmentController(AssignmentRepository assignmentRepository,
                                UserRepository userRepository,
                                CourseRepository courseRepository,
                                UserCourseRepository userCourseRepository,
                                SubmissionRepository submissionRepository,
                                S3Service s3Service, UploadPdfService uploadPdfService) {
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.userCourseRepository = userCourseRepository;
        this.submissionRepository = submissionRepository;
        this.s3Service = s3Service;
        this.uploadPdfService = uploadPdfService;
    }

    @GetMapping()
    public ResponseEntity getAllCourseAssignment(@PathVariable("course-id") Long courseId) {
        List <AssignmentResponseDTO> AssignmentResponseDTOList = StreamSupport.stream(this.assignmentRepository
                        .findByCourse_Id(courseId).spliterator(), false)
                        .map(AssignmentResponseDTOMapper::toDTO).collect(Collectors.toList());
        return buildResponse(HttpStatus.OK, "Assignment: Lấy dữ liệu assignment thành công", AssignmentResponseDTOList);
    }

    @GetMapping("{assignment-id}/pdf")
    public ResponseEntity<?> getAssignmentPdf(@PathVariable("assignment-id") Long assignmentId,
                                              @RequestParam(value = "index", required = false) Integer index) {
        Optional<Assignment> assignmentOptional = assignmentRepository.findById(assignmentId);
        if (assignmentOptional.isEmpty()) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Assignment: Không tìm thấy assignment để trích xuất pdf", null);
        }
        Assignment assignment = assignmentOptional.get();
        AssignmentFile file;
        if (index != null && index <= assignment.getFiles().size() - 1) {
            file = assignment.getFiles().get(index);
        } else {
            // Cái này sẽ được chạy nhiều hơn, và add submission nhiều hơn nên dùng linked list tốt hơn.
            file = assignment.getFiles().get(0);
        }

        byte[] pdfBytes =
                uploadPdfService.loadPdfBytes(file.getS3Key());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + file.getOriginalFilename() + "\""
                )
                .body(new ByteArrayResource(pdfBytes));
    }

    @PostMapping(
            value = "/create",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity createAssignment(@PathVariable("course-id") Long courseId,
                                           @RequestPart("data") @Validated AssignmentCreateDTO request,
                                           @RequestPart(value = "file", required = false) List<MultipartFile> files,
                                           Authentication auth)
            throws UserNotFoundException, CourseNotFoundException, Exception {

        User user = getUserFromAuth(auth, "Tạo assignment");
        Course course = getCourseFromHttp(courseId, "Tạo assignment");
        if (!isTutor(user.getUsername(), course.getId())) {
            return buildResponse(HttpStatus.FORBIDDEN,
                    "Tạo assignment: Không phải tutor hoặc không tìm thấy bạn trong hệ thống!", null);
        }

        Assignment assignment = new Assignment();

        assignment.setCourse(course);
        assignment.setCreatedBy(user);
        assignment.setAssignmentWeight(request.getAssignmentWeight());
        assignment.setAssignmentName(request.getAssignmentName());
        assignment.setAssignmentDue(request.getAssignmentDue());
        course.addAssignment(assignment);
        assignmentRepository.saveAndFlush(assignment); // <-- forces ID

        ResponseEntity<ResponseDTO<Object>> INTERNAL_SERVER_ERROR = saveS3File(files, assignment);
        if (INTERNAL_SERVER_ERROR != null) return INTERNAL_SERVER_ERROR;

        return buildResponse(HttpStatus.CREATED,
                "Tạo assignment: Tạo assignment thành công", AssignmentResponseDTOMapper.toDTO(assignment));
    }


    @PutMapping(
            value = "{assignment-id}/edit",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity editAssignment(@PathVariable("course-id") Long courseId,
                                         @PathVariable("assignment-id") Long assignmentId,
                                         @RequestPart(value="data", required = false) AssignmentCreateDTO request,
                                         @RequestPart(value = "file", required = false) List<MultipartFile> files,
                                         Authentication auth)
            throws UserNotFoundException, CourseNotFoundException, Exception{

        // Validation logic
        Course course = getCourseFromHttp(courseId, "Edit assignment");
        User user = getUserFromAuth(auth, "Edit assignment");
        if (!isTutor(user.getUsername(), course.getId())) {
           return buildResponse(HttpStatus.FORBIDDEN,
                   "Edit assignment: Không phải tutor hoặc không tìm thấy bạn trong hệ thống!", null);
       }

        Optional<Assignment> assignmentOptional = assignmentRepository.findById(assignmentId);

       if (assignmentOptional.isEmpty())
           return buildResponse(HttpStatus.BAD_REQUEST, "Edit assignment: Không tìm thấy assignment cần edit", null);


        Assignment updateAssignment = getUpdateAssignment(request, assignmentOptional);
        if (files != null && !files.isEmpty()) {
            ResponseEntity<ResponseDTO<Object>> INTERNAL_SERVER_ERROR = saveS3File(files, updateAssignment);
            if (INTERNAL_SERVER_ERROR != null) return INTERNAL_SERVER_ERROR;
        }
        course.addAssignment(updateAssignment);
        return buildResponse(HttpStatus.OK, "Edit assignment: Thành công!", AssignmentResponseDTOMapper.toDTO(updateAssignment));
    }


    @DeleteMapping("{assignment-id}/delete")
    @Transactional
    public ResponseEntity deleteAssignment(@PathVariable("course-id") Long courseId,
                                           @PathVariable(value = "assignment-id") Long assignmentId,
                                           Authentication auth) throws UserNotFoundException, CourseNotFoundException{
        Course course = getCourseFromHttp(courseId, "Xóa assignment");
        User user = getUserFromAuth(auth, "Xóa assignment");
        if (!isTutor(user.getUsername(), course.getId())) {
            return buildResponse(HttpStatus.FORBIDDEN,
                    "Xóa assignment: Không phải tutor hoặc không tìm thấy bạn trong hệ thống!", null);
        }
        Optional<Assignment> assignmentOptional = assignmentRepository.findById(assignmentId);

        if (assignmentOptional.isEmpty())
            return buildResponse(HttpStatus.BAD_REQUEST, "Xóa assignment: Không tìm thấy assignment cần xóa", null);

        Assignment deleteAssignment = assignmentOptional.get();

        // Delete submission files from S3 and then delete submissions
        submissionRepository.findByAssignment_Id(assignmentId).forEach(submission -> {
            submission.getFiles().forEach(file -> s3Service.deleteObject(file.getS3Key()));
        });
        submissionRepository.deleteByAssignment_Id(assignmentId);

        // Delete assignment files from S3
        deleteAssignment.getFiles().forEach(file -> s3Service.deleteObject(file.getS3Key()));

        course.removeAssignment(assignmentOptional.get());
        return buildResponse(HttpStatus.OK, "Xóa assignment: Thành công!", AssignmentResponseDTOMapper.toDTO(deleteAssignment));
    }

    // helper
    private User getUserFromAuth(Authentication auth,
                                 String action) throws UserNotFoundException {
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        Optional<User> userOptional = userRepository.findByUsername(userDetails.getUsername());
        if (userOptional.isEmpty()) {
            throw new UserNotFoundException(action + ": Không tìm thấy User!");
        }
        return userOptional.get();
    }
    private Course getCourseFromHttp(Long id,
                                     String action) throws CourseNotFoundException {
        Optional<Course> courseOptional = courseRepository.findById(id);
        if (courseOptional.isEmpty()) {
            throw new CourseNotFoundException(action + ": Không tìm thấy course!");
        }
        return courseOptional.get();
    }

    private boolean isTutor(String username,
                            Long id) {
        Optional<UserCourse> userCourseOptional = userCourseRepository.findByUser_UsernameAndCourse_Id(username, id);
        if (userCourseOptional.isEmpty())
            return false;
        return userCourseOptional.get().getRole().equals(CourseRole.TUTOR);
    }

    // helper
    private Assignment getUpdateAssignment(AssignmentCreateDTO request, Optional<Assignment> assignmentOptional) {
        Assignment updateAssignment = assignmentOptional.get();
        // Không update những mục nào liên quan tới id và id.
        if (request.getAssignmentDue() != null) {
            updateAssignment.setAssignmentDue(request.getAssignmentDue());
        }
        if (request.getAssignmentName() != null && !request.getAssignmentName().isEmpty()) {
            updateAssignment.setAssignmentName(request.getAssignmentName());
        }
        if (request.getAssignmentWeight() != null) {
            updateAssignment.setAssignmentWeight(request.getAssignmentWeight());
        }
        return updateAssignment;
    }

    private ResponseEntity<ResponseDTO<Object>> saveS3File(List<MultipartFile> files, Assignment assignment) {
        try {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String s3Key = AssignmentFile.generateS3Key(assignment, file);
                    AssignmentFile assignmentFile = AssignmentFile.build(s3Service, s3Key, assignment, file);
                    assignment.addFile(assignmentFile);
                }
            }
        } catch (IOException e) {
            return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Assignment: Upload file thất bại (S3)", null);
        }
        return null;
    }
}
