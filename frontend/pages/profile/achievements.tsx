import community_contributor from "../../assets/p5.png";
import first_case_analysed from "../../assets/p4.png";
import doctor_approved_insight from "../../assets/p3.png";
import top_rated_intern from "../../assets/p2.png";
import verified_diagnosis from "../../assets/p1.png";
import novice_analyst from "../../assets/p8.png";
import proficient_diagnostician from "../../assets/p9.png";
import expert_solver from "../../assets/p10.png";
import cardiology_explorer from "../../assets/p13.png";
import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  Modal,
  Button,
  Chip,
} from "@mui/material";
import CelebrationIcon from "@mui/icons-material/Celebration";
import GroupIcon from "@mui/icons-material/Group";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import StarIcon from "@mui/icons-material/Star";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import LockIcon from "@mui/icons-material/Lock";
import { StaticImageData } from "next/image";

// Define the Achievement type and data
type Achievement = {
  id: number;
  name: string;
  icon: React.ReactNode;
  progress: number;
  unlocked: boolean;
  date: string | null;
  description: string;
  nextTier: string;
  isNew?: boolean;
};

const achievements: Achievement[] = [
  {
    id: 1,
    name: "Champion",
    icon: <EmojiEventsIcon sx={{ color: "gold" }} />,
    progress: 80,
    unlocked: true,
    date: "2025-07-10",
    description: "Awarded for top leaderboard position.",
    nextTier: "Win 5 more cases to reach Grand Champion.",
  },
  {
    id: 2,
    name: "Expert Reviewer",
    icon: <StarIcon sx={{ color: "#2193b0" }} />,
    progress: 60,
    unlocked: true,
    date: "2025-06-20",
    description: "Reviewed 50+ cases.",
    nextTier: "Review 50 more cases for Master Reviewer.",
  },
  {
    id: 3,
    name: "Growth Master",
    icon: <TrendingUpIcon sx={{ color: "#6dd5ed" }} />,
    progress: 30,
    unlocked: false,
    date: null,
    description: "Reach 1000 points.",
    nextTier: "Earn 700 more points.",
  },
  {
    id: 4,
    name: "Quiz Pro",
    icon: <CelebrationIcon sx={{ color: "#ff9800" }} />,
    progress: 100,
    unlocked: true,
    date: "2025-08-01",
    description: "Completed 100 quizzes.",
    nextTier: "Complete 200 quizzes for Quiz Legend.",
    isNew: true,
  },
  {
    id: 5,
    name: "Community Helper",
    icon: <GroupIcon sx={{ color: "#43a047" }} />,
    progress: 50,
    unlocked: false,
    date: null,
    description: "Help 50 peers in discussions.",
    nextTier: "Help 50 more peers for Community Star.",
  },
];

type Badge = {
  id: number;
  name: string;
  image: StaticImageData;
  unlocked: boolean;
  tooltip: string;
  isNew?: boolean;
};

const badges: Badge[] = [
  {
    id: 1,
    name: "Novice Analyst",
    image: novice_analyst,
    unlocked: true,
    tooltip: "Unlocked: Completed your first case analysis.",
  },
  {
    id: 2,
    name: "First Case Analysed",
    image: first_case_analysed,
    unlocked: true,
    tooltip: "Unlocked: Successfully analyzed your first medical case.",
  },
  {
    id: 3,
    name: "Doctor Approved Insight",
    image: doctor_approved_insight,
    unlocked: true,
    tooltip: "Unlocked: Received a 'Doctor Approved' rating on an insight.",
  },
  {
    id: 4,
    name: "Community Contributor",
    image: community_contributor,
    unlocked: true,
    tooltip: "Unlocked: Provided valuable help in community discussions.",
    isNew: true,
  },
  {
    id: 5,
    name: "Proficient Diagnostician",
    image: proficient_diagnostician,
    unlocked: false,
    tooltip: "Locked: Correctly diagnose 10 complex cases.",
  },
  {
    id: 6,
    name: "Expert Solver",
    image: expert_solver,
    unlocked: false,
    tooltip: "Locked: Solve 25 cases with a 90% accuracy rate.",
  },
  {
    id: 7,
    name: "Cardiology Explorer",
    image: cardiology_explorer,
    unlocked: false,
    tooltip: "Locked: Successfully analyze 5 cardiology-related cases.",
  },
  {
    id: 8,
    name: "Top Rated Intern",
    image: top_rated_intern,
    unlocked: false,
    tooltip: "Locked: Reach the top 10% of interns on the leaderboard.",
  },
  {
    id: 9,
    name: "Verified Diagnosis",
    image: verified_diagnosis,
    unlocked: false,
    tooltip: "Locked: Have 3 of your diagnoses verified by senior doctors.",
  },
];

