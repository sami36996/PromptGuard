"use client";

import { useState } from "react";
import { authApi } from "@/lib/api/auth";
import { getAdminStats } from "@/lib/api/admin";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, password: string) {
    try {
      setLoading(true);
      setError(null);

      await authApi.login({
        email,
        password,
      });

      return true;
    } catch (err) {
      console.error("Login failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Invalid email or password"
      );

      return false;
    } finally {
      setLoading(false);
    }
  }

  async function register(
    email: string,
    password: string,
    full_name: string,
    company_name: string
  ) {
    try {
      setLoading(true);
      setError(null);

      await authApi.register({
        email,
        password,
        full_name,
        company_name,
      });

      return true;
    } catch (err) {
      console.error("Registration failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Registration failed"
      );

      return false;
    } finally {
      setLoading(false);
    }
  }

  async function loginAdmin(email: string, password: string) {
    try {
      setLoading(true);
      setError(null);
      await authApi.login({ email, password });
      await getAdminStats();
      return true;
    } catch (err) {
      authApi.logout();
      setError(
        err instanceof Error
          ? err.message
          : "Super admin access required",
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    authApi.logout();
  }

  return {
    loading,
    error,
    login,
    loginAdmin,
    register,
    logout,
    isAuthenticated: authApi.isAuthenticated,
  };
}