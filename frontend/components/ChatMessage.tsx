type Props = {
  user: string;
  text: string;
};

const ChatMessage = ({ user, text }: Props) => {
  return (
    <div
      style={{
        background: "#f3f8fc",
        padding: "14px",
        borderRadius: "14px",
        marginBottom: "14px",
        border: "1px solid #e5e7eb",
      }}
    >
      <strong
        style={{
          color: "#0284c7",
          fontSize: "15px",
        }}
      >
        {user}
      </strong>

      <p
        style={{
          marginTop: "6px",
          color: "#374151",
        }}
      >
        {text}
      </p>
    </div>
  );
};

export default ChatMessage;