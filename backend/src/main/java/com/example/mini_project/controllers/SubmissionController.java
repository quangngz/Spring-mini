package com.example.mini_project.controllers;

import com.example.mini_project.entities.assignment.Assignment;
import com.example.mini_project.entities.course.Course;
import com.example.mini_project.entities.course.CourseRole;
import com.example.mini_project.entities.file.SubmissionFile;
import com.example.mini_project.entities.submission.*;
import com.example.mini_project.entities.user.User;
import com.example.mini_project.entities.usercourse.UserCourse;
import com.example.mini_project.repositories.AssignmentRepository;
import com.example.mini_project.repositories.SubmissionRepository;
import com.example.mini_project.repositories.UserCourseRepository;
import com.example.mini_project.service.S3Service;
import com.example.mini_project.service.UploadPdfService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static com.example.mini_project.controllers.UserController.buildResponse;


@RestController
@RequestMapping("courses/{course-id}/assignments/{assignment-id}/submissions")
public class SubmissionController {
    private final UserCourseRepository userCourseRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final S3Service s3Service;

    @Autowired
    private UploadPdfService uploadPdfService;

    public SubmissionController(UserCourseRepository userCourseRepository,
                                AssignmentRepository assignmentRepository,
                                SubmissionRepository submissionRepository,
                                S3Service s3Service) {
        this.assignmentRepository = assignmentRepository;
        this.userCourseRepository = userCourseRepository;
        this.submissionRepository = submissionRepository;
        this.s3Service = s3Service;
    }

    @GetMapping()
    public ResponseEntity<?> getSubmissionByAssignment(@PathVariable("assignment-id") Long assignmentId) {
        List<SubmissionDTO> submissionDTOList = this.submissionRepository.findByAssignment_Id(assignmentId)
                .stream().map(SubmissionMapper::toDTO).toList();
        return buildResponse(HttpStatus.OK, "Lấy submission theo assignment thành công", submissionDTOList);
    }

    /**
     * Index để có thể chọn xem muốn xem submission nào.
     *
     * @param submissionId
     * @return
     */
    @GetMapping("/{submissionId}/pdf")
    public ResponseEntity<?> getSubmissionPdf(@PathVariable Long submissionId,
                                              @RequestParam(value = "index", required = false) Integer index) {

        Submission submission = extractSubmission(submissionId);
        
        if (submission.getFiles() == null || submission.getFiles().isEmpty()) {
            return buildResponse(HttpStatus.NOT_FOUND, "Submission: Không có file PDF nào", null);
        }
        
        // Default to index 0 (newest file due to @OrderBy DESC)
        int fileIndex = (index != null && index >= 0 && index < submission.getFiles().size()) 
                        ? index : 0;
        
        SubmissionFile file = submission.getFiles().get(fileIndex);

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

    @Transactional
    @PostMapping(
            value = "/submit",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> buildSubmission(@PathVariable("course-id") Long courseId,
                                             @PathVariable("assignment-id") Long assignmentId,
                                             @RequestPart(value = "file") List<MultipartFile> files,
                                             @RequestPart(value = "request") SubmissionRequestDTO request,
                                             Authentication auth) {
        // Validation logic
        User user;
        Assignment assignment;
        String validationString;
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
        if (files == null || files.isEmpty()) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Submission: Cần ít nhất một file", null);
        }

        Submission submission = new Submission();
        submission.setUser(user);
        submission.setAssignment(assignment);
        submission.setDescription(request.getDescription());
        LocalDateTime now = LocalDateTime.now();
        submission.setSubmissionTime(now);
        if (now.isAfter(assignment.getAssignmentDue())) {
            submission.setStatus(SubmissionStatus.LATE);
        } else {
            submission.setStatus(SubmissionStatus.SUBMITTED);
        }
        Submission addedSubmission = submissionRepository.save(submission); // save lần 1 để tạo submission id

        // tạo submission files
        try {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String s3Key = SubmissionFile.generateS3Key(submission, file);
                    SubmissionFile submissionFile = SubmissionFile.buildSubmissionFile(s3Service, s3Key, submission, file);
                    submission.addFile(submissionFile);
                }
            }
        } catch (IOException e) {
            return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Submission: Upload file thất bại (S3)", null);
        }
        addedSubmission = submissionRepository.save(submission); // lưu lần 2 để lưu files
        return buildResponse(HttpStatus.OK,
                "Submission: Thành công!",
                SubmissionMapper.toDTO(addedSubmission));
    }



    @Transactional
    @DeleteMapping("/{submission-id}/delete")
    public ResponseEntity<?> deleteSubmission(@PathVariable("submission-id") Long submissionId,
                                              Authentication auth) {
        Submission submission;
        try {
            submission = extractSubmission(submissionId);
            authorizeUser(auth, submission);
        } catch (RuntimeException e) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Delete Submission: " + e.getMessage(), null);
        }

        submission.getFiles().forEach(file -> uploadPdfService.deleteFile(file.getS3Key()));
        submissionRepository.delete(submission);
        return buildResponse(HttpStatus.OK, "Delete Submission: Xóa submission thành công",
                SubmissionMapper.toDTO(submission));
    }


