import React, { useState, useEffect } from "react";
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
  CircularProgress
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
        files: [
          { name: "followup_ecg.pdf", type: "pdf", size: "300 KB" },
        ],
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
        files: [
          { name: "mri_report.pdf", type: "pdf", size: "1.2 MB" },
        ],
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
        files: [
          { name: "headache_followup.pdf", type: "pdf", size: "400 KB" },
        ],
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
        bills: [
          { name: "hospital_bill_max.pdf", type: "pdf", size: "200 KB" },
        ],
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
import { fetchCurrentUserProfile } from "../utils/fetchCurrentUserProfile";

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

function CaseDetailsDialog({ open, onClose, caseData }: { open: boolean; onClose: () => void; caseData: CaseDataType | null }) {
  if (!caseData) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 24 }}>
        {caseData.title} Details
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 16, top: 16 }}
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
            <Typography component="span" sx={{ ml: "auto", fontSize: 13, color: "#888" }}>
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
            <Typography component="span" sx={{ ml: "auto", fontSize: 13, color: "#888" }}>
              {file.size}
            </Typography>
          </Button>
        ))}
        <Divider sx={{ my: 2 }} />
        <Typography fontWeight={700} fontSize={17} mb={1}>
          Medical Data
        </Typography>
    <Box sx={{ background: "#f8fafc", borderRadius: 2, p: 2, fontSize: 15, color: "#222" }}>
      {caseData.description}
    </Box>
  </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function UploadRawPage() {
  // Page is now open to all users (patients, doctors, interns)
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    fetchCurrentUserProfile().then((data) => {
      setProfile(data);
      setLoadingProfile(false);
    });
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", background: "#f5f8fa", py: 6 }}>
  {/* Profile section at top removed as requested */}
      {/* Upload section */}
      <Box sx={{ maxWidth: 700, mx: "auto", mb: 4 }}>
        <Card sx={{ p: 4, borderRadius: 4, boxShadow: "0 2px 12px #2193b022" }}>
          <Typography variant="h4" fontWeight={900} mb={2} color="#1565c0">
            Upload RAW Medical Data
          </Typography>
          <Typography color="text.secondary" mb={1}>
            Upload your raw medical files, bills, and additional data. Only you and authorized medical staff can view your uploads.
          </Typography>
          <Typography color="success.main" fontWeight={600} mb={2}>
            Your data is hidden and secured. It will not be copied or shared with anyone else.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Person Name" fullWidth variant="outlined" sx={{ mb: { xs: 2, sm: 0 } }} />
            <TextField label="Date" type="date" fullWidth variant="outlined" InputLabelProps={{ shrink: true }} />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={2}>
            <TextField label="Location" fullWidth variant="outlined" />
            <TextField label="Doctor Name" fullWidth variant="outlined" />
          </Stack>
          <TextField label="Ayushman Reference ID" fullWidth variant="outlined" sx={{ mt: 2 }} />
          <Button variant="contained" component="label" sx={{ mt: 3, mb: 1, borderRadius: 2, background: "#2193b0" }}>
            Upload Medical Files
            <input type="file" hidden multiple />
          </Button>
          <Button variant="outlined" component="label" sx={{ mb: 2, borderRadius: 2 }}>
            Upload Bills (Optional)
            <input type="file" hidden multiple />
          </Button>
          <TextField
            label="Additional Medical Data"
            multiline
            minRows={3}
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
            placeholder="Enter symptoms, diagnosis, treatment details, medications prescribed, or any other relevant medical information..."
          />
          <Button variant="contained" color="success" sx={{ borderRadius: 2, fontWeight: 700, fontSize: 17, mt: 1 }}>
            Submit Case
          </Button>
        </Card>
      </Box>
      {/* Grouped cases by doctor section */}
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <Typography variant="h5" fontWeight={800} mb={2} color="#222">
          Your Medical Cases (Grouped by Doctor)
        </Typography>
        <Stack spacing={4}>
          {groupedCases.map((group, idx) => (
            <Box key={group.doctor}>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Avatar src={group.doctorPhoto} sx={{ width: 40, height: 40 }} />
                <Box>
                  <Typography fontWeight={700} fontSize={18}>{group.doctor}</Typography>
                  <Typography fontSize={14} color="#888">{group.doctorSpecialization}</Typography>
                </Box>
              </Box>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                {group.cases.map((c) => (
                  <Card
                    key={c.id}
                    sx={{ p: 3, borderRadius: 3, minWidth: 270, boxShadow: "0 2px 8px #2193b022", cursor: "pointer", transition: "box-shadow 0.2s", '&:hover': { boxShadow: "0 6px 24px #2193b044" } }}
                    onClick={() => { setSelectedCase(c); setOpenDialog(true); }}
                  >
                    <Typography fontWeight={700} fontSize={19} mb={1}>
                      {c.title}
                    </Typography>
                    <Chip
                      label={c.status}
                      sx={{
                        background: statusColor[c.status],
                        color: "#222",
                        fontWeight: 600,
                        textTransform: "capitalize",
                        fontSize: 15,
                        px: 2,
                        mb: 1,
                      }}
                    />
                    <Typography fontSize={15} mb={0.5}>
                      <b>{c.patient}</b>
                    </Typography>
                    <Typography fontSize={14} color="#888" mb={0.5}>
                      {c.date}
                    </Typography>
                    <Typography fontSize={14} color="#888" mb={0.5}>
                      {c.location}
                    </Typography>
                    <Typography fontSize={14} color="#888" mb={0.5}>
                      {c.doctor}
                    </Typography>
                    <Typography fontSize={14} color="#888" mb={1}>
                      {c.description.slice(0, 60)}{c.description.length > 60 ? "..." : ""}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center" mt={1}>
                      <Typography fontSize={13} color="#888">
                        {c.files.length} files
                      </Typography>
                      <Typography fontSize={13} color="#888">
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
      <CaseDetailsDialog open={openDialog} onClose={() => setOpenDialog(false)} caseData={selectedCase} />
    </Box>
  );
}
