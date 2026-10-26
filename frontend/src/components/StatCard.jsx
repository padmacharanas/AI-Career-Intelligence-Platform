function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <div
          className="stat-icon"
          style={{
            backgroundColor: `${color}18`,
            color: color,
          }}
        >
          {Icon && <Icon size={21} />}
        </div>
      </div>

      <h2>{value ?? 0}</h2>
      <p>{title}</p>

      {subtitle && (
        <p style={{ marginTop: "10px", color: "#6558d5" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default StatCard;