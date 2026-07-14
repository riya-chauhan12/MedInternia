import React, { useState } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Stack,
  Divider,
  Avatar,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";

// Grouped dummy data: 3 doctors, each with 2-3 visits (cases)
const groupedCases: {
  doctor: string;
  doctorPhoto: string;
  doctorSpecialization: string;
  cases: CaseDataType[];
}[] = [
  {
    doctor: "Dr. Bhagya Vardhan",
    doctorPhoto: "/profile-icon.png",
    doctorSpecialization: "Cardiologist",
    cases: [
      {
        id: "1",
        title: "Visit on 1/15/2024",
        status: "approved",
        patient: "Dhiren Kumar",
        date: "1/15/2024",
        location: "AIIMS Delhi",
        doctor: "Dr. Bhagya Vardhan",
        ayushmanId: "AYU001234",
        files: [
          { name: "prescription_jan15.pdf", type: "pdf", size: "240 KB" },
          { name: "blood_test_report.pdf", type: "pdf", size: "500 KB" },
        ],
        bills: [
          { name: "hospital_bill_aiims.pdf", type: "pdf", size: "152.34 KB" },
        ],
        description:
          "Regular checkup and blood tests. Patient complained of mild chest pain. ECG normal, blood pressure 120/80.",
      },
      {
        id: "2",
        title: "Visit on 2/10/2024",
        status: "pending",
        patient: "Dhiren Kumar",
        date: "2/10/2024",
        location: "AIIMS Delhi",
        doctor: "Dr. Bhagya Vardhan",
        ayushmanId: "AYU001234",
        files: [{ name: "followup_ecg.pdf", type: "pdf", size: "300 KB" }],
        bills: [],
        description:
          "Follow-up for chest pain. ECG repeated, no new findings. Advised rest.",
      },
    ],
  },
  {
    doctor: "Dr. Ishwinder Kaur",
    doctorPhoto: "/profile-icon.png",
    doctorSpecialization: "Neurologist",
    cases: [
      {
        id: "3",
        title: "Visit on 1/20/2024",
        status: "pending",
        patient: "Priya Sharma",
        date: "1/20/2024",
        location: "Fortis Hospital",
        doctor: "Dr. Ishwinder Kaur",
        ayushmanId: "AYU001235",
        files: [{ name: "mri_report.pdf", type: "pdf", size: "1.2 MB" }],
        bills: [],
        description:
          "MRI scan for recurring headaches. No abnormalities detected. Recommended follow-up in 6 months.",
      },
      {
        id: "4",
        title: "Visit on 2/18/2024",
        status: "approved",
        patient: "Priya Sharma",
        date: "2/18/2024",
        location: "Fortis Hospital",
        doctor: "Dr. Ishwinder Kaur",
        ayushmanId: "AYU001235",
        files: [{ name: "headache_followup.pdf", type: "pdf", size: "400 KB" }],
        bills: [],
        description:
          "Follow-up for headaches. Symptoms improved. No new medication prescribed.",
      },
    ],
  },
  {
    doctor: "Dr. Anirudh Phophalia",
    doctorPhoto: "/profile-icon.png",
    doctorSpecialization: "Cardiologist",
    cases: [
      {
        id: "5",
        title: "Visit on 1/25/2024",
        status: "approved",
        patient: "Rajesh Gupta",
        date: "1/25/2024",
        location: "Max Healthcare",
        doctor: "Dr. Anirudh Phophalia",
        ayushmanId: "AYU001236",
        files: [
          { name: "ecg_report.pdf", type: "pdf", size: "300 KB" },
          { name: "echo_report.pdf", type: "pdf", size: "400 KB" },
        ],
        bills: [{ name: "hospital_bill_max.pdf", type: "pdf", size: "200 KB" }],
        description:
          "Cardiac evaluation and ECG. Mild arrhythmia detected. Prescribed beta-blockers.",
      },
      {
        id: "6",
        title: "Visit on 2/22/2024",
        status: "pending",
        patient: "Rajesh Gupta",
        date: "2/22/2024",
        location: "Max Healthcare",
        doctor: "Dr. Anirudh Phophalia",
        ayushmanId: "AYU001236",
        files: [
          { name: "arrhythmia_followup.pdf", type: "pdf", size: "350 KB" },
        ],
        bills: [],
        description:
          "Arrhythmia follow-up. Beta-blockers continued. Next review in 3 months.",
      },
    ],
  },
];
const statusColor = {
  approved: "#b9f6ca",
  pending: "#fff9c4",
};

