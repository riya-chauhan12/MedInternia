import { useState, useEffect } from "react";
import { Stethoscope, Rocket, Sparkles, Image as ImageIcon, Loader2 } from "lucide-react";
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
  IconButton,
  CardMedia,
  Backdrop,
  CircularProgress,
  Stack,
  Grid,
  Chip,
  Switch,
  FormControlLabel
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import api from "../../utils/api";
import { useRouter } from "next/router";
import PageHeader from "../../components/layout/PageHeader";

const SPECIALTIES = [
  "General Medicine",
  "Cardiology",
  "Neurology",
  "Pulmonology",
  "Gastroenterology",
  "Urology",
  "Endocrinology",
  "Infectious Disease",
  "Pediatrics",
  "Dermatology",
  "Oncology"
];

const LOADING_STEPS = [
  "Analysing case text...",
  "Extracting clinical symptoms...",
  "Detecting medical entities (NER)...",
  "Classifying diagnostic complexity...",
  "Generating treatment insights...",
  "Applying AI tags and saving..."
];

export default function CreateCase() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    specialization: "",
    tags: [] as string[],
    symptoms: [] as string[],
    isRareDisease: false,
  });

  const [images, setImages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<{ url: string, type: 'image' | 'video' | 'audio', publicId?: string }[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const router = useRouter();

  // Cycle through loading steps to show the AI tagger progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 1800);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleChange = (e: any) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const token = localStorage.getItem("token");
      
      setLoading(true);
      setError("");

      try {
        const uploadedAttachments = await Promise.all(
          files.map(async (file) => {
            const formData = new FormData();
            formData.append("attachment", file);
            
            const res = await api.post("/cases/attachments", formData, {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            });
            return res.data.data;
          })
        );
        
        setAttachments((prev) => [...prev, ...uploadedAttachments]);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to upload attachment. Note: Files must be under 50MB and be valid image, video, or audio files.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSuggestTags = async () => {
    if (!form.description) {
      setError("Please write a description first to generate tags.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/symptoms/extract", { text: form.description });
      if (res.data.success && res.data.data.symptoms) {
        // Use the extracted symptoms as both symptoms and tags in the frontend UI
        const extracted = res.data.data.symptoms;
        setForm(prev => ({ ...prev, symptoms: extracted, tags: extracted }));
        setSuccess("AI successfully extracted tags and symptoms!");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to extract tags.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const payload = {
        ...form,
        images,
        attachments,
      };

      const res = await api.post("/cases", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setSuccess("Case analyzed and created successfully!");
      
      // Delay slightly for visual transition
      setTimeout(() => {
        setLoading(false);
        const newCaseId = res.data.data.case._id;
        router.push(`/cases/${newCaseId}`);
      }, 1000);

    } catch (err: any) {
      setLoading(false);
      setError(err?.response?.data?.message || "Failed to create case.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        background: "linear-gradient(135deg, #f8fbff 0%, #e8f4ff 100%)",
        py: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Container maxWidth="md">
        <PageHeader
          title="Submit Medical Case"
          subtitle="Contribute clinical scenarios to the platform. Our Clinical AI will automatically extract symptoms, difficulty levels, and key topics from your text."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Cases", href: "/cases" }, { label: "Create" }]}
        />

        <Card
          elevation={4}
          sx={{
            mt: 3,
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: "text.primary" }}>
                  Case Title
                </Typography>
                <TextField
                  placeholder="e.g., 45-year-old male with sudden onset chest pain and sweating"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputProps={{ sx: { borderRadius: '10px', bgcolor: '#fdfdff' } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: "text.primary" }}>
                  Specialty area
                </Typography>
                <TextField
                  select
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  fullWidth
                  required
                  label="Select specialization"
                  InputProps={{ sx: { borderRadius: '10px', bgcolor: '#fdfdff' } }}
                >
                  {SPECIALTIES.map((spec) => (
                    <MenuItem key={spec} value={spec}>
                      {spec}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.isRareDisease}
                      onChange={handleChange}
                      name="isRareDisease"
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body1" fontWeight={600} color="text.primary">
                      Mark as Rare/Orphan Disease (helps specialists discover unique cases)
                    </Typography>
                  }
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: "text.primary" }}>
                  Clinical Case Description
                </Typography>
                <TextField
                  placeholder="Write a detailed description of the case. Include presentation, clinical observations, lab reports, diagnostics, or questions for peer review. Do not include identifiable patient details."
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  fullWidth
                  required
                  multiline
                  minRows={8}
                  maxRows={20}
                  InputProps={{ sx: { borderRadius: '10px', bgcolor: '#fdfdff' } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: "text.primary" }}>
                    AI Generated Tags & Symptoms
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<Sparkles size={16} />}
                    onClick={handleSuggestTags}
                    disabled={loading || !form.description}
                  >
                    Auto-Suggest Tags
                  </Button>
                </Box>
                {form.tags.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', p: 2, bgcolor: '#fdfdff', borderRadius: '10px', border: '1px solid', borderColor: 'divider' }}>
                    {form.tags.map(tag => (
                      <Chip key={tag} label={tag} color="primary" variant="outlined" onDelete={() => {
                        const newTags = form.tags.filter(t => t !== tag);
                        setForm(prev => ({ ...prev, tags: newTags, symptoms: newTags }));
                      }} />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Click "Auto-Suggest Tags" to extract keywords from your description before submitting.
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: "text.primary" }}>
                  Supporting Materials (Images, Video, Audio)
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<ImageIcon size={20} />}
                  sx={{
                    py: 2,
                    borderStyle: "dashed",
                    borderWidth: "2px",
                    borderColor: "primary.main",
                    bgcolor: "primary.light",
                    color: "primary.dark",
                    borderRadius: 3,
                    "&:hover": {
                      bgcolor: "#e0f2fe",
                      borderColor: "primary.dark",
                    },
                    transition: "all 0.2s",
                  }}
                >
                  Upload clinical images, ECGs, video, or audio (Max 50MB)
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*,video/mp4,audio/mpeg,audio/wav"
                    onChange={handleAttachmentUpload}
                  />
                </Button>
              </Grid>

              {(images.length > 0 || attachments.length > 0) && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    {images.map((img, idx) => (
                      <Card
                        key={`img-${idx}`}
                        sx={{
                          width: 100,
                          height: 100,
                          borderRadius: 2,
                          overflow: "hidden",
                          position: "relative",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={img}
                          alt={`Uploaded thumbnail ${idx + 1}`}
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </Card>
                    ))}
                    {attachments.map((att, idx) => (
                      <Card
                        key={`att-${idx}`}
                        sx={{
                          width: 100,
                          height: 100,
                          borderRadius: 2,
                          overflow: "hidden",
                          position: "relative",
                          border: "1px solid",
                          borderColor: "divider",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "#fdfdff"
                        }}
                      >
                        {att.type === 'image' ? (
                          <CardMedia
                            component="img"
                            image={att.url}
                            alt={`Attachment ${idx + 1}`}
                            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <Typography variant="caption" align="center" sx={{ wordBreak: 'break-all', px: 1 }}>
                            {att.type === 'video' ? 'Video File' : 'Audio File'}
                          </Typography>
                        )}
                        <IconButton
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            bgcolor: "rgba(0,0,0,0.5)",
                            color: "white",
                            "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                          }}
                          onClick={() => handleRemoveAttachment(idx)}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Card>
                    ))}
                  </Box>
                </Grid>
              )}

              <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  startIcon={<Rocket size={20} />}
                  sx={{
                    py: 1.8,
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    borderRadius: 3,
                    background: "linear-gradient(90deg, #0072ff 0%, #00c6ff 100%)",
                    boxShadow: "0 4px 18px rgba(0, 114, 255, 0.35)",
                    "&:hover": {
                      background: "linear-gradient(90deg, #0056cc 0%, #0072ff 100%)",
                      boxShadow: "0 6px 24px rgba(0, 114, 255, 0.5)",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s",
                  }}
                >
                  Submit & Analyze Case
                </Button>
              </Grid>
            </Grid>
          </form>
        </Card>
      </Container>

      {/* AI Tagger loading state overlay */}
      <Backdrop
        open={loading}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 999,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          background: "rgba(15, 23, 42, 0.95)",
        }}
      >
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          <CircularProgress
            size={100}
            thickness={2.5}
            sx={{
              color: "#00c6ff",
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0072ff",
              animation: "pulse 2s infinite",
            }}
          >
            <Sparkles size={40} />
          </Box>
        </Box>

        <Stack alignItems="center" spacing={1}>
          <Typography variant="h5" fontWeight={800} letterSpacing={0.5} sx={{ color: "white" }}>
            Analysing Case...
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#94a3b8",
              fontStyle: "italic",
              animation: "fadeInOut 1.8s infinite",
              minHeight: "24px"
            }}
          >
            {LOADING_STEPS[loadingStepIndex]}
          </Typography>
        </Stack>

        <style jsx global>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.15); opacity: 1; }
          }
          @keyframes fadeInOut {
            0%, 100% { opacity: 0.3; transform: scale(0.98); }
            50% { opacity: 1; transform: scale(1.02); }
          }
        `}</style>
      </Backdrop>
    </Box>
  );
}
