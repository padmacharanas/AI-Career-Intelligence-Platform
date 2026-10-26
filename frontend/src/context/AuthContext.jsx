
import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load logged-in user
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/users/me");

        setUser(response.data);
        localStorage.setItem(
          "user",
          JSON.stringify(response.data)
        );
      } catch (error) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login
  const login = async (email, password) => {
    const response = await api.post("/users/login", {
      email,
      password
    });

    localStorage.setItem(
      "access_token",
      response.data.access_token
    );

    const profileResponse = await api.get("/users/me");

    setUser(profileResponse.data);

    localStorage.setItem(
      "user",
      JSON.stringify(profileResponse.data)
    );

    return profileResponse.data;
  };

  // Update user information throughout the application
  const updateUser = (updatedUser) => {
    setUser(updatedUser);

    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
