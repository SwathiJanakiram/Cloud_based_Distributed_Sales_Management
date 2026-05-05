import { useEffect, useState } from "react";
import { getAuditLogs, getUserName } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";

export default function AuditLogs() {
  const { user, loading } = useAuth();

  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [fetching, setFetching] = useState(false);

  const [filters, setFilters] = useState({
    action: "",
    user_id: "",
    start_date: "",
    end_date: "",
  });

  const today = new Date().toISOString().split("T")[0];

  const fetchLogs = async () => {
    try {
      setFetching(true);

      const res = await getAuditLogs(filters);

      setLogs(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      toast.error("Failed to Load Data.")
      setLogs([]);
    } finally {
      setFetching(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await getUserName();
      setUsers(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      toast.error("Failed to Load Data.")
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchLogs();
      fetchUsers();
    }
  }, [loading, user]);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  if (!loading && !user) return <p>Please login</p>;

  return (
    <>
      <Topbar title="Audit Logs" />

      {/* Filters */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{ borderRadius: "0.75rem" }}
      >
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            {/* Action */}
            <div className="col-md-3">
              <label
                className="form-label fw-semibold"
                style={{ fontSize: 12 }}
              >
                Action
              </label>
              <select
                name="action"
                className="form-select form-select-sm"
                value={filters.action}
                onChange={handleChange}
              >
                <option value="">All</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            {/* User */}
            <div className="col-md-3">
              <label
                className="form-label fw-semibold"
                style={{ fontSize: 12 }}
              >
                User
              </label>
              <select
                name="user_id"
                className="form-select form-select-sm"
                value={filters.user_id}
                onChange={handleChange}
              >
                <option value="">All Users</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="col-md-2">
              <label
                className="form-label fw-semibold"
                style={{ fontSize: 12 }}
              >
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                className="form-control form-control-sm"
                value={filters.start_date}
                onChange={handleChange}
                max={today}
              />
            </div>

            {/* End Date */}
            <div className="col-md-2">
              <label
                className="form-label fw-semibold"
                style={{ fontSize: 12 }}
              >
                End Date
              </label>
              <input
                type="date"
                name="end_date"
                className="form-control form-control-sm"
                value={filters.end_date}
                onChange={handleChange}
                max={today}
              />
            </div>

            {/* Reset */}
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary btn-sm w-100"
                onClick={() =>
                  setFilters({
                    action: "",
                    user_id: "",
                    start_date: "",
                    end_date: "",
                  })
                }
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="card border-0 shadow-sm"
        style={{ borderRadius: "0.75rem" }}
      >
        <div className="card-body">
          {!fetching && logs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No audit logs found
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Time</th>
                    <th>Details</th>
                  </tr>
                </thead>
                  <tbody>
                    {fetching ? Array(10).fill().map((_,r)=> (<tr key ={r}>{
                      Array(5).fill().map((_,i)=>(<td key={i}><Skeleton/></td>))}
                    </tr>)): 
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontSize: 13 }}>{log.user_name}</td>

                        <td>
                          <span className="badge bg-primary-subtle text-primary">
                            {log.action}
                          </span>
                        </td>

                        <td style={{ fontSize: 13 }}>{log.entity}</td>

                        <td style={{ fontSize: 12, color: "#64748b" }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>

                        <td>
                          <details>
                            <summary style={{ cursor: "pointer" }}>
                              View
                            </summary>
                            <pre style={{ fontSize: 11 }}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
