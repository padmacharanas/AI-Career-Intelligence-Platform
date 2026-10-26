import { Bell, Search } from "lucide-react";

function Topbar({ title, user }) {
  const displayName = user?.full_name || "Student";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="topbar">
      <h3>{title || "Dashboard"}</h3>

      <div className="topbar-right">
        <button
          className="icon-button"
          aria-label="Search"
          title="Search"
          onClick={() => alert("Search functionality will be added soon.")}
        >
          <Search size={19} />
        </button>

        <button
          className="icon-button"
          aria-label="Notifications"
          title="Notifications"
          onClick={() => alert("You have no new notifications.")}
        >
          <Bell size={19} />
        </button>

        <div className="profile">
          <div className="avatar">{initial}</div>

          <div className="profile-info">
            <strong>{displayName}</strong>
            <span>{user?.role === "admin" ? "Administrator" : "Student"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;