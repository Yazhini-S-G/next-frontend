import PropTypes from "prop-types";

export default function EmptyState({ icon, title, description }) {
  return (
    <div className="card" style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{icon}</div>
      {title && <div style={{ fontWeight: 600, marginBottom: "0.25rem", color: "#0f172a" }}>{title}</div>}
      <div style={{ fontSize: "0.85rem" }}>{description}</div>
    </div>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string,
  description: PropTypes.string.isRequired,
};

EmptyState.defaultProps = {
  title: undefined,
};
