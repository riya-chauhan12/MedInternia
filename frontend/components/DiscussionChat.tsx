import { useState } from "react";
import ChatMessage from "./ChatMessage";

const DiscussionChat = () => {
  const [messages, setMessages] = useState([
    {
      user: "Dr. Sharma",
      text: "Possible bacterial pneumonia based on symptoms.",
    },
    {
      user: "Dr. Lee",
      text: "Recommend immediate chest X-ray and CBC test.",
    },
  ]);

  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages([
      ...messages,
      {
        user: "You",
        text: input,
      },
    ]);

    setInput("");
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "16px",
        background: "white",
      }}
    >
      {/* HEADER */}
      <h2
        style={{
          marginBottom: "14px",
          fontSize: "20px",
          fontWeight: 700,
          color: "#111827",
        }}
      >
        💬 Discussion Chat
      </h2>

      {/* CHAT AREA */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: "4px",
        }}
      >
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            user={msg.user}
            text={msg.text}
          />
        ))}
      </div>

      {/* INPUT SECTION */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "14px",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Type your diagnosis opinion..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            fontSize: "13px",
            outline: "none",
            background: "#f9fafb",
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: "10px",
            background: "#0ea5e9",
            color: "white",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            minWidth: "70px",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default DiscussionChat;