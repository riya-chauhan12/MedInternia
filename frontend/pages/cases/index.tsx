import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Modal,
  Stack,
  useTheme,
  Paper,
  Card,
  IconButton
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import CaseCard from '../../components/CaseCard';
import CaseFilters, { CaseFilterParams } from '../../components/CaseFilters';
import api from "../../utils/api";
import Link from "next/link";
import { useRouter } from "next/router";
import { canUser } from "../../utils/permissions";
import {getCurrentUserRole} from "../../utils/permissions";

import PageHeader from "../../components/layout/PageHeader";
import EmptyState from "../../components/layout/EmptyState";
import FilterBar from "../../components/layout/FilterBar";
import CaseCardV2 from "../../components/layout/CaseCardV2";
import { FileText, Plus, ArrowRight, Sparkles } from "lucide-react";
import dynamic from 'next/dynamic';

const CaseDiscussion = dynamic(() => import('./[id]'), { ssr: false });

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

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

export default function Cases() {
  const [cases, setCases] = useState<any[]>([]);
  const [recommendedCases, setRecommendedCases] = useState<any[]>([]);
  const [recMessage, setRecMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [isRareDisease, setIsRareDisease] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [openDiscussionId, setOpenDiscussionId] = useState<string | null>(null);
  const userRole = getCurrentUserRole();
  const theme = useTheme();
  const router = useRouter();
  const canCreateCases = canUser(userRole, "case:create");

  // Check login state and permissions
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);

      // Fetch recommended cases
      api
        .get("/cases/recommended")
        .then((res) => {
          setRecommendedCases(res.data?.data?.cases || []);
          setRecMessage(res.data?.message || "");
        })
        .catch((err) => {
          console.warn("Failed to fetch recommended cases", err);
        });
    }
    // Remove the standalone fetch here so we don't double fetch, fetchCases handles it
  }, []);

  // Fetch Cases with Filters
  const fetchCases = (pageNum = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const params: any = {
      page: pageNum,
      limit: 10
    };
    if (search) params.search = search;
    if (specialty) params.specialization = specialty;
    if (difficulty) params.difficulty = difficulty;
    if (isRareDisease) params.isRareDisease = true;

    api
      .get("/cases", { params })
      .then((res) => {
        const fetchedCases = res.data.data.cases || [];
        const pagination = res.data.data.pagination || { page: 1, pages: 1 };
        
        if (append) {
          setCases((prev) => [...prev, ...fetchedCases]);
        } else {
          setCases(fetchedCases);
        }
        
        setHasMore(pagination.page < pagination.pages);
        setError("");
        setLoading(false);
        setLoadingMore(false);
      })
      .catch((err) => {
        setError("Failed to fetch cases");
        setLoading(false);
        setLoadingMore(false);
      });
  };

  useEffect(() => {
    setPage(1);
    fetchCases(1, false);
  }, [search, specialty, difficulty, isRareDisease]);

  const loadMoreCases = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCases(nextPage, true);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSpecialty("");
    setDifficulty("");
    setIsRareDisease(false);
  };

  const specialtyOptions = [
    { value: '', label: 'All Specialties' },
    ...SPECIALTIES.map(spec => ({ value: spec, label: spec }))
  ];

  const difficultyOptions = [
    { value: '', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <PageHeader
        title="Medical Cases"
        subtitle="Discover, review, and contribute to clinical cases to expand medical knowledge and earn learning points."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Cases" }]}
        action={
          canCreateCases ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              component={Link}
              href="/cases/create"
              sx={{
                borderRadius: '12px',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(0, 114, 255, 0.4)',
                background: 'linear-gradient(90deg, #0072ff 0%, #00c6ff 100%)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #0056cc 0%, #0072ff 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0, 114, 255, 0.6)',
                },
                transition: 'all 0.2s',
              }}
            >
              Post a Case
            </Button>
          ) : null
        }
      />

      {/* Recommended for you row */}
      {isLoggedIn && (
        <Box sx={{ mb: 5 }}>
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
            <Box
              sx={{
                p: 0.8,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 2px 10px rgba(255, 215, 0, 0.3)',
              }}
            >
              <Sparkles size={16} />
            </Box>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Recommended for you
            </Typography>
          </Stack>

          {recommendedCases.length > 0 ? (
            <Box
              sx={{
                display: 'flex',
                gap: 3,
                overflowX: 'auto',
                pb: 2,
                px: 0.5,
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  height: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#cbd5e1',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#94a3b8',
                  borderRadius: '10px',
                },
              }}
            >
              {recommendedCases.map((rc) => (
                <Box
                  key={rc._id}
                  sx={{
                    minWidth: { xs: 280, sm: 340 },
                    maxWidth: { xs: 280, sm: 340 },
                    flexShrink: 0,
                  }}
                >
                  <Card
                    sx={{
                      width: 320,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      p: 2,
                      borderRadius: 4,
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1.5px solid rgba(0, 114, 255, 0.08)',
                      boxShadow: '0 4px 20px rgba(0, 114, 255, 0.04)',
                      cursor: 'pointer',
                    }}
                    onClick={() => router.push(`/cases/${rc._id}`)}
                  >
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Box
                          sx={{
                            px: 1.2,
                            py: 0.4,
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            bgcolor: '#ebf8ff',
                            color: '#2b6cb0',
                          }}
                        >
                          🩺 {rc.specialization}
                        </Box>
                        <Box
                          sx={{
                            px: 1.2,
                            py: 0.4,
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            ...(() => {
                              switch (rc.difficulty?.toLowerCase()) {
                                case 'beginner':
                                  return { bgcolor: '#e6fffa', color: '#00a389' };
                                case 'advanced':
                                  return { bgcolor: '#fff5f5', color: '#e53e3e' };
                                default:
                                  return { bgcolor: '#fffaf0', color: '#dd6b20' };
                              }
                            })()
                          }}
                        >
                          {rc.difficulty || 'Intermediate'}
                        </Box>
                      </Stack>

                      <Typography variant="h6" fontWeight={800} sx={{ mb: 1, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#0056cc' }}>
                        {rc.title}
                      </Typography>

                      <Typography variant="body2" sx={{ lineClamp: 3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 2, color: 'text.secondary' }}>
                        {rc.description}
                      </Typography>
                    </Box>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                      <Typography fontSize={11} color="text.disabled">
                        By {rc.doctor?.firstName ? `Dr. ${rc.doctor.firstName}` : 'Clinical AI'}
                      </Typography>
                      <Button
                        size="small"
                        endIcon={<ArrowRight size={14} />}
                        sx={{ p: 0, minWidth: 0, fontWeight: 700, color: 'primary.main', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                      >
                        Solve
                      </Button>
                    </Stack>
                  </Card>
                </Box>
              ))}
            </Box>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: 4,
                bgcolor: '#fff',
                border: '1.5px dashed rgba(0, 114, 255, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#e8f4ff', width: 48, height: 48, borderRadius: '50%' }}>
                <Sparkles size={22} />
              </Box>
              <Typography variant="body1" fontWeight={700} color="text.primary">
                {recMessage || "Solve a few cases to get personalised recommendations."}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                Our recommender tracks the tags of cases you successfully solve and highlights similar clinical scenarios.
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Filter and Search Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by case title, diagnosis, symptoms, or topic..."
        specialtyValue={specialty}
        onSpecialtyChange={setSpecialty}
        specialtyOptions={specialtyOptions}
        difficultyValue={difficulty}
        onDifficultyChange={setDifficulty}
        difficultyOptions={difficultyOptions}
        isRareDiseaseValue={isRareDisease}
        onRareDiseaseChange={setIsRareDisease}
        onClear={handleResetFilters}
      />

      {/* Main Cases Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
          <CircularProgress size={50} thickness={4} />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : cases.length === 0 ? (
        !search && !specialty && !difficulty && !isRareDisease ? (
          <EmptyState
            icon={FileText}
            title="No cases posted yet"
            description="Be the first to submit a clinical case to MedInternia."
            actionLabel={canCreateCases ? "Post a Case" : undefined}
            onAction={canCreateCases ? () => router.push("/cases/create") : undefined}
          />
        ) : (
          <EmptyState
            icon={FileText}
            title="No cases match your filters"
            description="Try modifying your search keywords or clearing active filters to view other medical case studies."
            actionLabel="Clear Filters"
            onAction={handleResetFilters}
          />
        )
      ) : (
        <>
          <Grid container spacing={3}>
            {cases.map((c) => (
              <Grid size={{ xs: 12, md: 6 }} key={c._id}>
                <Box sx={{ height: '100%' }}>
                  <CaseCardV2
                    caseData={c}
                    onViewDetails={(id) => router.push(`/cases/${id}`)}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
          
          <Stack direction="row" justifyContent="center" sx={{ mt: 5 }}>
            {hasMore && (
              <Button
                variant="outlined"
                color="primary"
                onClick={loadMoreCases}
                disabled={loadingMore}
                sx={{
                  borderRadius: '12px',
                  px: 4,
                  py: 1.25,
                  fontWeight: 700,
                  borderWidth: '2px',
                  '&:hover': { borderWidth: '2px' }
                }}
              >
                {loadingMore ? <CircularProgress size={20} /> : "Load More"}
              </Button>
            )}
          </Stack>
        </>
      )}

      {/* Modal for Discussions */}
      <Modal
        open={!!openDiscussionId}
        onClose={() => setOpenDiscussionId(null)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box
          sx={{
            width: { xs: '98vw', sm: 600 },
            maxHeight: '90vh',
            overflowY: 'auto',
            bgcolor: 'background.default',
            borderRadius: 4,
            boxShadow: 24,
            p: 3,
            position: 'relative'
          }}
        >
          <IconButton
            aria-label="Close case discussion"
            onClick={() => setOpenDiscussionId(null)}
            sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10, bgcolor: 'rgba(0,0,0,0.05)', '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' } }}
          >
            <CloseIcon />
          </IconButton>
          {openDiscussionId && <CaseDiscussion id={openDiscussionId} modalMode hideDescription />}
        </Box>
      </Modal>
    </Container>
  );
}
