import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://plansure-backend-production-d3e7.up.railway.app/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("plansure_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes("/auth/login");

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("plansure_token");
      localStorage.removeItem("plansure_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  logoutAll: async () => {
    const response = await api.post("/auth/logout-all");
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },
};

export const projectAPI = {
  getAll: async (filters?: { status?: string; phase?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.phase) params.append("phase", filters.phase);
    const response = await api.get(`/projects?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    phase: string;
    startDate: string;
    description?: string;
    endDate?: string;
  }) => {
    const response = await api.post("/projects", data);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      name?: string;
      phase?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
    },
  ) => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  getPhases: async () => {
    const response = await api.get("/projects/meta/phases");
    return response.data;
  },
};

export const programmeAPI = {
  upload: async (file: File, name: string, projectId?: string) => {
    const formData = new FormData();
    formData.append("programme", file);
    formData.append("name", name);
    if (projectId) {
      formData.append("project", projectId);
    }
    const response = await api.post("/programmes/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getAll: async () => {
    const response = await api.get("/programmes");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/programmes/${id}`);
    return response.data;
  },

  getByProject: async (projectId: string) => {
    const response = await api.get(`/programmes/by-project/${projectId}`);
    return response.data;
  },

  getProjectHistory: async (projectId: string) => {
    const response = await api.get(`/programmes/project/${projectId}/history`);
    return response.data;
  },

  getLookahead: async (id: string) => {
    const response = await api.get(`/programmes/${id}/lookahead`);
    return response.data;
  },

  getOverview: async (id: string) => {
    const response = await api.get(`/programmes/${id}/overview`);
    return response.data;
  },

  getWeeklyControl: async (id: string) => {
    const response = await api.get(`/programmes/${id}/weekly-control`);
    return response.data;
  },

  updateActivity: async (
    programmeId: string,
    activityId: string,
    data: {
      owner?: string;
      ownerName?: string;
      activityStatus?: string;
      notes?: string;
      isBlocked?: boolean;
      blocker?: string;
    },
  ) => {
    const response = await api.patch(
      `/programmes/${programmeId}/activity/${activityId}`,
      data,
    );
    return response.data;
  },

  updateCycleStatus: async (id: string, cycleStatus: string) => {
    const response = await api.patch(`/programmes/${id}/cycle-status`, {
      cycleStatus,
    });
    return response.data;
  },

  pmOverride: async (id: string, overrideReason: string) => {
    const response = await api.patch(`/programmes/${id}/cycle-status`, {
      cycleStatus: "Closed",
      overrideReason,
    });
    return response.data;
  },

  getCloseEligibility: async (id: string) => {
    const response = await api.get(`/programmes/${id}/close-eligibility`);
    return response.data;
  },

  closeCycle: async (id: string, closeType: string, notes?: string) => {
    const response = await api.post(`/programmes/${id}/close-cycle`, {
      closeType,
      notes,
    });
    return response.data;
  },

  getCycleHistory: async (id: string) => {
    const response = await api.get(`/programmes/${id}/cycle-history`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/programmes/${id}`);
    return response.data;
  },

  recalculateAllRAG: async () => {
    const response = await api.post("/programmes/recalculate-rag");
    return response.data;
  },

  recalculateRAG: async (id: string) => {
    const response = await api.post(`/programmes/${id}/recalculate-rag`);
    return response.data;
  },

  getActivitiesByProject: async (
    projectId: string,
    page: number = 1,
    limit: number = 10,
    search: string = "",
  ) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    const response = await api.get(
      `/programmes/project/${projectId}/activities?${params.toString()}`,
    );
    return response.data;
  },
};

export const userAPI = {
  invite: async (data: {
    name: string;
    email: string;
    role: string;
    projectId?: string;
  }) => {
    const response = await api.post("/users/invite", data);
    return response.data;
  },

  getAll: async (filters?: {
    status?: string;
    role?: string;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.role) params.append("role", filters.role);
    if (filters?.search) params.append("search", filters.search);
    const response = await api.get(`/users?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      name?: string;
      role?: string;
      projects?: string[];
      status?: string;
    },
  ) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  block: async (id: string) => {
    const response = await api.patch(`/users/${id}/block`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  resendInvite: async (id: string) => {
    const response = await api.post(`/users/${id}/resend-invite`);
    return response.data;
  },
};

export const actionAPI = {
  getAll: async (filters?: {
    programmeId?: string;
    status?: string;
    priority?: string;
    assignee?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.programmeId) params.append("programmeId", filters.programmeId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.priority) params.append("priority", filters.priority);
    if (filters?.assignee) params.append("assignee", filters.assignee);
    const response = await api.get(`/actions?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/actions/${id}`);
    return response.data;
  },

  create: async (data: {
    programmeId: string;
    linkedActivity: { activityId: string; activityName: string };
    title: string;
    description?: string;
    type?: string;
    priority?: string;
    assignee: string;
    dueDate: string;
  }) => {
    const response = await api.post("/actions", data);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      type?: string;
      priority?: string;
      assignee?: string;
      dueDate?: string;
      status?: string;
      programmeId?: string;
      linkedActivity?: { activityId: string; activityName: string };
    },
  ) => {
    const response = await api.put(`/actions/${id}`, data);
    return response.data;
  },

  complete: async (id: string) => {
    const response = await api.patch(`/actions/${id}/complete`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/actions/${id}`);
    return response.data;
  },

  getByProgramme: async (programmeId: string) => {
    const response = await api.get(`/actions/programme/${programmeId}`);
    return response.data;
  },

  getStats: async (programmeId?: string) => {
    const params = programmeId ? `?programmeId=${programmeId}` : "";
    const response = await api.get(`/actions/stats/summary${params}`);
    return response.data;
  },
};

export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get("/dashboard/stats");
    return response.data;
  },

  getRagDistribution: async (programmeId?: string) => {
    const params = programmeId ? `?programmeId=${programmeId}` : "";
    const response = await api.get(`/dashboard/rag-distribution${params}`);
    return response.data;
  },

  getRecentActivity: async (limit: number = 10) => {
    const response = await api.get(`/dashboard/recent-activity?limit=${limit}`);
    return response.data;
  },

  getWeeklyDashboard: async (projectId?: string) => {
    const params = projectId ? `?projectId=${projectId}` : "";
    const response = await api.get(`/dashboard/weekly${params}`);
    return response.data;
  },
};

export const notificationAPI = {
  getAll: async (limit: number = 20, unreadOnly: boolean = false) => {
    const response = await api.get(
      `/notifications?limit=${limit}&unreadOnly=${unreadOnly}`,
    );
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch("/notifications/read-all");
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

export const fcmAPI = {
  registerToken: async (token: string, deviceInfo?: string) => {
    const response = await api.post("/fcm/register-token", {
      token,
      deviceInfo,
    });
    localStorage.setItem("plansure_fcm_token", token);
    return response.data;
  },

  unregisterToken: async (token: string) => {
    const response = await api.delete("/fcm/unregister-token", {
      data: { token },
    });
    localStorage.removeItem("plansure_fcm_token");
    return response.data;
  },

  togglePush: async (enabled: boolean) => {
    const response = await api.patch("/fcm/toggle-push", { enabled });
    return response.data;
  },

  getStatus: async () => {
    const response = await api.get("/fcm/status");
    return response.data;
  },
};

export default api;
