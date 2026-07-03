import PropTypes from "prop-types";

export default function Modal({ title, onClose, children, onSubmit }) {
  return (
    <div className="modal">
      <form className="modal-panel" onSubmit={onSubmit}>
        <div className="page-title">
          <h1>{title}</h1>
          <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
        {children}
      </form>
    </div>
  );
}

Modal.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func,
};

Modal.defaultProps = {
  onSubmit: undefined,
};
