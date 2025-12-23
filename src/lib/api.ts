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
  name: string;
  isPrivate: boolean;
  endDate?: string;
  createdBy: string;
}

export interface CourseCreateRequest {
  courseCode: string;
  name: string;
  isPrivate: boolean;
  endDate?: string;
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
    const response: AxiosResponse<ApiResponse<CourseDTO[]>> = await api.get('/courses');
    return response.data.data;
  },

  getByCode: async (courseCode: string): Promise<CourseDTO> => {
    const response: AxiosResponse<ApiResponse<CourseDTO>> = await api.get(`/courses/${courseCode}`);
    return response.data.data;
  },

  getEnrollments: async (courseCode: string): Promise<UserCourse[]> => {
    const response: AxiosResponse<ApiResponse<UserCourse[]>> = await api.get(`/courses/all-users/${courseCode}`);
    return response.data.data;
  },

  search: async (q?: string, isPrivate?: boolean): Promise<CourseDTO[]> => {
    const response: AxiosResponse<ApiResponse<CourseDTO[]>> = await api.get('/courses/search', {
      params: { q, 'is-private': isPrivate },
    });
    return response.data.data || [];
  },

  create: async (data: CourseCreateRequest): Promise<CourseDTO> => {
    const response: AxiosResponse<ApiResponse<CourseDTO>> = await api.post('/courses/create', data);
    return response.data.data;
  },

  update: async (courseCode: string, data: Partial<CourseCreateRequest>): Promise<CourseDTO> => {
    const response: AxiosResponse<ApiResponse<CourseDTO>> = await api.put(`/courses/update/${courseCode}`, data);
    return response.data.data;
  },

  delete: async (courseCode: string): Promise<void> => {
    await api.delete(`/courses/delete/${courseCode}`);
  },
};

// Enrollment API
export const enrollmentApi = {
  enroll: async (courseCode: string): Promise<UserCourse> => {
    const response: AxiosResponse<ApiResponse<UserCourse>> = await api.post(`/users-courses/enroll/${courseCode}`);
    return response.data.data;
  },

  withdraw: async (courseCode: string): Promise<void> => {
    await api.delete(`/users-courses/withdraw/${courseCode}`);
  },

  promoteTutor: async (courseCode: string, userId: number): Promise<UserCourse> => {
    const response: AxiosResponse<ApiResponse<UserCourse>> = await api.put('/users-courses/promote-tutor', null, {
      params: { courseCode, userId },
    });
    return response.data.data;
  },

  demoteTutor: async (courseCode: string, userId: number): Promise<UserCourse> => {
    const response: AxiosResponse<ApiResponse<UserCourse>> = await api.put('/users-courses/demote-tutor', null, {
      params: { courseCode, userId },
    });
    return response.data.data;
  },

  removeAllStudents: async (courseCode: string): Promise<void> => {
    await api.delete(`/users-courses/remove-all-student/${courseCode}`);
  },

  removeAllCoursesForUser: async (userId: number): Promise<void> => {
    await api.delete(`/users-courses/remove-all-courses-for-user/${userId}`);
  },
};

// Assignments API
export const assignmentsApi = {
  getAll: async (courseCode: string): Promise<Assignment[]> => {
    const response: AxiosResponse<ApiResponse<Assignment[]>> = await api.get(`/courses/${courseCode}/assignments`);
    return response.data.data;
  },

  create: async (courseCode: string, data: AssignmentCreateRequest): Promise<Assignment> => {
    const response: AxiosResponse<ApiResponse<Assignment>> = await api.post(
      `/courses/${courseCode}/assignments/create`,
      data
    );
    return response.data.data;
  },

  update: async (courseCode: string, data: Partial<Assignment> & { id: number }): Promise<Assignment> => {
    const response: AxiosResponse<ApiResponse<Assignment>> = await api.put(
      `/courses/${courseCode}/assignments/edit`,
      data
    );
    return response.data.data;
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

  getByAssignment: async (courseCode: string, assignmentId: number): Promise<Submission[]> => {
    const response: AxiosResponse<ApiResponse<Submission[]>> = await api.get(
      `/submissions/${courseCode}/${assignmentId}`
    );
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
