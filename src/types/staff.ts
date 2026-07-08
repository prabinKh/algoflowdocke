export interface StaffRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}