export default function AchievementsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Achievement | null>(null);

  const handleOpen = (ach: Achievement) => {
    setSelected(ach);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelected(null);
  };
  // Share achievement (dummy)
  const handleShare = () => {
    alert("Achievement shared!");
  };

  const unlocked = achievements.filter((ach) => ach.unlocked);
  const locked = achievements.filter((ach) => !ach.unlocked);

  const unlockedBadges = badges.filter((badge) => badge.unlocked);
  const lockedBadges = badges.filter((badge) => !badge.unlocked);

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "#2ecc71";
    if (progress > 75) return "#3498db";
    if (progress > 50) return "#f1c40f";
    return "#e74c3c";
  };

  return (
    <Box px={2} py={6} sx={{ fontFamily: 'Poppins, sans-serif', background: '#ecf0f3', minHeight: '100vh' }}>
      <Typography variant="h4" fontWeight={700} mb={6} textAlign="center" color="#333" sx={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
        Achievements
      </Typography>

      {/* Unlocked Achievements Section */}
      <Typography variant="h5" fontWeight={600} mb={3} color="#555" sx={{ textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.1)' }}>
        Unlocked Triumphs
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
          gap: 4,
          mb: 8,
        }}
      >
        {unlocked.map((ach, index) => (
          <Card
            key={ach.id}
            onClick={() => handleOpen(ach)}
            className="achievement-card unlocked"
            sx={{
              cursor: "pointer",
              borderRadius: 4,
              boxShadow: "10px 10px 20px #caced1, -10px -10px 20px #ffffff",
              background: "#ecf0f3",
              position: "relative",
              minHeight: 180,
              transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              animation: `card-fade-in 0.5s ease-out forwards ${index * 0.1}s`,
              "&:hover": {
                transform: "translateY(-8px) scale(1.03)",
                boxShadow: "6px 6px 12px #caced1, -6px -6px 12px #ffffff",
              },
            }}
          >
            {ach.isNew && (
              <Chip
                label="NEW!"
                color="warning"
                size="small"
                sx={{
                  position: "absolute",
                  top: 15,
                  right: 15,
                  fontWeight: 700,
                  fontSize: 12,
                  animation: "pulse 1.5s infinite",
                  background: 'linear-gradient(45deg, #ffc107, #ff9800)',
                  color: '#fff',
                  boxShadow: '0 2px 8px rgba(255,193,7,0.4)',
                }}
              />
            )}
            <CardContent
              sx={{
                textAlign: "center",
                width: "100%",
                zIndex: 1,
                position: "relative",
                pt: 4,
              }}
            >
              <Box mb={2} sx={{ fontSize: 60, transition: 'transform 0.3s', '&:hover': { transform: 'rotate(10deg)' } }}>
                {ach.icon}
              </Box>
              <Typography variant="h6" fontWeight={700} mb={1} color="#444">
                {ach.name}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={ach.progress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  mb: 1,
                  background: '#dde1e6',
                  boxShadow: 'inset 2px 2px 4px #caced1, inset -2px -2px 4px #ffffff',
                  "& .MuiLinearProgress-bar": {
                    transition: "transform 1s cubic-bezier(.4, 2, .3, 1)",
                    backgroundColor: getProgressColor(ach.progress),
                  },
                }}
              />
              <Typography variant="body2" color="#777" fontWeight={500}>
                {ach.progress}% to next tier
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
      
      {/* Locked Achievements Section */}
      <Typography variant="h5" fontWeight={600} mt={6} mb={3} color="#555" sx={{ textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.1)' }}>
        Locked Challenges
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
          gap: 4,
        }}
      >
        {locked.map((ach, index) => (
          <Tooltip key={ach.id} title={`Locked: ${ach.nextTier}`}>
            <Card
              className="achievement-card locked"
              sx={{
                cursor: "not-allowed",
                borderRadius: 4,
                boxShadow: "inset 6px 6px 12px #caced1, inset -6px -6px 12px #ffffff",
                opacity: 0.6,
                background: "#ecf0f3",
                position: "relative",
                minHeight: 180,
                transition: "transform 0.3s, opacity 0.3s",
                animation: `card-fade-in 0.5s ease-out forwards ${index * 0.1}s`,
                "&:hover": {
                  opacity: 0.8,
                },
              }}
            >
              <CardContent
                sx={{
                  textAlign: "center",
                  width: "100%",
                  position: "relative",
                  zIndex: 1,
                  pt: 4,
                }}
              >
                <Box mb={2} sx={{ fontSize: 60, color: '#b0b3b9' }}>
                  {ach.icon}
                  <LockIcon
                    sx={{ 
                      color: "#555",
                      ml: 1,
                      fontSize: "1.2rem",
                      verticalAlign: "top",
                      filter: 'drop-shadow(0 0 5px #fff) drop-shadow(0 0 2px #777)'
                    }}
                  />
                </Box>
                <Typography variant="h6" fontWeight={600} mb={1} color="#888">
                  {ach.name}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={ach.progress}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    mb: 1,
                    background: '#dde1e6',
                    boxShadow: 'inset 2px 2px 4px #caced1, inset -2px -2px 4px #ffffff',
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: '#bdbdbd',
                    },
                  }}
                />
                <Typography variant="body2" color="#999" fontWeight={500}>
                  Locked
                </Typography>
              </CardContent>
            </Card>
          </Tooltip>
        ))}
      </Box>

      {/* --- New Badges Section --- */}
      <Typography variant="h5" fontWeight={600} mb={3} mt={8} color="#555" sx={{ textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.1)' }}>
        Badges
      </Typography>

      {/* Unlocked Badges */}
      <Typography variant="h6" fontWeight={500} mb={2} color="#777">
        Unlocked Badges
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4, mb: 4 }}>
        {unlockedBadges.map((badge, index) => (
          <Tooltip key={badge.id} title={badge.tooltip}>
            <Box
              sx={{
                position: "relative",
                width: 120,
                height: 120,
              }}
            >
              <Box
                className="badge-card unlocked"
                sx={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  overflow: "hidden",
                  boxShadow: "8px 8px 16px #caced1, -8px -8px 16px #ffffff",
                  cursor: "pointer",
                  transition: "transform 0.3s, box-shadow 0.3s, filter 0.3s",
                  animation: `badge-pop-in 0.4s ease-out forwards ${index * 0.15}s`,
                  "&:hover": {
                    transform: "scale(1.15) rotate(5deg)",
                    boxShadow: "6px 6px 12px #caced1, -6px -6px 12px #ffffff",
                    filter: "drop-shadow(0 0 10px rgba(0,123,255,0.4))",
                  },
                }}
              >
                <img
                  src={badge.image.src}
                  alt={badge.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
                  }}
                />
              </Box>
              {badge.isNew && (
                <Chip
                  label="NEW!"
                  color="warning"
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    fontWeight: 700,
                    fontSize: 12,
                    animation: "pulse 1.5s infinite",
                    zIndex: 2,
                    background: 'linear-gradient(45deg, #ffc107, #ff9800)',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(255,193,7,0.4)',
                  }}
                />
              )}
            </Box>
          </Tooltip>
        ))}
      </Box>

      {/* Locked Badges */}
      <Typography variant="h6" fontWeight={500} mb={2} color="#777">
        Locked Badges
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {lockedBadges.map((badge, index) => (
          <Tooltip key={badge.id} title={badge.tooltip}>
            <Box
              className="badge-card locked"
              sx={{
                position: "relative",
                width: 120,
                height: 120,
                borderRadius: "50%",
                overflow: "hidden",
                boxShadow: "inset 6px 6px 12px #caced1, inset -6px -6px 12px #ffffff",
                cursor: "not-allowed",
                transition: "transform 0.3s, box-shadow 0.3s",
                animation: `card-fade-in 0.5s ease-out forwards ${index * 0.1}s`,
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            >
              {/* Badge image with a hatched/faded filter */}
              <img
                src={badge.image.src}
                alt={badge.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "grayscale(100%) brightness(50%)", // Grayscale and darken
                  opacity: 0.8, // Semi-transparent
                }}
              />
              {/* Overlay with a subtle hatched pattern if needed */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: `
                    repeating-linear-gradient(
                      45deg,
                      rgba(255, 255, 255, 0.1),
                      rgba(255, 255, 255, 0.1) 2px,
                      rgba(0, 0, 0, 0.1) 2px,
                      rgba(0, 0, 0, 0.1) 4px
                    )
                  `,
                  borderRadius: "50%",
                  zIndex: 1,
                }}
              />
              {/* Lock icon centered on top */}
              <LockIcon
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  color: "#555",
                  fontSize: 50,
                  zIndex: 2,
                  filter: 'drop-shadow(0 0 5px #fff) drop-shadow(0 0 2px #777)',
                }}
              />
            </Box>
          </Tooltip>
        ))}
      </Box>

      {/* Modal for achievement details */}
      <Modal open={modalOpen} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "#ecf0f3",
            boxShadow: "10px 10px 20px #caced1, -10px -10px 20px #ffffff",
            p: 5,
            borderRadius: 6,
            minWidth: 320,
            maxWidth: 400,
            textAlign: "center",
            animation: "modal-fade-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        >
          {selected?.unlocked && (
            <CelebrationIcon
              sx={{
                fontSize: 60,
                color: "gold",
                mb: 2,
                animation: "confetti-pop 1.5s ease-out",
                filter: "drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))",
              }}
            />
          )}

          {selected && (
            <>
              <Box mb={2} textAlign="center">
                <Box sx={{ fontSize: 60, mb: 1, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" }}>
                  {selected.icon}
                </Box>
                <Typography variant="h4" fontWeight={800} mt={1} color="#333">
                  {selected.name}
                </Typography>
              </Box>
              <Typography variant="body1" mb={1} color="#555">
                {selected.description}
              </Typography>
              <Typography variant="body2" color="#777" mb={2}>
                {selected.date
                  ? `Unlocked on ${selected.date}`
                  : "Not unlocked yet"}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={selected.progress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  mb: 2,
                  background: '#dde1e6',
                  boxShadow: 'inset 2px 2px 4px #caced1, inset -2px -2px 4px #ffffff',
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: getProgressColor(selected.progress),
                  },
                }}
              />
              <Typography variant="body2" fontWeight={600} mb={2} color="#666">
                Next Tier: {selected.nextTier}
              </Typography>
              {selected.unlocked && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleShare}
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    boxShadow: "6px 6px 12px #caced1, -6px -6px 12px #ffffff",
                    background: 'linear-gradient(145deg, #3498db, #2980b9)',
                    color: '#fff',
                    transition: 'transform 0.3s',
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: "4px 4px 8px #caced1, -4px -4px 8px #ffffff",
                    },
                  }}
                >
                  Share Achievement
                </Button>
              )}
            </>
          )}
        </Box>
      </Modal>

      <style>{`
        body {
          font-family: 'Poppins', sans-serif;
          background-color: #ecf0f3;
        }

        .achievement-card, .badge-card {
          will-change: transform, box-shadow;
        }

        @keyframes card-fade-in {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes badge-pop-in {
          from {
            transform: scale(0.5) rotate(-30deg);
            opacity: 0;
          }
          70% {
            transform: scale(1.1) rotate(5deg);
            opacity: 1;
          }
          to {
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes confetti-pop {
          0% {
            transform: scale(0.5) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(10deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes modal-fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, -40%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </Box>
  );
}