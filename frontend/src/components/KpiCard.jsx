// src/components/KpiCard.jsx
export default function KpiCard({ title, value, icon, color = "primary", sub }) {
  const colorMap = {
    primary: { bg: "#eff6ff", color: "#1d4ed8" },
    success: { bg: "#f0fdf4", color: "#15803d" },
    warning: { bg: "#fffbeb", color: "#b45309" },
    danger:  { bg: "#fef2f2", color: "#b91c1c" },
  };
  const { bg, color: iconColor } = colorMap[color] ?? colorMap.primary;

  return (
    <div className="card kpi-card h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <div className="kpi-icon" style={{ background: bg, color: iconColor }}>
          <i className={`bi ${icon}`} />
        </div>
        <div>
          <div className="text-muted" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {title}
          </div>
          <div className="fw-bold" style={{ fontSize: 22, lineHeight: 1.2, color: "#0f172a" }}>
            {value}
          </div>
          {sub && <div className="text-muted" style={{ fontSize: 12 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}
