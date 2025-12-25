import axios, { AxiosInstance, AxiosResponse } from 'axios';

const BASE_URL = 'http://localhost:8080';

// Response wrapper type
export interface ApiResponse<T> {
  message: string;
  data: T;
}

// Auth types
export interface SignInRequest {
  username: string;
  password: string;
}

export interface SignUpRequest {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
}

// User types
export interface UserDTO {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  phoneNum?: string;
  address?: string;
  dob?: string;
  roles: string[];
}

export interface UserSearchParams {
  firstname?: string;
  lastname?: string;
  phoneNum?: string;
  address?: string;
  age?: number;
  city?: string;
}

// Course types
export interface CourseDTO {
  id: number;
  courseCode: string;
  courseName: string;
  isPrivate: boolean;
  endDate?: string;
  createdBy: string;
  courseDescription?: string;
}

export interface CourseCreateRequest {
  courseCode: string;
  courseName: string;
  isPrivate: boolean;
  endDate?: string;
  password?: string;
  courseDescription?: string;
  description?: string; // alias for backend compatibility
}

// Align with backend CourseUpdateRequest(@Valid Course course, String oldPassword, String password1, String password2)
export interface CourseUpdateRequest {
  course: {
    courseCode: string;
    courseName?: string;
    isPrivate?: boolean;
    endDate?: string;
    courseDescription?: string;
  };
  oldPassword?: string;
  password1?: string;
  password2?: string;
}

export interface UserCourse {
  id: number;
  userId: number;
  username: string;
  courseCode: string;
  role: 'STUDENT' | 'TUTOR';
}

// Assignment types
export interface Assignment {
  id: number;
  assignmentName: string;
  assignmentDue: string;
  assignmentWeight: number;
  courseCode: string;
  createdBy: string;
}

export interface AssignmentCreateRequest {
  assignmentName: string;
  assignmentDue: string;
  assignmentWeight: number;
}

// Submission types
export interface Submission {
  id: number;
  assignmentId: number;
  userId: number;
  username: string;
  content: string;
  submissionTime: string;
  status: 'SUBMITTED' | 'LATE';
  grade?: number;
}

export interface SubmissionCreateRequest {
  content: string;
}

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth interceptor
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
};

const api = createApiClient();

// Normalize backend enrollment payloads to match UserCourse interface
const normalizeUserCourse = (raw: any, fallbackCourseCode?: string): UserCourse => {
  const userId = Number(raw?.user?.id ?? raw?.userId ?? 0);
  const username = String(raw?.user?.username ?? raw?.username ?? '');
  const courseCode = String(raw?.course?.courseCode ?? raw?.courseCode ?? fallbackCourseCode ?? '');
  const roleRaw = raw?.role ?? raw?.courseRole;
  const role: 'STUDENT' | 'TUTOR' = roleRaw === 'TUTOR' ? 'TUTOR' : 'STUDENT';
  const id = typeof raw?.id === 'number' ? raw.id : (Number(raw?.user?.id) || userId || 0);
  return { id, userId, username, courseCode, role };
};

// Normalize course payloads to match CourseDTO interface
const normalizeCourse = (raw: any): CourseDTO => {
  const createdBy = typeof raw?.createdBy === 'string' ? raw.createdBy : (raw?.createdBy?.username ?? '');
  // Try multiple aliases to extract course code robustly

  const courseCode = String(raw?.courseCode).trim();
  return {
    id: Number(raw?.id ?? 0),
    courseCode, 
    courseName: String((raw?.name ?? raw?.courseName ?? '').toString().trim()),
    isPrivate: Boolean(raw?.isPrivate ?? raw?.private ?? false),
    endDate: raw?.endDate ?? undefined,
    createdBy,
    courseDescription: String(raw?.courseDescription ?? "").toString()
  };
};

