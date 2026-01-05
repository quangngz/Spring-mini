package com.example.mini_project.controllers;

import com.example.mini_project.entities.submission.*;
import com.example.mini_project.entities.user.User;
import com.example.mini_project.entities.assignment.Assignment;
import com.example.mini_project.entities.course.Course;
import com.example.mini_project.entities.course.CourseRole;
import com.example.mini_project.entities.usercourse.UserCourse;
import com.example.mini_project.repositories.*;
import com.example.mini_project.service.S3Service;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.parameters.P;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.example.mini_project.controllers.UserController.buildResponse;


@RestController
@RequestMapping("/submissions")
public class SubmissionController {
    private final UserCourseRepository userCourseRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final S3Service s3Service;

    public SubmissionController(UserCourseRepository userCourseRepository,
                                AssignmentRepository assignmentRepository,
                                SubmissionRepository submissionRepository,
                                S3Service s3Service) {
        this.assignmentRepository = assignmentRepository;
        this.userCourseRepository = userCourseRepository;
        this.submissionRepository = submissionRepository;
        this.s3Service = s3Service;
    }

    @GetMapping("/{course-id}")
    public ResponseEntity getAllCourseSubmission(@PathVariable("course-id") Long courseId) {
        List<SubmissionDTO> submissionDTOList = this.submissionRepository.findByAssignment_Course_Id(courseId)
                .stream().map(SubmissionMapper::toDTO).toList();
        return buildResponse(HttpStatus.OK, "Lấy submission theo courseId thành công", submissionDTOList);
    }

    @GetMapping()
    public ResponseEntity getSubmissionByAssignment(@RequestParam("assignment-id") Long assignmentId) {
        List<SubmissionDTO> submissionDTOList = this.submissionRepository.findByAssignment_Id(assignmentId)
                .stream().map(SubmissionMapper::toDTO).toList();
        return buildResponse(HttpStatus.OK, "Lấy submission theo assignment thành công", submissionDTOList);
    }

