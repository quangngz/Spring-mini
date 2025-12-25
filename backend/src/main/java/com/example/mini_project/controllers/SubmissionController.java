package com.example.mini_project.controllers;

import com.example.mini_project.entities.user.User;
import com.example.mini_project.entities.assignment.Assignment;
import com.example.mini_project.entities.course.Course;
import com.example.mini_project.entities.course.CourseRole;
import com.example.mini_project.entities.submission.Submission;
import com.example.mini_project.entities.submission.SubmissionDTO;
import com.example.mini_project.entities.submission.SubmissionMapper;
import com.example.mini_project.entities.submission.SubmissionStatus;
import com.example.mini_project.entities.usercourse.UserCourse;
import com.example.mini_project.repositories.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static com.example.mini_project.controllers.UserController.buildResponse;


@RestController
@RequestMapping("/submissions")
public class SubmissionController {
    private final UserCourseRepository userCourseRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;

    public SubmissionController(UserCourseRepository userCourseRepository,
                                AssignmentRepository assignmentRepository, SubmissionRepository submissionRepository) {
        this.assignmentRepository = assignmentRepository;
        this.userCourseRepository = userCourseRepository;
        this.submissionRepository = submissionRepository;
    }

    @GetMapping("/{courseCode}")
    public ResponseEntity getAllCourseSubmission(@PathVariable("courseCode") String courseCode) {
        List<SubmissionDTO> submissionDTOList = this.submissionRepository.findByAssignment_Course_CourseCode(courseCode)
                .stream().map(SubmissionMapper::toDTO).toList();
        return buildResponse(HttpStatus.OK, "Lấy submission theo courseCode thành công", submissionDTOList);
    }

    @GetMapping()
    public ResponseEntity getSubmissionByAssignment(@RequestParam("assignmentId") Long assignmentId) {
        List<SubmissionDTO> submissionDTOList = this.submissionRepository.findByAssignment_Id(assignmentId)
                .stream().map(SubmissionMapper::toDTO).toList();
        return buildResponse(HttpStatus.OK, "Lấy submission theo assignment thành công", submissionDTOList);
    }

