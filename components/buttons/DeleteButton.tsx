type Props = {
  onClick: () => void;
  label?: string;
};

export default function DeleteButton({ onClick, label = "Устгах" }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: "#f44336",
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
