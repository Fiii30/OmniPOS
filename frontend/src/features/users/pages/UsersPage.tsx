import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Pencil, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router";

import { createUser, getUsers, updateUser } from "@/api/userApi";
import { clearSession, getStoredUser } from "@/utils/auth";
import type {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserRole,
} from "@/types/user";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UsersPage() {
  const navigate = useNavigate();

  const currentUser = getStoredUser();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("STAFF");
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getUsers();

        if (active) setUsers(data);
      } catch (error: unknown) {
        if (!active) return;

        if (isAxiosError<{ message?: string }>(error)) {
          if (error.response?.status === 401) {
            clearSession();
            navigate("/login", { replace: true });
            return;
          }

          setError(
            error.response?.data?.message ??
              "Tidak dapat mengambil daftar user.",
          );
        } else {
          setError("Terjadi kesalahan saat memuat user.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadUsers();

    return () => {
      active = false;
    };
  }, [navigate, reloadKey]);

  function openCreateForm() {
    setSelectedUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("STAFF");
    setIsActive(true);
    setFormError("");
    setIsFormOpen(true);
  }

  function openEditForm(user: User) {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    setIsActive(user.isActive);
    setFormError("");
    setIsFormOpen(true);
  }

  async function handleSubmit() {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormError("");

    try {
      if (selectedUser) {
        const data: UpdateUserInput = {
          name,
          email,
          role,
          isActive,
        };

        if (password) {
          data.password = password;
        }

        await updateUser(selectedUser.id, data);

        setSuccess("User berhasil diperbarui.");
      } else {
        const data: CreateUserInput = {
          name,
          email,
          password,
          role,
        };

        await createUser(data);

        setSuccess("User berhasil ditambahkan.");
      }

      setIsFormOpen(false);
      setSelectedUser(null);
      setReloadKey((value) => value + 1);
    } catch (error: unknown) {
      if (isAxiosError<{ message?: string }>(error)) {
        if (error.response?.status === 401) {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }

        setFormError(error.response?.data?.message ?? "Gagal menyimpan user.");
      } else {
        setFormError("Terjadi kesalahan saat menyimpan user.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSelf = selectedUser?.id === currentUser?.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">
            Manajemen
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Manajemen User
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Kelola akun ADMIN dan STAFF toko.
          </p>
        </div>

        <Button
          type="button"
          className="omni-primary-button gap-2"
          onClick={openCreateForm}
        >
          <Plus className="size-4" />
          Tambah User
        </Button>
      </div>

      {success && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {success}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <section className="omni-surface overflow-hidden">
        <div className="flex items-center gap-3 border-b p-5">
          <div className="rounded-xl bg-blue-50 p-3 text-primary">
            <Users className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold">Daftar User</h2>

            <p className="text-xs text-muted-foreground">
              {isLoading ? "Memuat data..." : `${users.length} user terdaftar`}
            </p>
          </div>
        </div>

        <div className="divide-y">
          {isLoading ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Memuat user...
            </p>
          ) : users.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Belum ada user terdaftar.
            </p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {user.name}
                    {user.id === currentUser?.id && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Anda)
                      </span>
                    )}
                  </p>

                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      user.role === "ADMIN"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }
                  >
                    {user.role}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={
                      user.isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }
                  >
                    {user.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-lg"
                    onClick={() => openEditForm(user)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {isFormOpen && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setIsFormOpen(false);
          }}
        >
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedUser ? "Edit User" : "Tambah User"}
              </DialogTitle>

              <DialogDescription>
                {selectedUser
                  ? "Perbarui data user yang dipilih."
                  : "Tambahkan akun ADMIN atau STAFF baru."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="user-name" className="text-sm font-medium">
                  Nama
                </label>

                <Input
                  id="user-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-xl bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="user-email" className="text-sm font-medium">
                  Email
                </label>

                <Input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-xl bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="user-password" className="text-sm font-medium">
                  Password
                </label>

                <Input
                  id="user-password"
                  type="password"
                  placeholder={
                    selectedUser
                      ? "Kosongkan jika tidak ingin mengubah"
                      : "Minimal 6 karakter"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-xl bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="user-role" className="text-sm font-medium">
                  Role
                </label>

                <select
                  id="user-role"
                  value={role}
                  disabled={isSelf}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="user-status" className="text-sm font-medium">
                  Status
                </label>

                <select
                  id="user-status"
                  value={isActive ? "active" : "inactive"}
                  disabled={isSelf}
                  onChange={(event) =>
                    setIsActive(event.target.value === "active")
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                >
                  {formError}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={isSubmitting}
                  onClick={() => setIsFormOpen(false)}
                >
                  Batal
                </Button>

                <Button
                  type="button"
                  className="omni-primary-button flex-1 rounded-xl"
                  disabled={
                    isSubmitting ||
                    name.trim().length < 2 ||
                    email.trim().length === 0 ||
                    (!selectedUser && password.length < 6)
                  }
                  onClick={() => void handleSubmit()}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
