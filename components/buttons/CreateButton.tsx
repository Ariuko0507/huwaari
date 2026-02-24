type Props = {
  onClick: () => void;
  label?: string;
};

export default function CreateButton({ onClick, label = "Нэмэх" }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: "#4CAF50",
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
