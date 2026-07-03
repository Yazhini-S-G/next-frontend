import PropTypes from "prop-types";

export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderTop: "1px solid #f1f5f9" }}>
      <button className="btn outline" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>← Previous</button>
      <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Page {page} of {pages}</span>
      <button className="btn outline" onClick={() => onPageChange(page + 1)} disabled={page >= pages}>Next →</button>
    </div>
  );
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  pages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};
