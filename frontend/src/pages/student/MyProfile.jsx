
import { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function MyProfile() {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    full_name: "",
    college: "",
    degree: "",
    branch: "",
    graduation_year: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load profile from backend
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users/me");
      const profile = response.data;

      setFormData({
        full_name: profile.full_name || "",
        college: profile.college || "",
        degree: profile.degree || "",
        branch: profile.branch || "",
        graduation_year: profile.graduation_year || ""
      });

      updateUser(profile);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle form input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Start editing
  const handleEdit = () => {
    setMessage("");
    setError("");
    setEditing(true);
  };

  // Cancel editing and restore saved information
  const handleCancel = () => {
    setEditing(false);
    setMessage("");
    setError("");
    fetchProfile();
  };

  // Save updated profile
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const payload = {
        full_name: formData.full_name.trim(),
        college: formData.college.trim() || null,
        degree: formData.degree.trim() || null,
        branch: formData.branch.trim() || null,
        graduation_year: formData.graduation_year
          ? Number(formData.graduation_year)
          : null
      };

      const response = await api.put("/users/me", payload);
      const updatedProfile = response.data.user;

      setFormData({
        full_name: updatedProfile.full_name || "",
        college: updatedProfile.college || "",
        degree: updatedProfile.degree || "",
        branch: updatedProfile.branch || "",
        graduation_year: updatedProfile.graduation_year || ""
      });

      updateUser(updatedProfile);

      setEditing(false);
      setMessage("Your profile has been updated successfully.");
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to update your profile. Please check your details."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        Loading your profile...
      </div>
    );
  }

  return (
    <div className="my-profile-page">

      <div className="profile-page-header">
        <div>
          <h1>My Profile</h1>
          <p>View and manage your personal and academic information.</p>
        </div>

        {!editing && (
          <button
            type="button"
            className="profile-edit-btn"
            onClick={handleEdit}
          >
            Edit Profile
          </button>
        )}
      </div>

      {message && (
        <div className="profile-success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="profile-error-message">
          {error}
        </div>
      )}

      <div className="profile-overview-card">
        <div className="profile-avatar">
          {(formData.full_name || "U").charAt(0).toUpperCase()}
        </div>

        <div className="profile-overview-details">
          <h2>{formData.full_name || "Your Name"}</h2>
          <p>{user?.email}</p>
          <span className="profile-role">
            {user?.role || "student"}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        <section className="profile-section">
          <div className="profile-section-heading">
            <div>
              <h2>Personal Information</h2>
              <p>Your basic account information.</p>
            </div>
          </div>

          <div className="profile-form-grid">

            <div className="profile-field">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                disabled={!editing}
                minLength={2}
                maxLength={100}
                required
              />
            </div>

            <div className="profile-field">
              <label>Email Address</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
              />
              <small>Email address cannot be changed here.</small>
            </div>

          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-heading">
            <div>
              <h2>Academic Information</h2>
              <p>Manage your education details.</p>
            </div>
          </div>

          <div className="profile-form-grid">

            <div className="profile-field profile-field-full">
              <label>College / University</label>
              <input
                type="text"
                name="college"
                placeholder="Enter your college name"
                value={formData.college}
                onChange={handleChange}
                disabled={!editing}
                maxLength={200}
              />
            </div>

            <div className="profile-field">
              <label>Degree</label>
              <input
                type="text"
                name="degree"
                placeholder="Example: BTech"
                value={formData.degree}
                onChange={handleChange}
                disabled={!editing}
                maxLength={100}
              />
            </div>

            <div className="profile-field">
              <label>Branch / Specialization</label>
              <input
                type="text"
                name="branch"
                placeholder="Enter your branch"
                value={formData.branch}
                onChange={handleChange}
                disabled={!editing}
                maxLength={150}
              />
            </div>

            <div className="profile-field">
              <label>Graduation Year</label>
              <input
                type="number"
                name="graduation_year"
                placeholder="Example: 2028"
                value={formData.graduation_year}
                onChange={handleChange}
                disabled={!editing}
                min="2000"
                max="2100"
              />
            </div>

          </div>
        </section>

        {editing && (
          <div className="profile-form-actions">
            <button
              type="button"
              className="profile-cancel-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="profile-save-btn"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

      </form>
    </div>
  );
}

export default MyProfile;
