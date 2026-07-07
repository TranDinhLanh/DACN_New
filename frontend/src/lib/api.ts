const API_BASE_URL = "http://localhost:8001/api/v1";

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { requiresAuth = true, ...initOptions } = options;
  const headers = new Headers(initOptions.headers || {});

  // Append Content-Type if not sending FormData
  if (!(initOptions.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.append("Content-Type", "application/json");
  }

  // Attach JWT Token if required
  if (requiresAuth && typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers.append("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...initOptions,
    headers,
  });

  if (!response.ok) {
    let errorMsg = "Đã xảy ra lỗi hệ thống";
    try {
      const errorData = await response.json();
      errorMsg = errorData.detail || errorMsg;
    } catch (e) {
      // JSON parsing failed
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Login OAuth2 Form
  async login(email: string, password: string) {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    const data = await fetchAPI("/auth/login", {
      method: "POST",
      body: formData,
      requiresAuth: false,
    });

    if (data.access_token && typeof window !== "undefined") {
      localStorage.setItem("auth_token", data.access_token);
    }
    return data;
  },

  // Register with Recaptcha
  register(email: string, password: string, fullName: string, captchaToken: string) {
    return fetchAPI("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        captcha_token: captchaToken,
      }),
      requiresAuth: false,
    });
  },

  // Forgot Password
  forgotPassword(email: string) {
    return fetchAPI("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      requiresAuth: false,
    });
  },

  // Reset Password (with OTP)
  resetPassword(email: string, otp: string, newPassword: string) {
    return fetchAPI("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, new_password: newPassword }),
      requiresAuth: false,
    });
  },

  // Change Password (while logged in)
  changePassword(oldPassword: string, newPassword: string) {
    return fetchAPI("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      requiresAuth: true,
    });
  },

  // Get current user profile
  getMe() {
    return fetchAPI("/auth/me", {
      method: "GET",
      requiresAuth: true,
    });
  },

  // Logout utility
  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  },

  // --- TRANSACTIONS API ---
  getTransactions() {
    return fetchAPI("/transactions/", {
      method: "GET",
      requiresAuth: true,
    });
  },

  createTransaction(txData: {
    amount: number;
    type: string;
    category: string;
    description: string;
    transaction_date: string;
    merchant_name?: string;
    ocr_log_id?: string;
  }) {
    return fetchAPI("/transactions/", {
      method: "POST",
      body: JSON.stringify(txData),
      requiresAuth: true,
    });
  },

  deleteTransaction(txId: string) {
    return fetchAPI(`/transactions/${txId}`, {
      method: "DELETE",
      requiresAuth: true,
    });
  },

  updateTransaction(txId: string, txData: {
    amount: number;
    type: string;
    category: string;
    description: string;
    transaction_date: string;
    merchant_name?: string;
  }) {
    return fetchAPI(`/transactions/${txId}`, {
      method: "PUT",
      body: JSON.stringify(txData),
      requiresAuth: true,
    });
  },

  // --- BUDGETS API ---
  getBudgets() {
    return fetchAPI("/budgets/", {
      method: "GET",
      requiresAuth: true,
    });
  },

  createOrUpdateBudget(budgetData: {
    category: string;
    limit_amount: number;
    period: string;
  }) {
    return fetchAPI("/budgets/", {
      method: "POST",
      body: JSON.stringify(budgetData),
      requiresAuth: true,
    });
  },

  deleteBudget(budgetId: string) {
    return fetchAPI(`/budgets/${budgetId}`, {
      method: "DELETE",
      requiresAuth: true,
    });
  },

  // --- EVENTS API ---
  getEvents() {
    return fetchAPI("/events/", {
      method: "GET",
      requiresAuth: true,
    });
  },

  getEventDetail(eventId: string) {
    return fetchAPI(`/events/${eventId}`, {
      method: "GET",
      requiresAuth: true,
    });
  },

  createEvent(eventData: {
    name: string;
    budget_limit: number;
    start_date?: string;
    end_date?: string;
    is_completed?: boolean;
  }) {
    return fetchAPI("/events/", {
      method: "POST",
      body: JSON.stringify(eventData),
      requiresAuth: true,
    });
  },

  updateEvent(eventId: string, eventData: {
    name?: string;
    budget_limit?: number;
    start_date?: string;
    end_date?: string;
    is_completed?: boolean;
  }) {
    return fetchAPI(`/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
      requiresAuth: true,
    });
  },

  deleteEvent(eventId: string) {
    return fetchAPI(`/events/${eventId}`, {
      method: "DELETE",
      requiresAuth: true,
    });
  },

  // --- AI CHAT API ---
  chatWithAI(message: string, history: { role: string; content: string }[]) {
    return fetchAPI("/chat/", {
      method: "POST",
      body: JSON.stringify({ message, history }),
      requiresAuth: true,
    });
  },

  // --- RECURRING TEMPLATES API ---
  getRecurringTemplates() {
    return fetchAPI("/recurring-templates/", { method: "GET", requiresAuth: true });
  },

  createRecurringTemplate(data: {
    amount: number;
    type: string;
    category: string;
    description?: string;
    frequency: string;
    day_of_week?: number | null;
    day_of_month?: number | null;
    start_date: string;
    end_date?: string | null;
    is_active?: boolean;
    is_auto_execute?: boolean;
  }) {
    return fetchAPI("/recurring-templates/", {
      method: "POST",
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  updateRecurringTemplate(id: string, data: {
    amount?: number;
    type?: string;
    category?: string;
    description?: string;
    frequency?: string;
    day_of_week?: number | null;
    day_of_month?: number | null;
    end_date?: string | null;
    is_active?: boolean;
    is_auto_execute?: boolean;
  }) {
    return fetchAPI(`/recurring-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      requiresAuth: true,
    });
  },

  deleteRecurringTemplate(id: string) {
    return fetchAPI(`/recurring-templates/${id}`, {
      method: "DELETE",
      requiresAuth: true,
    });
  },
};
