type Props = {
  onClick: () => void;
  label?: string;
};

export default function UpdateButton({ onClick, label = "Шинэчлэх" }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: "#FF9800",
        color: "white",
        padding: "10px 16px",
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
        marginRight: 8,
        fontSize: 14,
        fontWeight: 500
      }}
    >
      {label}
    </button>
  );
}
