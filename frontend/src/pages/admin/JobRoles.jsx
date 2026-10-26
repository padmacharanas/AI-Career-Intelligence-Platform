import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  LoaderCircle,
  Code,
  Layers,
  RefreshCw,
} from "lucide-react";

import api from "../../services/api";

function JobRoles() {
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [formData, setFormData] = useState({
    role_name: "",
    category: "",
    description: "",
    skills: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ----------------------------------
  // FETCH JOB ROLES
  // ----------------------------------

  const fetchJobRoles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/job-roles/");

      setJobRoles(response.data.job_roles || []);
    } catch (err) {
      console.error("Error fetching job roles:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load job roles."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobRoles();
  }, []);

  // ----------------------------------
  // FORM HANDLING
  // ----------------------------------

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      role_name: "",
      category: "",
      description: "",
      skills: "",
    });

    setEditingRole(null);
    setError("");
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);

    setFormData({
      role_name: role.role_name || "",
      category: role.category || "",
      description: role.description || "",
      skills: (role.required_skills || []).join(", "),
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    resetForm();
  };

  // ----------------------------------
  // CREATE / UPDATE JOB ROLE
  // ----------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.role_name.trim()) {
      setError("Please enter a job role name.");
      return;
    }

    if (!formData.category.trim()) {
      setError("Please enter a category.");
      return;
    }

    const requiredSkills = [
      ...new Set(
        formData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      ),
    ];

    const params = {
      role_name: formData.role_name.trim(),
      category: formData.category.trim(),
      description: formData.description.trim(),
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingRole) {
        await api.put(
          `/job-roles/admin/${editingRole.id}`,
          requiredSkills,
          { params }
        );

        setSuccess("Job role updated successfully.");
      } else {
        await api.post(
          "/job-roles/admin/",
          requiredSkills,
          { params }
        );

        setSuccess("Job role created successfully.");
      }

      setShowModal(false);
      resetForm();

      await fetchJobRoles();
    } catch (err) {
      console.error("Error saving job role:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to save job role."
      );
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------
  // DELETE JOB ROLE
  // ----------------------------------

  const handleDelete = async (role) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${role.role_name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(role.id);
      setError("");
      setSuccess("");

      await api.delete(`/job-roles/admin/${role.id}`);

      setJobRoles((previous) =>
        previous.filter((item) => item.id !== role.id)
      );

      setSuccess(
        `"${role.role_name}" deleted successfully.`
      );
    } catch (err) {
      console.error("Error deleting job role:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to delete job role."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ----------------------------------
  // SEARCH
  // ----------------------------------

  const filteredRoles = jobRoles.filter((role) => {
    const searchText = search.toLowerCase();

    return (
      role.role_name?.toLowerCase().includes(searchText) ||
      role.category?.toLowerCase().includes(searchText) ||
      role.required_skills?.some((skill) =>
        skill.toLowerCase().includes(searchText)
      )
    );
  });

  // ----------------------------------
  // PAGE UI
  // ----------------------------------

  return (
    <div className="jr-page">

      <div className="jr-header">
        <div>
          <h1>Job Role Management</h1>
          <p>
            Create, update and manage job roles and their required skills.
          </p>
        </div>

        <button
          className="jr-primary-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Job Role
        </button>
      </div>

      {/* STATISTICS */}

      <div className="jr-stats">

        <div className="jr-stat-card">
          <div className="jr-stat-icon">
            <BriefcaseBusiness size={22} />
          </div>

          <div>
            <h2>{jobRoles.length}</h2>
            <p>Total Job Roles</p>
          </div>
        </div>

        <div className="jr-stat-card">
          <div className="jr-stat-icon">
            <Layers size={22} />
          </div>

          <div>
            <h2>
              {
                new Set(
                  jobRoles.map((role) => role.category)
                ).size
              }
            </h2>
            <p>Categories</p>
          </div>
        </div>

        <div className="jr-stat-card">
          <div className="jr-stat-icon">
            <Code size={22} />
          </div>

          <div>
            <h2>
              {
                new Set(
                  jobRoles.flatMap(
                    (role) => role.required_skills || []
                  ).map((skill) => skill.toLowerCase())
                ).size
              }
            </h2>
            <p>Unique Required Skills</p>
          </div>
        </div>

      </div>

      {/* SEARCH AND REFRESH */}

      <div className="jr-toolbar">

        <div className="jr-search">
          <Search size={19} />

          <input
            type="text"
            placeholder="Search job roles, categories or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          className="jr-refresh-button"
          onClick={fetchJobRoles}
          disabled={loading}
          title="Refresh job roles"
        >
          <RefreshCw size={17} />
          Refresh
        </button>

      </div>

      {/* ALERTS */}

      {error && !showModal && (
        <div className="jr-alert jr-error">
          {error}
        </div>
      )}

      {success && (
        <div className="jr-alert jr-success">
          {success}
        </div>
      )}

      {/* JOB ROLE LIST */}

      <div className="jr-content">

        <div className="jr-section-header">
          <h2>Available Job Roles</h2>

          <span>
            {filteredRoles.length} roles found
          </span>
        </div>

        {loading ? (
          <div className="jr-loading">
            <LoaderCircle className="jr-spin" size={28} />
            <p>Loading job roles...</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="jr-empty">
            <BriefcaseBusiness size={40} />

            <h3>No job roles found</h3>

            <p>
              Try another search or create a new job role.
            </p>
          </div>
        ) : (
          <div className="jr-table-wrapper">

            <table className="jr-table">

              <thead>
                <tr>
                  <th>Job Role</th>
                  <th>Category</th>
                  <th>Required Skills</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role.id}>

                    <td>
                      <div className="jr-role-name">
                        <div className="jr-role-icon">
                          <BriefcaseBusiness size={18} />
                        </div>

                        <div>
                          <strong>{role.role_name}</strong>
                          <small>Role ID: {role.id}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="jr-category">
                        {role.category}
                      </span>
                    </td>

                    <td>
                      <div className="jr-skills">
                        {(role.required_skills || []).map(
                          (skill, index) => (
                            <span
                              className="jr-skill-tag"
                              key={`${role.id}-${skill}-${index}`}
                            >
                              {skill}
                            </span>
                          )
                        )}

                        {(!role.required_skills ||
                          role.required_skills.length === 0) && (
                          <span className="jr-no-skills">
                            No skills added
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="jr-actions">

                        <button
                          className="jr-edit-button"
                          onClick={() => openEditModal(role)}
                          title="Edit job role"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="jr-delete-button"
                          onClick={() => handleDelete(role)}
                          disabled={deletingId === role.id}
                          title="Delete job role"
                        >
                          {deletingId === role.id ? (
                            <LoaderCircle
                              className="jr-spin"
                              size={16}
                            />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <div
          className="jr-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >

          <div className="jr-modal">

            <div className="jr-modal-header">
              <div>
                <h2>
                  {editingRole
                    ? "Edit Job Role"
                    : "Add New Job Role"}
                </h2>

                <p>
                  Enter the role information and required skills.
                </p>
              </div>

              <button
                className="jr-close-button"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="jr-form-group">
                <label>Job Role Name *</label>

                <input
                  type="text"
                  name="role_name"
                  placeholder="Example: Data Engineer"
                  value={formData.role_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="jr-form-group">
                <label>Category *</label>

                <input
                  type="text"
                  name="category"
                  placeholder="Example: Data Engineering"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="jr-form-group">
                <label>Description</label>

                <textarea
                  name="description"
                  placeholder="Describe the responsibilities of this role..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div className="jr-form-group">
                <label>Required Skills</label>

                <textarea
                  name="skills"
                  placeholder="Python, SQL, MySQL, Git, Machine Learning"
                  value={formData.skills}
                  onChange={handleInputChange}
                  rows={3}
                />

                <small>
                  Enter skills separated by commas.
                </small>
              </div>

              {error && (
                <div className="jr-alert jr-error">
                  {error}
                </div>
              )}

              <div className="jr-modal-actions">

                <button
                  type="button"
                  className="jr-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="jr-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <LoaderCircle
                      className="jr-spin"
                      size={17}
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving
                    ? "Saving..."
                    : editingRole
                    ? "Update Job Role"
                    : "Create Job Role"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default JobRoles;