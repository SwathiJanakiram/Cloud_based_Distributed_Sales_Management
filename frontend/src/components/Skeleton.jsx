const SkeletonBox = ({ height = 20 }) => (
  <div
    style={{
      height,
      background: "#e2e8f0",
      borderRadius: "6px",
      animation: "pulse 1.5s infinite",
    }}
  />
);
export default  SkeletonBox