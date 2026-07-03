import PropTypes from "prop-types";

export default function PageHeader({ title, description, children }) {
  return (
    <div className="page-title" style={children ? undefined : { marginBottom: "2rem" }}>
      <div>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.node.isRequired,
  description: PropTypes.string,
  children: PropTypes.node,
};

PageHeader.defaultProps = {
  description: undefined,
  children: undefined,
};