    @PostMapping("/submit/{courseCode}/{assignmentId}")
    public ResponseEntity buildSubmission(@PathVariable("courseCode") String courseCode,
                                          @PathVariable("assignmentId") Long assignmentId,
                                          @RequestBody Submission submission, Authentication auth) {
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        Optional<UserCourse> userCourseOptional = userCourseRepository
                .findByUser_UsernameAndCourse_CourseCode(userDetails.getUsername(), courseCode);
        if (userCourseOptional.isEmpty())
            return buildResponse(HttpStatus.BAD_REQUEST, "Submission: Không phải là học sinh của khóa học", null);
        UserCourse userCourse = userCourseOptional.get();
        User user = userCourse.getUser();

        Optional<Assignment> assignmentOptional = assignmentRepository.findById(assignmentId);
        if (assignmentOptional.isEmpty())
            return buildResponse(HttpStatus.BAD_REQUEST, "Submission: Không tìm thấy assignment phù hợp", null);
        Assignment assignment = assignmentOptional.get();

        // Validate assignment belongs to the given course
        if (assignment.getCourse() == null || assignment.getCourse().getCourseCode() == null ||
                !assignment.getCourse().getCourseCode().equals(courseCode)) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Submission: Assignment không thuộc khóa học", null);
        }
        if (submissionRepository.existsByUser_IdAndAssignment_Id(user.getId(), assignment.getId())) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Submission: User đã nộp bài rồi, chỉ có thể edit!", null);
        }
        LocalDateTime now = LocalDateTime.now();
        submission.setSubmissionTime(now);
        submission.setUser(user);
        submission.setAssignment(assignment);
        if (now.isAfter(assignment.getAssignmentDue())) {
            submission.setStatus(SubmissionStatus.LATE);
        } else {
            submission.setStatus(SubmissionStatus.SUBMITTED);
        }
        Submission addedSubmission = submissionRepository.save(submission);
        return buildResponse(HttpStatus.OK, "Submission: Thành công!", SubmissionMapper.toDTO(addedSubmission));
    }

    @PutMapping("/grade/{submissionId}")
    public ResponseEntity gradeSubmission(@PathVariable("submissionId") Long submissionId,
                                          @RequestParam("grade") Double grade, Authentication auth) {

        Optional<Submission> submissionOptional = submissionRepository.findById(submissionId);
        if (submissionOptional.isEmpty()) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Grade Submission: Không tìm thấy submission phù hợp", null);
        }
        Submission submission = submissionOptional.get();
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        String username = userDetails.getUsername();
        String courseCode = submission.getAssignment().getCourse().getCourseCode();
        Optional<UserCourse> userCourseOptional = userCourseRepository
                .findByUser_UsernameAndCourse_CourseCode(username, courseCode);
        if (userCourseOptional.isEmpty() || !userCourseOptional.get().getRole().equals(CourseRole.TUTOR)) {
            return buildResponse(HttpStatus.FORBIDDEN, "Grade Submission: Bạn không có quyền chấm điểm submission này", null);
        }

        submission.setGrade(grade);
        submissionRepository.save(submission);
        return buildResponse(HttpStatus.OK, "Grade Submission: Chấm điểm thành công", SubmissionMapper.toDTO(submission));
    }

    @PutMapping("/edit/{submissionId}")
    public ResponseEntity editSubmission(@PathVariable("submissionId") Long submissionId,
                                         @RequestBody Submission newSubmission, Authentication auth) {
        Optional<Submission> submissionOptional = submissionRepository.findById(submissionId);
        if (submissionOptional.isEmpty()) {
            return buildResponse(HttpStatus.BAD_REQUEST, "Edit Submission: Không tìm thấy submission phù hợp", null);
        }
        Submission existingSubmission = submissionOptional.get();
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        String username = userDetails.getUsername();
        if (!existingSubmission.getUser().getUsername().equals(username)) {
            return buildResponse(HttpStatus.FORBIDDEN, "Edit Submission: Bạn không có quyền chỉnh sửa submission này", null);
        }

        // Chỉ cho phép chỉnh sửa nội dung submission
        if (newSubmission.getContent() != null) {
            existingSubmission.setContent(newSubmission.getContent());
        }
        LocalDateTime now = LocalDateTime.now();
        existingSubmission.setSubmissionTime(now);
        submissionRepository.save(existingSubmission);
        return buildResponse(HttpStatus.OK, "Edit Submission: Chỉnh sửa thành công", SubmissionMapper.toDTO(existingSubmission));
    }

    @DeleteMapping("/delete/{submissionId}")
    public ResponseEntity deleteSubmission(@PathVariable("submissionId") Long submissionId, Authentication auth) {
        Optional<Submission> submissionOptional = submissionRepository.findById(submissionId);
        if (submissionOptional.isEmpty())
            return buildResponse(HttpStatus.BAD_REQUEST, "Delete Submission: Không tìm thấy submission phù hợp  ", null);
        Submission submission = submissionOptional.get();
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        Course course = submission.getAssignment().getCourse();
        UserCourse userCourse = userCourseRepository
                .findByUser_UsernameAndCourse_CourseCode(userDetails.getUsername(), course.getCourseCode())
                .orElse(null);
        String username = userDetails.getUsername();
        if (!submission.getUser().getUsername().equals(username) || userCourse == null ||
                !userCourse.getRole().equals(CourseRole.TUTOR)) {
            return buildResponse(HttpStatus.FORBIDDEN, "Delete Submission: Bạn không có quyền xóa submission này", null);
        }
        submissionRepository.delete(submission);
        return buildResponse(HttpStatus.OK, "Delete Submission: Xóa submission thành công", SubmissionMapper.toDTO(submission));
    }
}
