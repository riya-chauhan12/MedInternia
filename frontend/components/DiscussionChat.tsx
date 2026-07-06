import { useState } from "react";
import { MessageCircle } from "lucide-react";
import ChatMessage from "./ChatMessage";
import api from "../utils/api";
const DiscussionChat = () => {
  const [messages, setMessages] = useState<{ user: string; text: string }[]>([
    {
      user: "Contributor",
      text: "Possible bacterial pneumonia based on symptoms.",
    },
    {
      user: "Clinical Reviewer",
      text: "Recommend immediate chest X-ray and CBC test.",
    },
  ]);


  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();

    setMessages((prev) => [
      ...prev,
      { user: "You", text: userMessage },
    ]);

    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot', { message: userMessage });

      setMessages((prev) => [
        ...prev,
        {
          user: "AI Assistant",
          text: data.reply || "No response received.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          user: "AI Assistant",
          text: "Sorry, I am unable to respond right now. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
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
      <h2
        style={{
          marginBottom: "14px",
          fontSize: "20px",
          fontWeight: 700,
          color: "#111827",
        }}
      >
        <MessageCircle size={20} aria-hidden style={{ verticalAlign: "middle", marginRight: 8 }} />
        Discussion Chat
      </h2>

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
        {loading && (
          <div style={{ color: "#6b7280", fontSize: "13px", padding: "8px 0" }}>
            AI Assistant is typing...
          </div>
        )}
      </div>

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
          onKeyDown={handleKeyDown}
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            fontSize: "13px",
            outline: "none",
            background: loading ? "#f3f4f6" : "#f9fafb",
          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: "10px",
            background: loading ? "#93c5fd" : "#0ea5e9",
            color: "white",
            fontWeight: 600,
            fontSize: "13px",
            cursor: loading ? "not-allowed" : "pointer",
            minWidth: "70px",
          }}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default DiscussionChat;