// Normalize assignment payloads to match Assignment interface
const normalizeAssignment = (raw: any, fallbackCourseCode?: string): Assignment => {
  const createdBy = typeof raw?.createdBy === 'string' ? raw.createdBy : (raw?.createdBy?.username ?? '');
  return {
    id: Number(raw?.id ?? 0),
    assignmentName: String(raw?.assignmentName ?? raw?.name ?? ''),
    assignmentDue: String(raw?.assignmentDue ?? raw?.due ?? raw?.dueDate ?? ''),
    assignmentWeight: Number(raw?.assignmentWeight ?? raw?.weight ?? 0),
    courseCode: String(raw?.courseCode ?? raw?.course?.courseCode ?? fallbackCourseCode ?? ''),
    createdBy,
  };
};

// Auth API
export const authApi = {
  signIn: async (data: SignInRequest): Promise<string> => {
    const response: AxiosResponse<ApiResponse<string>> = await api.post('/auth/signin', data);
    return response.data.data;
  },

  signUp: async (data: SignUpRequest): Promise<UserDTO> => {
    const response: AxiosResponse<ApiResponse<UserDTO>> = await api.post('/auth/signup', data);
    return response.data.data;
  },
};

// Users API
export const usersApi = {
  getAll: async (): Promise<UserDTO[]> => {
    const response: AxiosResponse<ApiResponse<UserDTO[]>> = await api.get('/users');
    return response.data.data;
  },

  getByUsername: async (username: string): Promise<UserDTO> => {
    const response: AxiosResponse<ApiResponse<UserDTO>> = await api.get(`/users/${username}`);
    return response.data.data;
  },

  search: async (params: UserSearchParams): Promise<UserDTO[]> => {
    const response: AxiosResponse<ApiResponse<UserDTO[]>> = await api.get('/users/search', { params });
    return response.data.data;
  },

  create: async (data: SignUpRequest): Promise<UserDTO> => {
    const response: AxiosResponse<ApiResponse<UserDTO>> = await api.post('/users/create', data);
    return response.data.data;
  },

  update: async (username: string, data: Partial<UserDTO & { password?: string }>): Promise<UserDTO> => {
    const response: AxiosResponse<ApiResponse<UserDTO>> = await api.put(`/users/update/${username}`, data);
    return response.data.data;
  },

  delete: async (username: string): Promise<void> => {
    await api.delete(`/users/delete/${username}`);
  },
};

// Courses API
export const coursesApi = {
  getAll: async (): Promise<CourseDTO[]> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get('/courses');
    return (response.data.data || [])
      .map((c: any) => normalizeCourse(c))
      .filter((c: CourseDTO) => !!c.courseCode);
  },

  getByCode: async (courseCode: string): Promise<CourseDTO> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.get(`/courses/${courseCode}`);
    return normalizeCourse(response.data.data);
  },

  getEnrollments: async (courseCode: string): Promise<UserCourse[]> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get(`/courses/all-users/${courseCode}`);
    const rows = response.data.data || [];
    return rows.map((r: any) => normalizeUserCourse(r, courseCode));
  },

  search: async (q?: string, isPrivate?: boolean | null): Promise<CourseDTO[]> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get('/courses/search', {
      // Always include is-private param; allow null when no filter is applied
      params: { q, 'is-private': isPrivate ?? null },
    });
    return (response.data.data || [])
      .map((c: any) => normalizeCourse(c))
      .filter((c: CourseDTO) => !!c.courseCode);
  },

  create: async (data: CourseCreateRequest): Promise<CourseDTO> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post('/courses/create', data);
    return normalizeCourse(response.data.data);
  },

  update: async (
    courseCode: string,
    data: Partial<CourseCreateRequest>,
    oldPassword?: string,
    password1?: string,
    password2?: string
  ): Promise<CourseDTO> => {
    // Build request body matching backend record structure
    const body: CourseUpdateRequest = {
      course: {
        courseCode,
        courseName: data.courseName,
        isPrivate: data.isPrivate,
        endDate: data.endDate,
        courseDescription: data.courseDescription,
      },
      oldPassword,
      password1,
      password2,
    };

    const response: AxiosResponse<ApiResponse<any>> = await api.put(`/courses/update/${courseCode}`, body);
    return normalizeCourse(response.data.data);
  },

  delete: async (courseCode: string): Promise<void> => {
    await api.delete(`/courses/delete/${courseCode}`);
  },
};

