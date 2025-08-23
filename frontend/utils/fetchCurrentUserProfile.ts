// Utility to fetch current user profile from backend
import api from "../utils/api";

export async function fetchCurrentUserProfile() {
  try {
    // Assume userId is stored in localStorage after login
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!userId) return null;
    const res = await api.get(`/users/${userId}/profile`);
    return res.data.user;
  } catch (err) {
    return null;
  }
}
