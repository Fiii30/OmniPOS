import api from "./axios";

import type {
  CreateUserInput,
  UpdateUserInput,
  UserResponse,
  UsersResponse,
} from "@/types/user";

export async function getUsers() {
  const response = await api.get<UsersResponse>("/users");

  return response.data.users;
}

export async function createUser(data: CreateUserInput) {
  const response = await api.post<UserResponse>("/users", data);

  return response.data.user;
}

export async function updateUser(id: string, data: UpdateUserInput) {
  const response = await api.put<UserResponse>(
    `/users/${encodeURIComponent(id)}`,
    data,
  );

  return response.data.user;
}