function FileIcon({ type }: { type: string }) {
  if (type === "pdf") return <PictureAsPdfIcon color="error" sx={{ mr: 1 }} />;
  if (type === "image") return <ImageIcon color="primary" sx={{ mr: 1 }} />;
  return <InsertDriveFileIcon sx={{ mr: 1 }} />;
}

type StatusType = keyof typeof statusColor;

interface CaseDataType {
  id: string;
  title: string;
  status: StatusType;
  patient: string;
  date: string;
  location: string;
  doctor: string;
  ayushmanId: string;
  files: { name: string; type: string; size: string }[];
  bills: { name: string; type: string; size: string }[];
  description: string;
}

function CaseDetailsDialog({
  open,
  onClose,
  caseData,
}: {
  open: boolean;
  onClose: () => void;
  caseData: CaseDataType | null;
}) {
  if (!caseData) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: 22,
          background: "linear-gradient(90deg, #0072ff 0%, #6dd5ed 100%)",
          color: "#fff",
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          pr: 6,
        }}
      >
        {caseData.title} Details
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 16, top: 12, color: "#fff" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4, mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 180 }}>
            <Typography fontWeight={600} fontSize={16} mb={0.5}>
              Patient Name
            </Typography>
            <Typography mb={1}>{caseData.patient}</Typography>
            <Typography fontWeight={600} fontSize={16} mb={0.5}>
              Location
            </Typography>
            <Typography mb={1}>{caseData.location}</Typography>
            <Typography fontWeight={600} fontSize={16} mb={0.5}>
              Ayushman Reference ID
            </Typography>
            <Typography mb={1}>{caseData.ayushmanId}</Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 180 }}>
            <Typography fontWeight={600} fontSize={16} mb={0.5}>
              Date
            </Typography>
            <Typography mb={1}>{caseData.date}</Typography>
            <Typography fontWeight={600} fontSize={16} mb={0.5}>
              Doctor Name
            </Typography>
            <Typography mb={1}>{caseData.doctor}</Typography>
            <Typography fontWeight={600} fontSize={16} mb={0.5}>
              Status
            </Typography>
            <Chip
              label={caseData.status}
              sx={{
                background: statusColor[caseData.status],
                color: "#222",
                fontWeight: 600,
                textTransform: "capitalize",
                fontSize: 15,
                px: 2,
              }}
            />
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography fontWeight={700} fontSize={17} mb={1}>
          Medical Files ({caseData.files.length})
        </Typography>
        {caseData.files.map((file: any, idx: number) => (
          <Button
            key={idx}
            startIcon={<FileIcon type={file.type} />}
            sx={{
              justifyContent: "flex-start",
              width: "100%",
              mb: 1,
              color: "#222",
              background: "#f8fafc",
              border: "1px solid #e0e8f0",
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
              fontSize: 15,
            }}
            href="#"
            target="_blank"
          >
            {file.name}
            <Typography
              component="span"
              sx={{ ml: "auto", fontSize: 13, color: "#888" }}
            >
              {file.size}
            </Typography>
          </Button>
        ))}
        <Divider sx={{ my: 2 }} />
        <Typography fontWeight={700} fontSize={17} mb={1}>
          Bill Files ({caseData.bills.length})
        </Typography>
        {caseData.bills.map((file: any, idx: number) => (
          <Button
            key={idx}
            startIcon={<FileIcon type={file.type} />}
            sx={{
              justifyContent: "flex-start",
              width: "100%",
              mb: 1,
              color: "#222",
              background: "#f8fafc",
              border: "1px solid #e0e8f0",
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
              fontSize: 15,
            }}
            href="#"
            target="_blank"
          >
            {file.name}
            <Typography
              component="span"
              sx={{ ml: "auto", fontSize: 13, color: "#888" }}
            >
              {file.size}
            </Typography>
          </Button>
        ))}
        <Divider sx={{ my: 2 }} />
        <Typography fontWeight={700} fontSize={17} mb={1}>
          Medical Data
        </Typography>
        <Box
          sx={{
            background: "#f8fafc",
            borderRadius: 2,
            p: 2,
            fontSize: 15,
            color: "#222",
          }}
        >
          {caseData.description}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: "#0072ff",
            color: "#0072ff",
            fontWeight: 600,
            borderRadius: 2,
            "&:hover": {
              background: "#e0f7fa",
              borderColor: "#0056cc",
              color: "#0056cc",
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function UploadRawPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    personName: "",
    date: "",
    location: "",
    doctorName: "",
    ayushmanId: "",
    additionalMedicalData: "",
  });

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Success/Error snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // File state
  const [medicalFiles, setMedicalFiles] = useState<File[]>([]);
  const [bills, setBills] = useState<File[]>([]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle file input changes
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "medical" | "bills",
  ) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (type === "medical") {
        setMedicalFiles((prev) => [...prev, ...files]);
      } else {
        setBills((prev) => [...prev, ...files]);
      }
    }
  };

  // Remove a file
  const handleRemoveFile = (index: number, type: "medical" | "bills") => {
    if (type === "medical") {
      setMedicalFiles((prev) => prev.filter((_, i) => i !== index));
    } else {
      setBills((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.personName.trim()) {
      newErrors.personName = "Person Name is required";
    }
    if (!formData.date.trim()) {
      newErrors.date = "Date is required";
    }
    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }
    if (!formData.doctorName.trim()) {
      newErrors.doctorName = "Doctor Name is required";
    }
    if (!formData.ayushmanId.trim()) {
      newErrors.ayushmanId = "Ayushman Reference ID is required";
    }
    if (!formData.additionalMedicalData.trim()) {
      newErrors.additionalMedicalData =
        "Please enter all required patient information before proceeding";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: "Please fill in all required fields",
        severity: "error",
      });
      return;
    }

    // Simulate successful submission (replace with actual API call if needed)
    console.log("Form submitted:", { formData, medicalFiles, bills });

    setSnackbar({
      open: true,
      message: "Medical case submitted successfully!",
      severity: "success",
    });

    // Reset form
    setFormData({
      personName: "",
      date: "",
      location: "",
      doctorName: "",
      ayushmanId: "",
      additionalMedicalData: "",
    });
    setMedicalFiles([]);
    setBills([]);
    setErrors({});
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(120deg, #e0eafc 0%, #cfdef3 100%)",
        py: 6,
        px: { xs: 2, md: 4 },
      }}
    >
      {/* Page header */}
      <Box sx={{ maxWidth: 700, mx: "auto", mb: 4, textAlign: "center" }}>
        <Typography
          variant="h3"
          fontWeight={900}
          mb={1}
          sx={{
            background: "linear-gradient(90deg, #0056cc 0%, #0072ff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Upload RAW Medical Data
        </Typography>
        <Typography color="text.secondary" fontSize={16}>
          Securely upload your medical records, bills, and clinical data.
        </Typography>
      </Box>

      {/* Upload form card */}
      <Box sx={{ maxWidth: 700, mx: "auto", mb: 5 }}>
        <Card
          sx={{
            p: 4,
            borderRadius: 4,
            boxShadow: "0 4px 24px #0072ff33",
            border: "1px solid #e0eafc",
            background: "#fff",
            overflow: "hidden",
          }}
        >
          {/* Card accent bar */}
          <Box
            sx={{
              height: 6,
              borderRadius: 3,
              background: "linear-gradient(90deg, #0072ff 0%, #6dd5ed 100%)",
              mb: 3,
              mx: -4,
              mt: -4,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          />
          <Typography color="text.secondary" mb={1} fontSize={15}>
            Upload your raw medical files, bills, and additional data. Only you
            and authorized medical staff can view your uploads.
          </Typography>
          <Typography
            mb={3}
            fontSize={14}
            sx={{
              color: "#0072ff",
              fontWeight: 600,
              background: "#e0f7fa",
              borderRadius: 2,
              px: 2,
              py: 1,
              display: "inline-block",
            }}
          >
            Your data is hidden and secured. It will not be copied or shared
            with anyone else.
          </Typography>
          <form onSubmit={handleSubmit}>
            {/* Row 1: Person Name + Date */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Person Name"
                fullWidth
                variant="outlined"
                required
                value={formData.personName}
                onChange={(e) =>
                  handleInputChange("personName", e.target.value)
                }
                error={!!errors.personName}
                helperText={errors.personName}
                sx={{ mb: { xs: 2, sm: 0 } }}
              />
              <TextField
                label="Date"
                type="date"
                fullWidth
                variant="outlined"
                required
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    backgroundColor: "transparent",
                    px: 0.5,
                    "&.MuiInputLabel-shrink": {
                      backgroundColor: (theme) =>
                        theme.palette.background.paper || "#fff",
                    },
                  },
                }}
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                error={!!errors.date}
                helperText={errors.date}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "rgba(0,0,0,0.23)",
                    },
                  },
                  "& input[type='date']::-webkit-calendar-picker-indicator": {
                    filter: "invert(0.4)",
                    cursor: "pointer",
                  },
                }}
              />
            </Stack>

            {/* Row 2: Location + Doctor Name (newly added) */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={2}>
              <TextField
                label="Location"
                fullWidth
                variant="outlined"
                required
                value={formData.location}
                onChange={(e) =>
                  handleInputChange("location", e.target.value)
                }
                error={!!errors.location}
                helperText={errors.location}
                sx={{ mb: { xs: 2, sm: 0 } }}
              />
              <TextField
                label="Doctor Name"
                fullWidth
                variant="outlined"
                required
                value={formData.doctorName}
                onChange={(e) =>
                  handleInputChange("doctorName", e.target.value)
                }
                error={!!errors.doctorName}
                helperText={errors.doctorName}
              />
            </Stack>

            {/* Row 3: Ayushman Reference ID (newly added, full width) */}
            <TextField
              label="Ayushman Reference ID"
              fullWidth
              variant="outlined"
              required
              value={formData.ayushmanId}
              onChange={(e) =>
                handleInputChange("ayushmanId", e.target.value)
              }
              error={!!errors.ayushmanId}
              helperText={errors.ayushmanId}
              sx={{ mt: 2 }}
            />

            {/* Row 4: Upload buttons */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={3} mb={1}>
              <Button
                variant="contained"
                component="label"
                fullWidth
                sx={{
                  flex: 1,
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: "none",
                  background: "linear-gradient(90deg, #0072ff 0%, #6dd5ed 100%)",
                  color: "#fff",
                  boxShadow: "0 2px 8px #0072ff33",
                  "&:hover": {
                    background: "linear-gradient(90deg, #6dd5ed 0%, #0072ff 100%)",
                    boxShadow: "0 4px 16px #0072ff55",
                  },
                }}
              >
                Upload Medical Files
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={(e) => handleFileChange(e, "medical")}
                />
              </Button>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{
                  flex: 1,
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: "none",
                  borderColor: "#0072ff",
                  color: "#0072ff",
                  "&:hover": {
                    background: "#e0f7fa",
                    borderColor: "#0056cc",
                    color: "#0056cc",
                  },
                }}
              >
                Upload Bills (Optional)
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={(e) => handleFileChange(e, "bills")}
                />
              </Button>
            </Stack>

            {/* Display uploaded medical files */}
            {medicalFiles.length > 0 && (
              <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {medicalFiles.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    onDelete={() => handleRemoveFile(index, "medical")}
                    sx={{ bgcolor: "#e3f2fd", color: "#0056cc" }}
                  />
                ))}
              </Box>
            )}

            {/* Display uploaded bills */}
            {bills.length > 0 && (
              <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {bills.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    onDelete={() => handleRemoveFile(index, "bills")}
                    sx={{ bgcolor: "#fff3e0", color: "#e65100" }}
                  />
                ))}
              </Box>
            )}

            <TextField
              label="Additional Medical Data"
              multiline
              minRows={3}
              fullWidth
              variant="outlined"
              required
              value={formData.additionalMedicalData}
              onChange={(e) =>
                handleInputChange("additionalMedicalData", e.target.value)
              }
              error={!!errors.additionalMedicalData}
              helperText={
                errors.additionalMedicalData ||
                "Enter symptoms, diagnosis, treatment details, medications prescribed, or any other relevant medical information..."
              }
              sx={{ mb: 2, mt: 2 }}
              placeholder="Enter symptoms, diagnosis, treatment details, medications prescribed, or any other relevant medical information..."
            />
            <Button
              type="submit"
              variant="contained"
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                fontSize: 16,
                mt: 1,
                px: 4,
                background: "linear-gradient(90deg, #0072ff 0%, #6dd5ed 100%)",
                color: "#fff",
                boxShadow: "0 2px 12px #0072ff44",
                "&:hover": {
                  background:
                    "linear-gradient(90deg, #6dd5ed 0%, #0072ff 100%)",
                  boxShadow: "0 4px 20px #0072ff66",
                  transform: "scale(1.03)",
                },
                transition: "transform 0.2s",
              }}
            >
              Submit Case
            </Button>
          </form>
        </Card>
      </Box>

      {/* Grouped cases by doctor section */}
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <Typography variant="h5" fontWeight={800} mb={3} color="#0056cc">
          Your Medical Cases
        </Typography>
        <Stack spacing={4}>
          {groupedCases.map((group) => (
            <Box key={group.doctor}>
              <Box
                display="flex"
                alignItems="center"
                gap={2}
                mb={2}
                sx={{
                  background:
                    "linear-gradient(90deg, #e0f7fa 0%, #e0eafc 100%)",
                  borderRadius: 3,
                  px: 2,
                  py: 1.5,
                  boxShadow: "0 1px 6px #0072ff22",
                }}
              >
                <Avatar
                  src={group.doctorPhoto}
                  sx={{
                    width: 44,
                    height: 44,
                    border: "2px solid #0072ff",
                    boxShadow: "0 2px 8px #0072ff33",
                  }}
                />
                <Box>
                  <Typography fontWeight={700} fontSize={17} color="#0056cc">
                    {group.doctor}
                  </Typography>
                  <Typography fontSize={13} color="#0072ff">
                    {group.doctorSpecialization}
                  </Typography>
                </Box>
              </Box>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                {group.cases.map((c) => (
                  <Card
                    key={c.id}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      minWidth: 270,
                      flex: 1,
                      boxShadow: "0 2px 12px #0072ff22",
                      border: "1px solid #e0eafc",
                      cursor: "pointer",
                      overflow: "hidden",
                      transition: "box-shadow 0.2s, transform 0.2s",
                      "&:hover": {
                        boxShadow: "0 8px 32px #0072ff44",
                        transform: "translateY(-2px)",
                        borderColor: "#0072ff",
                      },
                    }}
                    onClick={() => {
                      setSelectedCase(c);
                      setOpenDialog(true);
                    }}
                  >
                    {/* Top accent bar on case card */}
                    <Box
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        background:
                          "linear-gradient(90deg, #0072ff 0%, #6dd5ed 100%)",
                        mb: 2,
                        mx: -3,
                        mt: -3,
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                      }}
                    />
                    <Typography
                      fontWeight={700}
                      fontSize={17}
                      mb={1}
                      color="#0056cc"
                    >
                      {c.title}
                    </Typography>
                    <Chip
                      label={c.status}
                      sx={{
                        background: statusColor[c.status],
                        color: "#222",
                        fontWeight: 600,
                        textTransform: "capitalize",
                        fontSize: 14,
                        px: 1,
                        mb: 1.5,
                      }}
                    />
                    <Typography
                      fontSize={15}
                      mb={0.5}
                      fontWeight={600}
                      color="#222"
                    >
                      {c.patient}
                    </Typography>
                    <Typography fontSize={13} color="#888" mb={0.5}>
                      {c.date}
                    </Typography>
                    <Typography fontSize={13} color="#888" mb={0.5}>
                      {c.location}
                    </Typography>
                    <Typography
                      fontSize={13}
                      color="#0072ff"
                      mb={0.5}
                      fontWeight={500}
                    >
                      {c.doctor}
                    </Typography>
                    <Typography fontSize={13} color="#888" mb={1.5}>
                      {c.description.slice(0, 60)}
                      {c.description.length > 60 ? "..." : ""}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography
                        fontSize={12}
                        color="#0072ff"
                        fontWeight={600}
                      >
                        {c.files.length} files
                      </Typography>
                      <Typography
                        fontSize={12}
                        color="#0072ff"
                        fontWeight={600}
                      >
                        {c.bills.length} bills
                      </Typography>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
      <CaseDetailsDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        caseData={selectedCase}
      />

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%", fontWeight: 600 }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}