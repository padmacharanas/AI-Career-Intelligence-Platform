import { useState } from "react";
import {
  Bell,
  Search,
  X,
  Sparkles,
  UserRound,
} from "lucide-react";

function Topbar({ user }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const displayName =
    user?.full_name ||
    user?.name ||
    user?.username ||
    "Student";

  const initial = displayName.trim().charAt(0).toUpperCase();

  const role =
    user?.role === "admin" ? "Administrator" : "Student";

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query) return;

    const elements = [
      ...document.querySelectorAll(
        "h1, h2, h3, h4, p, span, a, button, td, li"
      ),
    ];

    const match = elements.find((element) =>
      element.innerText?.toLowerCase().includes(query.toLowerCase())
    );

    if (match) {
      match.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      match.classList.add("topbar-search-highlight");

      setTimeout(() => {
        match.classList.remove("topbar-search-highlight");
      }, 1800);
    } else {
      alert(`No matching content found for "${query}" on this page.`);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-heading">
        <div className="topbar-brand-line">
          <Sparkles size={15} />
          <span>AI CAREER INTELLIGENCE PLATFORM</span>
        </div>

        <h2>Your Career Workspace</h2>

        <p>
          Track your skills, discover opportunities, and grow your career.
        </p>
      </div>

      <div className="topbar-right">
        {searchOpen && (
          <form
            className="topbar-search-form"
            onSubmit={handleSearch}
          >
            <Search size={17} />

            <input
              type="search"
              placeholder="Search this page..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              autoFocus
            />

            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              aria-label="Close search"
            >
              <X size={17} />
            </button>
          </form>
        )}

        <button
          className="icon-button"
          aria-label="Search"
          title="Search this page"
          onClick={() => setSearchOpen((open) => !open)}
        >
          <Search size={19} />
        </button>

        <div className="topbar-notification-wrapper">
          <button
            className="icon-button"
            aria-label="Notifications"
            title="Notifications"
            onClick={() =>
              setNotificationsOpen((open) => !open)
            }
          >
            <Bell size={19} />
          </button>

          {notificationsOpen && (
            <div className="topbar-notification-panel">
              <div className="topbar-notification-heading">
                <strong>Notifications</strong>

                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  aria-label="Close notifications"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="topbar-empty-notifications">
                <Bell size={25} />

                <strong>You're all caught up!</strong>

                <p>
                  Updates about your resumes, career matches, and
                  learning progress will appear here when notifications
                  are connected.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="profile">
          <div className="avatar">
            {initial || "S"}
          </div>

          <div className="profile-info">
            <strong>{displayName}</strong>

            <span>
              <UserRound size={12} />
              {role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;