    @PostMapping(
            value = "/submit/{course-id}/{assignment-id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity buildSubmission(@PathVariable("course-id") Long courseId,
                                          @PathVariable("assignment-id") Long assignmentId,
                                          @RequestPart("file") MultipartFile file,
                                          Authentication auth) {
        // Validation logic
        User user; Assignment assignment; String validationString;
        try {
            user = extractStudentFromUserCourse(courseId, auth);
            assignment = extractAssignmentFromUserCourse(assignmentId);
            validationString = validateAssignment(assignment, courseId, user);
        } catch (RuntimeException e) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Submission: " + e.getMessage(), null);
        }
        if (validationString != null && !validationString.isEmpty()) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Submission: " + validationString, null);
        }
        Submission submission = new Submission();
        submission.setUser(user);
        submission.setAssignment(assignment);
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(assignment.getAssignmentDue())) {
            submission.setStatus(SubmissionStatus.LATE);
        } else {
            submission.setStatus(SubmissionStatus.SUBMITTED);
        }
        Submission addedSubmission = submissionRepository.save(submission); // save lần 1 để tạo submission id

        // tạo submission file
        SubmissionFile submissionFile;
        try {
            String s3Key = generateSubmissionFileKey(submission, file);
            submissionFile = buildSubmissionFile(s3Key, submission, file);
        }  catch (IOException e) {
            return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Submission: Upload file thất bại (S3)", null);
        }
        submission.addFile(submissionFile);
        addedSubmission = submissionRepository.save(submission); // lưu lần 2 để lưu file
        return buildResponse(HttpStatus.OK,
                "Submission: Thành công!",
                SubmissionMapper.toDTO(addedSubmission));
    }

    @DeleteMapping("/delete/{submission-id}")
    public ResponseEntity deleteSubmission(@PathVariable("submission-id") Long submissionId, Authentication auth) {
        Optional<Submission> submissionOptional = submissionRepository.findById(submissionId);
        if (submissionOptional.isEmpty())
            return buildResponse(HttpStatus.BAD_REQUEST, "Delete Submission: Không tìm thấy submission phù hợp  ", null);
        Submission submission = submissionOptional.get();
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        Course course = submission.getAssignment().getCourse();

        UserCourse userCourse = userCourseRepository
                .findByUser_UsernameAndCourse_Id(userDetails.getUsername(), course.getId())
                .orElse(null);
        String username = userDetails.getUsername();
        if (!submission.getUser().getUsername().equals(username) || userCourse == null ||
                !userCourse.getRole().equals(CourseRole.TUTOR)) {
            return buildResponse(HttpStatus.FORBIDDEN, "Delete Submission: Bạn không có quyền xóa submission này", null);
        }
        submissionRepository.delete(submission);
        return buildResponse(HttpStatus.OK, "Delete Submission: Xóa submission thành công", SubmissionMapper.toDTO(submission));
    }


    @PutMapping("/grade/{submission-id}")
    public ResponseEntity gradeSubmission(@PathVariable("submission-id") Long submissionId,
                                          @RequestParam("grade") Double grade, Authentication auth) {

        Submission submission;
        try {
            submission = extractSubmission(submissionId);
        } catch (RuntimeException e) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Grade Submission: " + e.getMessage(), null) ;
        }

        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        Course course = submission.getAssignment().getCourse();
        UserCourse userCourse = userCourseRepository
                .findByUser_UsernameAndCourse_Id(userDetails.getUsername(), course.getId())
                .orElse(null);
        String username = userDetails.getUsername();
        if (!submission.getUser().getUsername().equals(username) || userCourse == null ||
                !userCourse.getRole().equals(CourseRole.TUTOR)) {
            return buildResponse(HttpStatus.FORBIDDEN, "Grade Submission: Bạn không có quyền chấm submission này", null);
        }

        submission.setGrade(grade);
        submissionRepository.save(submission);
        return buildResponse(HttpStatus.OK, "Grade Submission: Chấm điểm thành công", SubmissionMapper.toDTO(submission));
    }

    @PutMapping(
            value = "/edit/{submissionId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity editSubmission(@PathVariable("submissionId") Long submissionId,
                                         @RequestPart("file") MultipartFile file,
                                         Authentication auth) {
        // Validation logic
        Submission submission;
        try {
            submission = extractSubmission(submissionId);
        } catch (RuntimeException e) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Edit Submission: " + e.getMessage(), null) ;
        }
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        String username = userDetails.getUsername();
        if (!submission.getUser().getUsername().equals(username)) {
            return buildResponse(HttpStatus.FORBIDDEN,
                    "Edit Submission: Bạn không có quyền chỉnh sửa submission này", null);
        }

        // Storing logic
        String s3Key = generateSubmissionFileKey(submission, file);
        SubmissionFile submissionFile;
        try {
            submissionFile = buildSubmissionFile(s3Key, submission, file);
        } catch (IOException e) {
            return buildResponse(HttpStatus.BAD_REQUEST,
                    "Edit Submission: Không upload được lên s3 - " + e.getMessage(), null);
        }
        submission.addFile(submissionFile);
        return buildResponse(HttpStatus.OK, "Edit Submission: Chỉnh sửa thành công",
                SubmissionMapper.toDTO(submissionRepository.save(submission)));
    }


    // Helper
    private SubmissionFile buildSubmissionFile(String s3Key,
                                               Submission submission, MultipartFile file) throws IOException{

        s3Service.uploadFile(
                s3Key,
                file.getInputStream(),
                file.getSize(),
                file.getContentType()
        );

        SubmissionFile submissionFile = new SubmissionFile();
        submissionFile.setSubmission(submission);
        submissionFile.setS3Key(s3Key);
        submissionFile.setOriginalFilename(file.getOriginalFilename());
        submissionFile.setContentType(file.getContentType());
        submissionFile.setFileSize(file.getSize());
        submissionFile.setUploadedAt(LocalDateTime.now());
        return submissionFile;
    }

    private User extractStudentFromUserCourse(Long courseId, Authentication auth) {
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        Optional<UserCourse> userCourseOptional = userCourseRepository
                .findByUser_UsernameAndCourse_Id(userDetails.getUsername(), courseId);
        if (userCourseOptional.isEmpty())
            throw new RuntimeException("Không phải học sinh khóa học");
        UserCourse userCourse = userCourseOptional.get();
        return userCourse.getUser();
    }

    private Assignment extractAssignmentFromUserCourse(Long assignmentId) {
        Optional<Assignment> assignmentOptional = assignmentRepository.findById(assignmentId);
        if (assignmentOptional.isEmpty())
            throw new RuntimeException("Không tìm thấy assignment phù hợp");
        return assignmentOptional.get();
    }

    private String validateAssignment(Assignment assignment, Long courseId, User user) {
        if (assignment.getCourse() == null || assignment.getCourse().getCourseCode() == null ||
                !assignment.getCourse().getId().equals(courseId)) {
            return "Assignment không thuộc khóa học";
        }
        if (submissionRepository.existsByUser_IdAndAssignment_Id(user.getId(), assignment.getId())) {
            return "Submission: User đã nộp bài rồi, chỉ có thể edit!";
        }
        return null;
    }

    private Submission extractSubmission(Long submissionId) throws RuntimeException {
        Optional<Submission> submissionOptional = submissionRepository.findById(submissionId);
        if (submissionOptional.isEmpty())
            throw new RuntimeException("Không tìm thấy submission phù hợp");
        return submissionOptional.get();
    }

    private String generateSubmissionFileKey(Submission submission, MultipartFile file) {
        String s3Key = String.format("submissions/assignment-%d/user-%d/submission-%d/%s",
                submission.getAssignment().getId(),
                submission.getUser().getId(),
                submission.getId(),
                UUID.randomUUID() + "-" + file.getOriginalFilename());

        return s3Key;
    }


}
