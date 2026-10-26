
import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    title: "",
    description: "",
    category: "",
    url: "",
    skillsText: "",
    is_active: true,
  };

  const [form, setForm] = useState(emptyForm);

  // Fetch resources from backend
  const fetchResources = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/resources/");

      const data = response.data;
      setResources(
        Array.isArray(data)
          ? data
          : data.resources || data.items || []
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load learning resources."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Categories for filter
  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        resources.map((resource) => resource.category)
      ),
    ];
  }, [resources]);

  // Search and category filtering
  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        resource.title?.toLowerCase().includes(searchText) ||
        resource.description?.toLowerCase().includes(searchText) ||
        resource.category?.toLowerCase().includes(searchText) ||
        (resource.skills || []).some((skill) =>
          skill.toLowerCase().includes(searchText)
        );

      const matchesCategory =
        categoryFilter === "All" ||
        resource.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [resources, search, categoryFilter]);

  // Open Add form
  const handleAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  // Open Edit form
  const handleEdit = (resource) => {
    setEditingId(resource.id);

    setForm({
      title: resource.title || "",
      description: resource.description || "",
      category: resource.category || "",
      url: resource.url || "",
      skillsText: Array.isArray(resource.skills)
        ? resource.skills.join(", ")
        : "",
      is_active: resource.is_active !== false,
    });

    setShowModal(true);
  };

  // Form input changes
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Convert comma-separated skills into an array
  const getSkillArray = () => {
    const skills = form.skillsText
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    // Remove duplicate skills without considering case
    return [
      ...new Map(
        skills.map((skill) => [skill.toLowerCase(), skill])
      ).values(),
    ];
  };

  // Create or update resource
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const resourceData = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        url: form.url.trim(),
        skills: getSkillArray(),
        is_active: form.is_active,
      };

      if (editingId) {
        await api.put(
          `/resources/admin/${editingId}`,
          resourceData
        );
      } else {
        await api.post("/resources/admin/", resourceData);
      }

      setShowModal(false);
      setForm({ ...emptyForm });
      setEditingId(null);

      await fetchResources();
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        Array.isArray(detail)
          ? detail.map((item) => item.msg).join(", ")
          : detail || "Unable to save the learning resource."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete resource
  const handleDelete = async (resourceId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this learning resource?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/resources/admin/${resourceId}`);

      await fetchResources();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to delete the learning resource."
      );
    }
  };

  return (
    <div className="ar-page">
      <div className="ar-header">
        <div>
          <h1>Learning Resources</h1>
          <p>
            Manage learning materials and assign skills for students.
          </p>
        </div>

        <button className="ar-primary-btn" onClick={handleAdd}>
          + Add Resource
        </button>
      </div>

      {error && (
        <div className="ar-error">
          {typeof error === "string" ? error : "Something went wrong."}
        </div>
      )}

      <div className="ar-stats">
        <div className="ar-stat-card">
          <span>Total Resources</span>
          <h2>{resources.length}</h2>
        </div>

        <div className="ar-stat-card">
          <span>Categories</span>
          <h2>{categories.length - 1}</h2>
        </div>

        <div className="ar-stat-card">
          <span>Active Resources</span>
          <h2>
            {resources.filter((resource) => resource.is_active !== false).length}
          </h2>
        </div>

        <div className="ar-stat-card">
          <span>Filtered Results</span>
          <h2>{filteredResources.length}</h2>
        </div>
      </div>

      <div className="ar-toolbar">
        <input
          type="text"
          placeholder="Search title, description or skill..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="ar-table-card">
        <div className="ar-table-heading">
          <h2>Resource Library</h2>
          <span>{filteredResources.length} resources</span>
        </div>

        {loading ? (
          <p className="ar-message">Loading resources...</p>
        ) : filteredResources.length === 0 ? (
          <div className="ar-empty">
            <h3>No resources found</h3>
            <p>
              Add a learning resource or change your search.
            </p>
          </div>
        ) : (
          <div className="ar-table-wrapper">
            <table className="ar-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Category</th>
                  <th>Assigned Skills</th>
                  <th>Status</th>
                  <th>URL</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredResources.map((resource) => (
                  <tr key={resource.id}>
                    <td>
                      <strong>{resource.title}</strong>
                      <small>
                        {resource.description || "No description"}
                      </small>
                    </td>

                    <td>
                      <span className="ar-category">
                        {resource.category}
                      </span>
                    </td>

                    <td>
                      <div className="ar-skill-tags">
                        {Array.isArray(resource.skills) &&
                        resource.skills.length > 0 ? (
                          resource.skills.map((skill) => (
                            <span
                              className="ar-skill-tag"
                              key={skill}
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <small>No skills assigned</small>
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className={
                          resource.is_active === false
                            ? "ar-status-inactive"
                            : "ar-status-active"
                        }
                      >
                        {resource.is_active === false
                          ? "Inactive"
                          : "Active"}
                      </span>
                    </td>

                    <td>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open resource
                      </a>
                    </td>

                    <td>
                      {resource.created_at
                        ? new Date(
                            resource.created_at
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                    <td>
                      <div className="ar-actions">
                        <button
                          className="ar-edit-btn"
                          onClick={() => handleEdit(resource)}
                        >
                          Edit
                        </button>

                        <button
                          className="ar-delete-btn"
                          onClick={() => handleDelete(resource.id)}
                        >
                          Delete
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

      {showModal && (
        <div className="ar-modal-overlay">
          <div className="ar-modal">
            <div className="ar-modal-header">
              <div>
                <h2>
                  {editingId ? "Edit Resource" : "Add Resource"}
                </h2>
                <p>
                  Enter the resource details and assign related skills.
                </p>
              </div>

              <button
                className="ar-close-btn"
                onClick={() => setShowModal(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Resource Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Example: NumPy Beginner Tutorial"
                required
              />

              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe this learning resource"
                rows="3"
              />

              <label>Category</label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Example: Programming"
                required
              />

              <label>Resource URL</label>
              <input
                name="url"
                type="url"
                value={form.url}
                onChange={handleChange}
                placeholder="https://example.com"
                required
              />

              <label>Assign Skills</label>
              <input
                name="skillsText"
                value={form.skillsText}
                onChange={handleChange}
                placeholder="Example: NumPy, Python, Machine Learning"
              />

              <small className="ar-form-help">
                Enter multiple skills separated by commas. These tags
                determine which missing skills can display this resource
                in the student's Learning Path.
              </small>

              <div className="ar-active-option">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />
                  Make this resource visible to students
                </label>
              </div>

              <div className="ar-modal-actions">
                <button
                  type="button"
                  className="ar-cancel-btn"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ar-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Resource"
                    : "Add Resource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Resources;
