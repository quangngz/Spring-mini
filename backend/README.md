# Spring-mini Backend API

Base URL: http://localhost:8080

All JSON responses use a common wrapper:

```json
{
  "message": "Human-readable message",
  "data": { /* endpoint-specific payload */ }
}
```

Authentication: JWT Bearer tokens
- Sign in at POST /auth/signin to receive a token
- Include the token in requests: `Authorization: Bearer <token>`

Examples
```bash
# Sign in
curl -s -X POST http://localhost:8080/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice","password":"secret"}'

# Use token
curl -s http://localhost:8080/users \
  -H 'Authorization: Bearer <token>'
```

---

## Auth

### POST /auth/signin
Authenticate and receive a JWT.

Request body:
```json
{ "username": "alice", "password": "secret" }
```
Response data: the JWT token string.

### POST /auth/signup
Register a new user. Default role USER if none provided.

Request body (User fields; password is required and will be encoded):
```json
{
  "username": "alice",
  "password": "secret",
  "firstname": "Alice",
  "lastname": "Nguyen"
}
```

---

## Users

### GET /users
List all users (DTO).
- Auth: required

Response data: array of UserDTO.

### GET /users/{username}
Get a single user by username (DTO).
- Auth: required

### GET /users/search
Search users by optional filters.
- Auth: required
- Query params (all optional): firstname, lastname, phoneNum, address, age, city
- Note: age is mapped to a date-of-birth range server-side.

### POST /users/create
Create a new user.
- Auth: required
- Role: ADMIN only
- Body: User (password encoded; roles inferred from authorities if not set)

### PUT /users/update/{username}
Update user details.
- Auth: required
- Permission: ADMIN or the user themself (owner)
- Body: partial User fields (address, dob, firstname, lastname, phoneNum, password)

### DELETE /users/delete/{username}
Delete a user.
- Auth: required
- Role: ADMIN only
- Note: cannot delete users with ADMIN role

---

## Courses

Base: /courses

### GET /courses
List all courses (DTO).
- Auth: required

### GET /courses/{coursecode}
Get course by code (DTO).
- Auth: required

### GET /courses/all-users/{coursecode}
List enrollments (UserCourse) for a course.
- Auth: required
- Response data: array of UserCourse entries

### GET /courses/search?q=...&is-private=...
Search courses by keyword and privacy flag.
- Auth: required
- Query params:
  - q (String) — keyword
  - is-private (Boolean)
- Response data: array of CourseDTO (or null when no matches per controller behavior)

### POST /courses/create
Create a course.
- Auth: required
- Body: Course (validated)
- Behavior: createdBy is set to current user; courseCode must be unique

### PUT /courses/update/{coursecode}
Update a course.
- Auth: required
- Body: Course (validated); updates name, code, isPrivate, endDate

### DELETE /courses/delete/{coursecode}
Delete a course.
- Auth: required
- Permission: only the creator of the course may delete

---

## Users-Courses (Enrollment & Roles)

Base: /users-courses

### POST /users-courses/enroll/{courseCode}
Enroll the current user into a course as STUDENT.
- Auth: required
- Response: UserCourse
- 403 if already enrolled

### DELETE /users-courses/withdraw/{courseCode}
Withdraw the current user from a course.
- Auth: required

### PUT /users-courses/promote-tutor?courseCode=...&userId=...
Promote a user to TUTOR in a course.
- Auth: required
- Permission: only the course creator may promote
- Params: courseCode (query), userId (query)

### PUT /users-courses/demote-tutor?courseCode=...&userId=...
Demote a user to STUDENT in a course.
- Auth: required
- Permission: only the course creator may demote

### DELETE /users-courses/remove-all-student/{courseCode}
Remove all students from a course.
- Auth: required
- Permission: only the course creator

### DELETE /users-courses/remove-all-courses-for-user/{userId}
Remove all enrollments for the current user.
- Auth: required
- Permission: userId must match the current user

---

## Assignments

Base: /courses/{courseCode}/assignments

### GET /courses/{courseCode}/assignments
List assignments.
- Auth: required
- Note: current implementation returns all assignments; may not filter by courseCode.

### POST /courses/{courseCode}/assignments/create
Create an assignment.
- Auth: required
- Permission: must be TUTOR in the course
- Body: Assignment (validated); server sets course and createdBy

### PUT /courses/{courseCode}/assignments/edit
Edit an assignment.
- Auth: required
- Permission: TUTOR in the course
- Body: Assignment; id is required; updatable fields: assignmentDue, assignmentName, assignmentWeight

### DELETE /courses/{courseCode}/assignments/delete
Delete an assignment.
- Auth: required
- Permission: TUTOR in the course
- Body: Assignment; id is required

---

## Submissions

Base: /submissions

### GET /submissions/{courseCode}
List submissions for a course.
- Auth: required
- Response: array of Submission

### GET /submissions/{courseCode}/{assignmentId}
List submissions for a specific assignment.
- Auth: required
- Response: array of Submission

### POST /submissions/submit/{courseCode}/{assignmentId}
Create a submission for an assignment.
- Auth: required
- Permission: must be enrolled as STUDENT in the course
- Body: Submission (e.g., content); server sets submissionTime and status (SUBMITTED or LATE)

### PUT /submissions/grade/{submissionId}?grade=...
Grade a submission.
- Auth: required
- Permission: must be TUTOR in the submission's course
- Param: grade (Double)

### PUT /submissions/edit/{submissionId}
Edit own submission content.
- Auth: required
- Permission: submission owner only
- Body: Submission with content; server updates submissionTime

---

## Conventions
- Authorization header: `Authorization: Bearer <token>`
- Date/time fields use ISO-8601 format
- Most responses are wrapped in `ResponseDTO { message, data }`
- Validation errors return 400 with a message describing field issues

## Notes
- Some endpoints operate within a transaction (@Transactional) so changes are persisted via entity relationships (no explicit repository save needed in those cases).
- For file uploads (future work): use multipart/form-data and store metadata on entities, then provide download endpoints with authorization.
