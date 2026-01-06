package com.example.mini_project.controllers;

import com.example.mini_project.entities.submission.*;
import com.example.mini_project.entities.user.User;
import com.example.mini_project.entities.assignment.Assignment;
import com.example.mini_project.entities.course.Course;
import com.example.mini_project.entities.course.CourseRole;
import com.example.mini_project.entities.usercourse.UserCourse;
import com.example.mini_project.repositories.*;
import com.example.mini_project.service.S3Service;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static com.example.mini_project.controllers.UserController.buildResponse;


@RestController
@RequestMapping("courses/{course-id}/assignments/{assignment-id}/submissions")
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

//    @GetMapping()
//    public ResponseEntity<?> getAllCourseSubmission(@PathVariable("course-id") Long courseId) {
//        List<SubmissionDTO> submissionDTOList = this.submissionRepository.findByAssignment_Course_Id(courseId)
//                .stream().map(SubmissionMapper::toDTO).toList();
//        return buildResponse(HttpStatus.OK, "Lấy submission theo courseId thành công", submissionDTOList);
//    }

    @GetMapping()
    public ResponseEntity<?> getSubmissionByAssignment(@PathVariable("assignment-id") Long assignmentId) {
        List<SubmissionDTO> submissionDTOList = this.submissionRepository.findByAssignment_Id(assignmentId)
                .stream().map(SubmissionMapper::toDTO).toList();
        return buildResponse(HttpStatus.OK, "Lấy submission theo assignment thành công", submissionDTOList);
    }

    /**
     * Index để có thể chọn xem muốn xem submission nào.
     * @param submissionId
     * @return
     */
    @GetMapping("/{submissionId}/pdf")
    public ResponseEntity<?> getSubmissionPdf(@PathVariable Long submissionId,
                                              @RequestParam(value = "index", required = false) Integer index) {
        Submission submission;
        try {
            submission = extractSubmission(submissionId);
        } catch (RuntimeException e) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Không tìm thấy submission pdf", null);
        }

        List<SubmissionFile> files = submission.getFiles();
        if (index == null) index = files.size() - 1;
        if (files.size() <= index) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Index ngoài tầm của submission files", null);
        }
        InputStream pdfStream = s3Service.downloadFile(files.get(index).getS3Key());
        InputStreamResource resource = new InputStreamResource(pdfStream);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + files.get(index).getOriginalFilename() + "\""
                )
                .body(resource);
    }

    @Transactional
    @PostMapping(
            value = "/submit",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> buildSubmission(@PathVariable("course-id") Long courseId,
                                          @PathVariable("assignment-id") Long assignmentId,
                                          @RequestPart(value = "file", required = false) List<MultipartFile> files,
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
        if (files == null || files.isEmpty()) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Submission: Cần ít nhất một file", null);
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

        // tạo submission files
        try {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String s3Key = generateSubmissionFileKey(submission, file);
                    SubmissionFile submissionFile = buildSubmissionFile(s3Key, submission, file);
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

        submission.getFiles().forEach(file -> s3Service.deleteObject(file.getS3Key()));
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
                                         @RequestPart(value = "file", required = false) List<MultipartFile> files,
                                         Authentication auth) {
        // Validation logic
        Submission submission;
        try {
            submission = extractSubmission(submissionId);
            authorizeUser(auth, submission);
        } catch (RuntimeException e) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Edit Submission: " + e.getMessage(), null) ;
        }
        if (files == null || files.isEmpty()) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Edit Submission: Cần ít nhất một file", null);
        }

        // Storing logic
        try {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String s3Key = generateSubmissionFileKey(submission, file);
                    SubmissionFile submissionFile = buildSubmissionFile(s3Key, submission, file);
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
