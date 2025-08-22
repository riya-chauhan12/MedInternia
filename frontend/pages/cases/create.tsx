import { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  MenuItem,
  Card,
  CardContent,
  Stack,
  Grid,
  CardMedia,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import api from "../../utils/api";
import { useRouter } from "next/router";

export default function CreateCase() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: "beginner",
    specialization: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Convert images to Base64 and store in array
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const promises = files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      );
      Promise.all(promises).then((base64Files) => {
        setImages((prev) => [...prev, ...base64Files]); // append new images
      });
    }
  };

  // Remove an image by index
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");

      const payload = {
        ...form,
        images, // array of base64 images
      };

      await api.post("/cases", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setSuccess("Case created successfully!");
      setForm({
        title: "",
        description: "",
        difficulty: "beginner",
        specialization: "",
      });
      setImages([]);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create case.");
    }
  };

  // ✅ Return JSX here, not inside handleSubmit
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card
        elevation={8}
        sx={{
          p: 4,
          borderRadius: 4,
          minWidth: 350,
          maxWidth: 500,
          width: "100%",
          background: "rgba(255,255,255,0.98)",
          boxShadow: "0 8px 32px 0 rgba(33,147,176,0.10)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          align="center"
          sx={{
            fontWeight: 900,
            color: "#1565c0",
            letterSpacing: 1,
            zIndex: 1,
            position: "relative",
          }}
        >
          <span
            style={{
              color: "#2193b0",
              marginRight: 8,
              fontSize: 36,
              verticalAlign: "middle",
            }}
          >
            🩺
          </span>
          Create Medical Case
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <form onSubmit={handleSubmit} style={{ zIndex: 1, position: "relative" }}>
          <TextField
            label="Title *"
            name="title"
            value={form.title}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            sx={{ bgcolor: "#f8fafd", borderRadius: 2 }}
          />
          <TextField
            label="Description *"
            name="description"
            value={form.description}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            multiline
            minRows={4}
            sx={{ bgcolor: "#f8fafd", borderRadius: 2 }}
          />
          <TextField
            label="Specialization *"
            name="specialization"
            value={form.specialization}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            sx={{ bgcolor: "#f8fafd", borderRadius: 2 }}
          />
          <TextField
            label="Difficulty *"
            name="difficulty"
            value={form.difficulty}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            select
            sx={{ bgcolor: "#f8fafd", borderRadius: 2 }}
          >
            <MenuItem value="beginner">Beginner</MenuItem>
            <MenuItem value="intermediate">Intermediate</MenuItem>
            <MenuItem value="complex">Complex</MenuItem>
          </TextField>

          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{
              mt: 2,
              mb: 2,
              fontWeight: 700,
              color: "#2193b0",
              borderColor: "#2193b0",
              borderRadius: 2,
              background: "#f8fafd",
              "&:hover": { background: "#e3f2fd" },
            }}
          >
            UPLOAD CASE IMAGE(S)
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />
          </Button>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
            {images.map((img, idx) => (
              <Card
                key={idx}
                sx={{
                  width: 90,
                  height: 90,
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: 1,
                  position: "relative",
                }}
              >
                <CardMedia
                  component="img"
                  image={img}
                  alt={`Case image ${idx + 1}`}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <IconButton
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    bgcolor: "rgba(255,255,255,0.7)",
                  }}
                  onClick={() => handleRemoveImage(idx)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Card>
            ))}
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              py: 1.3,
              fontWeight: 700,
              fontSize: "1.1rem",
              borderRadius: 3,
              boxShadow: "0 4px 20px 0 rgba(31, 38, 135, 0.10)",
              background: "linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)",
              textTransform: "none",
              letterSpacing: 1,
              "&:hover": {
                background: "linear-gradient(90deg, #6dd5ed 0%, #2193b0 100%)",
              },
            }}
          >
            🚀 CREATE CASE
          </Button>
        </form>
      </Card>
    </Box>
  );
}