//    @DeleteMapping("/delete")
//    public ResponseEntity<?> deleteAllSubmission(Authentication auth) {
//        return null; // TODO: Làm sau
//    }

    @PutMapping("/{submission-id}/grade")
    public ResponseEntity<?> gradeSubmission(@PathVariable("submission-id") Long submissionId,
                                             @RequestParam("grade") Double grade, Authentication auth) {

        Submission submission;
        try {
            submission = extractSubmission(submissionId);
        } catch (RuntimeException e) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Grade Submission: " + e.getMessage(), null);
        }

        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        String username = userDetails.getUsername();
        Course course = submission.getAssignment().getCourse();
        UserCourse userCourse = userCourseRepository
                .findByUser_UsernameAndCourse_Id(username, course.getId())
                .orElse(null);

        // Only tutors can grade submissions
        boolean isTutor = userCourse != null && userCourse.getRole().equals(CourseRole.TUTOR);
        if (!isTutor) {
            return buildResponse(HttpStatus.FORBIDDEN, "Grade Submission: Bạn không có quyền chấm submission này", null);
        }

        submission.setGrade(grade);
        submissionRepository.save(submission);
        return buildResponse(HttpStatus.OK, "Grade Submission: Chấm điểm thành công", SubmissionMapper.toDTO(submission));
    }

    @Transactional
    @PutMapping(
            value = "/{submission-id}/edit",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> editSubmission(@PathVariable("submission-id") Long submissionId,
                                            @RequestPart(value = "file") List<MultipartFile> files,
                                            @RequestPart(value = "request") SubmissionRequestDTO requestDTO,
                                            Authentication auth) {
        // Validation logic
        Submission submission;
        try {
            submission = extractSubmission(submissionId);
            authorizeUser(auth, submission);
        } catch (RuntimeException e) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Edit Submission: " + e.getMessage(), null);
        }
        if (files == null || files.isEmpty()) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Edit Submission: Cần ít nhất một file", null);
        }
        if (requestDTO.getDescription() != null && !requestDTO.getDescription().isEmpty()) {
            submission.setDescription(requestDTO.getDescription());
        }
        // Storing logic
        try {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String s3Key = SubmissionFile.generateS3Key(submission, file);
                    SubmissionFile submissionFile = SubmissionFile.buildSubmissionFile(s3Service, s3Key, submission, file);
                    submission.addFile(submissionFile);
                }
            }
        } catch (IOException e) {
            return buildResponse(HttpStatus.BAD_REQUEST,
                    "Edit Submission: Không upload được lên s3 - " + e.getMessage(), null);
        }
        return buildResponse(HttpStatus.OK, "Edit Submission: Chỉnh sửa thành công",
                SubmissionMapper.toDTO(submissionRepository.save(submission)));
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

    // Tutor là người submit, hoặc là admin hoặc là tutor
    private void authorizeUser(Authentication auth, Submission submission) {
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        String username = userDetails.getUsername();

        // Check if user is the owner of the submission
        boolean isOwner = submission.getUser().getUsername().equals(username);

        // Check if user is a tutor in the course
        Course course = submission.getAssignment().getCourse();
        UserCourse userCourse = userCourseRepository
                .findByUser_UsernameAndCourse_Id(username, course.getId())
                .orElse(null);
        boolean isTutor = userCourse != null && userCourse.getRole().equals(CourseRole.TUTOR);

        // Allow access if user is owner OR tutor
        if (!isOwner && !isTutor) {
            throw new RuntimeException("Bạn không có quyền này");
        }
    }
}
