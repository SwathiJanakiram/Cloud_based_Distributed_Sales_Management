// src/components/Topbar.jsx
export default function Topbar({ title, children }) {
  return (
    <div className="topbar mb-4">
      <h1 className="page-title">{title}</h1>
      <div>{children}</div>
    </div>
  );
}