// Enrollment API
export const enrollmentApi = {
  enroll: async (courseCode: string, password?: string): Promise<UserCourse> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post(`/users-courses/enroll/${courseCode}`, password ? { password } : {});
    return normalizeUserCourse(response.data.data, courseCode);
  },

  withdraw: async (courseCode: string): Promise<void> => {
    await api.delete(`/users-courses/withdraw/${courseCode}`);
  },

  promoteTutor: async (courseCode: string, userId: number): Promise<UserCourse> => {
    // Explicitly include query parameters in URL to ensure backend @RequestParam binding
    const response: AxiosResponse<ApiResponse<any>> = await api.put(
      `/users-courses/promote-tutor?courseCode=${encodeURIComponent(courseCode)}&userId=${encodeURIComponent(String(userId))}`,
      null
    );
    return normalizeUserCourse(response.data.data, courseCode);
  },

  demoteTutor: async (courseCode: string, userId: number): Promise<UserCourse> => {
    // Explicitly include query parameters in URL to ensure backend @RequestParam binding
    const response: AxiosResponse<ApiResponse<any>> = await api.put(
      `/users-courses/demote-tutor?courseCode=${encodeURIComponent(courseCode)}&userId=${encodeURIComponent(String(userId))}`,
      null
    );
    return normalizeUserCourse(response.data.data, courseCode);
  },

  removeAllStudents: async (courseCode: string): Promise<void> => {
    await api.delete(`/users-courses/remove-all-student/${courseCode}`);
  },

  removeAllCoursesForUser: async (userId: number): Promise<void> => {
    await api.delete(`/users-courses/remove-all-courses-for-user/${userId}`);
  },

  getUserEnrolledCourse: async (): Promise<CourseDTO[]> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get(`/users-courses/all-courses`);
    return (response.data.data || []).map((c: any) => normalizeCourse(c));
  },
};

// Assignments API
export const assignmentsApi = {
  getAll: async (courseCode: string): Promise<Assignment[]> => {
    const response: AxiosResponse<ApiResponse<any[]>> = await api.get(`/courses/${courseCode}/assignments`);
    return (response.data.data || []).map((a: any) => normalizeAssignment(a, courseCode));
  },

  create: async (courseCode: string, data: AssignmentCreateRequest): Promise<Assignment> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.post(
      `/courses/${courseCode}/assignments/create`,
      data
    );
    return normalizeAssignment(response.data.data, courseCode);
  },

  update: async (courseCode: string, data: Partial<Assignment> & { id: number }): Promise<Assignment> => {
    const response: AxiosResponse<ApiResponse<any>> = await api.put(
      `/courses/${courseCode}/assignments/edit`,
      data
    );
    return normalizeAssignment(response.data.data, courseCode);
  },

  delete: async (courseCode: string, assignmentId: number): Promise<void> => {
    await api.delete(`/courses/${courseCode}/assignments/delete`, { data: { id: assignmentId } });
  },
};

// Submissions API
export const submissionsApi = {
  getByCourse: async (courseCode: string): Promise<Submission[]> => {
    const response: AxiosResponse<ApiResponse<Submission[]>> = await api.get(`/submissions/${courseCode}`);
    return response.data.data;
  },

  getByAssignment: async (assignmentId: number): Promise<Submission[]> => {
    const response: AxiosResponse<ApiResponse<Submission[]>> = await api.get(
      `/submissions`,  {
      params: { "assignmentId": assignmentId },
    });
    return response.data.data;
  },

  submit: async (courseCode: string, assignmentId: number, data: SubmissionCreateRequest): Promise<Submission> => {
    const response: AxiosResponse<ApiResponse<Submission>> = await api.post(
      `/submissions/submit/${courseCode}/${assignmentId}`,
      data
    );
    return response.data.data;
  },

  grade: async (submissionId: number, grade: number): Promise<Submission> => {
    const response: AxiosResponse<ApiResponse<Submission>> = await api.put(
      `/submissions/grade/${submissionId}`,
      null,
      { params: { grade } }
    );
    return response.data.data;
  },

  edit: async (submissionId: number, content: string): Promise<Submission> => {
    const response: AxiosResponse<ApiResponse<Submission>> = await api.put(`/submissions/edit/${submissionId}`, {
      content,
    });
    return response.data.data;
  },
};

export default api;
