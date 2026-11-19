// Tipe data user yang dikirim dari backend.

export type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
};

// Tipe data response login.
export type LoginResponse = {
  message: string;
  token: string;
  user: User;
};
