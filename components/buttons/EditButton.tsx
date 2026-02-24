type Props = {
  onClick: () => void;
  label?: string;
};

export default function EditButton({ onClick, label = "Засах" }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: "#2196F3",
        color: "white",
        padding: "8px 14px",
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
        marginRight: 8,
        fontSize: 13
      }}
    >
      {label}
    </button>
  );
}
