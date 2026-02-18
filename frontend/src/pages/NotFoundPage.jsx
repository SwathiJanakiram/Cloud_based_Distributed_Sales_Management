// src/pages/NotFoundPage.jsx
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div className="text-center">
        <div style={{ fontSize: 80, fontWeight: 900, color: "#e5e7eb", lineHeight: 1 }}>404</div>
        <h4 className="fw-bold mt-2 mb-1" style={{ color: "#0f172a" }}>Page not found</h4>
        <p className="text-muted mb-4">The page you're looking for doesn't exist or you don't have access.</p>
        <button className="btn btn-primary fw-semibold" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-2" />Go Back
        </button>
      </div>
    </div>
  );
}
