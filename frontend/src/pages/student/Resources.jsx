
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";

function StudentResources() {
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/resources/");

      const data = response.data;

      const resourceList = Array.isArray(data)
        ? data
        : data.resources || data.items || [];

      // Display only active resources as an additional safeguard
      const activeResources = resourceList.filter(
        (resource) => resource.is_active !== false
      );

      setResources(activeResources);
    } catch (err) {
      console.error("Failed to load resources:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load learning resources. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Get categories dynamically from backend resources
  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(
        resources
          .map((resource) => resource.category)
          .filter(Boolean)
      ),
    ];
  }, [resources]);

  // Search by title, description, category and assigned skills
  const filteredResources = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return resources.filter((resource) => {
      const matchesSearch =
        resource.title?.toLowerCase().includes(searchText) ||
        resource.description?.toLowerCase().includes(searchText) ||
        resource.category?.toLowerCase().includes(searchText) ||
        (Array.isArray(resource.skills) &&
          resource.skills.some((skill) =>
            skill.toLowerCase().includes(searchText)
          ));

      const matchesCategory =
        selectedCategory === "All" ||
        resource.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [resources, search, selectedCategory]);

  return (
    <div className="student-resources-page">
      <div className="page-header">
        <div>
          <h1>Learning Resources</h1>
          <p>
            Explore tutorials, courses and documentation to improve your skills.
          </p>
        </div>

        <button
          type="button"
          className="student-resource-refresh"
          onClick={fetchResources}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="resources-toolbar">
        <div className="resources-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search by title, category or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {!loading && !error && (
        <div className="student-resource-count">
          Showing {filteredResources.length} of {resources.length} resources
        </div>
      )}

      {loading ? (
        <p>Loading learning resources...</p>
      ) : error ? (
        <div className="empty-resources">
          <p>{error}</p>
          <button onClick={fetchResources} type="button">
            Try Again
          </button>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="empty-resources">
          <BookOpen size={40} />
          <h3>No resources found</h3>
          <p>Try another search or category.</p>
        </div>
      ) : (
        <div className="student-resources-grid">
          {filteredResources.map((resource) => (
            <div
              className="student-resource-card"
              key={resource.id}
            >
              <div className="resource-card-icon">
                <BookOpen size={24} />
              </div>

              <span className="resource-category">
                {resource.category || "General"}
              </span>

              <h3>{resource.title}</h3>

              <p>
                {resource.description ||
                  "Explore this learning resource."}
              </p>

              {Array.isArray(resource.skills) &&
                resource.skills.length > 0 && (
                  <div className="student-resource-skills">
                    <span className="student-resource-skills-title">
                      Skills covered
                    </span>

                    <div className="student-resource-skill-list">
                      {resource.skills.map((skill) => (
                        <span
                          className="student-resource-skill-tag"
                          key={skill}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-open-link"
                >
                  Open Resource
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentResources;
