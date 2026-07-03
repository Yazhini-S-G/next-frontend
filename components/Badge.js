import PropTypes from "prop-types";

export default function Badge({ children, variant }) {
  const getVariantClass = () => {
    switch (variant) {
      case "success": return "success";
      case "danger": return "danger";
      case "warning": return "warning";
      default: return "";
    }
  };

  const variantClass = getVariantClass();
  const className = `badge ${variantClass}`.trim();

  return (
    <span className={className}>
      {children}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["success", "danger", "warning", "default"]),
};

Badge.defaultProps = {
  variant: "default",
};
