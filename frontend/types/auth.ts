export interface User {
  id: string;
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'supervisor' | 'super_admin';
  phone?: string;
  client: {
    id: string;
    name: string;
  };
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  employee_id: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
  expires_in: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSupervisor: boolean;
  isSuperAdmin: boolean;
  login: (userData: User, authToken: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}
