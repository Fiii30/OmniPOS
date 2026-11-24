export type UserRole = "ADMIN" | "STAFF";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
};

export type UsersResponse = {
  message: string;
  users: User[];
};

export type UserResponse = {
  message: string;
  user: User;
};
