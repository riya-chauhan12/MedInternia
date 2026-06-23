import React, { useState } from "react";
import { useRouter } from "next/router";
import {
  Fab,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";

import { responses, quickActions } from "./chatbotData";

const Chatbot = () => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<
  { sender: string; text: string }[]
>([
    {
      sender: "bot",
      text: "👋 Welcome to MedInternia! How can I help you today?",
    },
  ]);

  const sendMessage = () => {
  if (!input.trim()) return;

  const userMessage = input.toLowerCase().trim();

  const reply =
    responses[userMessage] ||
    "Sorry, I don't understand that. Try Jobs, Webinars, FAQ, Contact or Leaderboard.";

  setMessages((prev) => [
    ...prev,
    { sender: "user", text: input },
    { sender: "bot", text: reply },
  ]);

  setInput("");
};

  return (
    <>
      {/* Floating Button */}
      <Fab
        color="primary"
        onClick={() => setOpen(!open)}
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
        }}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {/* Chat Window */}
      {open && (
        <Paper
          elevation={5}
          sx={{
            position: "fixed",
            bottom: 90,
            right: 20,
            width: 350,
            height: 500,
            p: 2,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            MedInternia Assistant
          </Typography>

          <Box sx={{ flex: 1, overflowY: "auto", mt: 2 }}>
            {messages.map((msg, index) => (
              <Typography key={index} sx={{ mb: 1 }}>
                <strong>{msg.sender}:</strong> {msg.text}
              </Typography>
            ))}
          </Box>

          <Box sx={{ mt: 2 }}>
            {quickActions.map((item) => (
              <Button
                key={item.label}
                size="small"
                sx={{ mr: 1, mb: 1 }}
                onClick={() => router.push(item.route)}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <TextField
              fullWidth
              size="small"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
            />
            <Button variant="contained" onClick={sendMessage}>
              Send
            </Button>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default Chatbot;