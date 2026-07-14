import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  TextField,
  InputAdornment
} from "@mui/material";
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import RoomIcon from '@mui/icons-material/Room';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useRouter } from "next/router";
import api from "../utils/api";
import { hasAuthToken, redirectToLogin } from "../utils/authRedirect";
import { getCurrentUserRole } from "../utils/permissions";
import PageHeader from "../components/layout/PageHeader";
import EmptyState from "../components/layout/EmptyState";
import { Briefcase } from "lucide-react";
import RecentlyViewedInternships from "../components/RecentlyViewedInternships";
import DeadlineCountdown from "../components/DeadlineCountdown";
import JobFilters from "../components/layout/JobFilters";

interface JobApplication {
  id: string;
  title: string;
  company: string;
  location: string;
  status: 'Applied' | 'Interviewing' | 'Offered' | 'Closed';
  appliedDate: string;
}

const RecommendationsWidget = ({ recommendedJobs, setActiveTab }: any) => (
  <Card sx={{ borderRadius: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
    <CardContent sx={{ p: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <WorkIcon color="primary" />
        <Typography variant="subtitle1" fontWeight={700}>
          Recommended for You
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Career matches based on your medical profile and interests:
      </Typography>
      {recommendedJobs.length === 0 ? (
        <Typography variant="caption" color="text.secondary">No recommended positions available.</Typography>
      ) : (
        <Stack spacing={2.5}>
          {recommendedJobs.map((j: any) => (
            <Box key={j._id} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Typography variant="body2" fontWeight={700} color="primary" gutterBottom>
                {j.title}
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1.5 }}>
                {j.location}
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setActiveTab(0)}
                sx={{ borderRadius: 2, textTransform: 'none', fontSize: 11 }}
              >
                View Opportunity
              </Button>
            </Box>
          ))}
        </Stack>
      )}
    </CardContent>
  </Card>
);

export default function Jobs() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [originalJobs, setOriginalJobs] = useState<any[]>([]);
  const [smartQuery, setSmartQuery] = useState("");
  const [isSmartSearching, setIsSmartSearching] = useState(false);
  const [smartSearchError, setSmartSearchError] = useState("");
  const [smartSearchActive, setSmartSearchActive] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [userType, setUserType] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Saved / Applied states using localStorage
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);

  // Filter states
  const [filterSpecialty, setFilterSpecialty] = useState<string[]>([]);
  const [filterExperience, setFilterExperience] = useState<string>("");
  const [filterRemote, setFilterRemote] = useState<boolean>(false);
  const [filterVisa, setFilterVisa] = useState<boolean>(false);

  const handleSmartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartQuery.trim()) return;

    setIsSmartSearching(true);
    setSmartSearchError("");

    try {
      const res = await api.get("/search/smart", {
        params: { q: smartQuery, type: "jobs" }
      });
      const results = res.data?.data?.results || [];
      setJobs(results);
      setSmartSearchActive(true);
    } catch (err: any) {
      console.error(err);
      setSmartSearchError(err.response?.data?.message || "AI smart search failed. Please try again.");
    } finally {
      setIsSmartSearching(false);
    }
  };

  const handleClearSmartSearch = () => {
    setJobs(originalJobs);
    setSmartQuery("");
    setSmartSearchActive(false);
    setSmartSearchError("");
  };

  useEffect(() => {
    if (!router.isReady) return;

    if (!hasAuthToken()) {
      redirectToLogin(router, "/jobs");
      return;
    }

    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;

    let storedUser = null;
    try {
      storedUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
    } catch {
      storedUser = null;
    }
    const currentUserType = storedUser?.userType || getCurrentUserRole() || "";
    setUserType(String(currentUserType).toLowerCase());
    if (storedUser?._id) {
      setCurrentUserId(storedUser._id);
    }

    // Load saved / applied jobs from localstorage
    try {
      const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      setSavedJobIds(saved);
      const apps = JSON.parse(localStorage.getItem('jobApplications') || '[]');
      setApplications(apps);
    } catch (e) {
      console.error(e);
    }
  }, [authChecked]);

  useEffect(() => {
    if (!authChecked || smartSearchActive) return;

    setLoading(true);
    const params: any = {};
    if (filterSpecialty.length > 0) {
      params.specialization = filterSpecialty;
    }
    if (filterExperience) params.maxExperience = filterExperience;
    if (filterRemote) params.isRemote = true;
    if (filterVisa) params.visaSponsorship = true;

    api
      .get("/jobs", { params })
      .then((res) => {
        const fetchedJobs = res.data.data.jobOpportunities || res.data.data.jobs || [];
        const sortedJobs = [...fetchedJobs].sort((a: any, b: any) => {
          const scoreA = a.matchPercentage !== undefined ? a.matchPercentage : -1;
          const scoreB = b.matchPercentage !== undefined ? b.matchPercentage : -1;
          return scoreB - scoreA;
        });
        setJobs(sortedJobs);
        if (!filterSpecialty.length && !filterExperience && !filterRemote && !filterVisa) {
          setOriginalJobs(sortedJobs);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch jobs");
        setLoading(false);
      });
  }, [authChecked, filterSpecialty, filterExperience, filterRemote, filterVisa, smartSearchActive]);

  const toggleSaveJob = (id: string) => {
    let updated;
    if (savedJobIds.includes(id)) {
      updated = savedJobIds.filter(savedId => savedId !== id);
    } else {
      updated = [...savedJobIds, id];
    }
    setSavedJobIds(updated);
    localStorage.setItem('savedJobs', JSON.stringify(updated));
  };

  const handleApply = (job: any) => {
    // Add to applications list in localstorage
    const exists = applications.find(app => app.id === job._id);
    if (exists) return;

    const newApp: JobApplication = {
      id: job._id,
      title: job.title,
      company: job.company || 'MedInternia Hospital Group',
      location: job.location,
      status: 'Applied',
      appliedDate: new Date().toLocaleDateString()
    };

    const updated = [newApp, ...applications];
    setApplications(updated);
    localStorage.setItem('jobApplications', JSON.stringify(updated));
  };

  const isPatient = userType === "patient";

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress aria-label="Loading job opportunities" />
      </Box>
    );
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  const savedJobs = jobs.filter(j => savedJobIds.includes(j._id));

  // Career recommendations based on user role
  const recommendedJobs = jobs
    .filter(j => j.status === 'Open')
    .slice(0, 2);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, minHeight: "80vh" }}>
      <PageHeader
        title="Career Dashboard"
        subtitle="Find residency openings, fellowships, and clinical job opportunities tailored for doctors and interns."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Jobs" }]}
      />

      {isPatient ? (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
          Job opportunities are currently available for doctors and interns.
        </Alert>
      ) : (
        <Box sx={{ width: "100%", mb: 3 }}>
          <RecentlyViewedInternships />
        </Box>
      )}

      {isPatient ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
          <Typography color="text.secondary">
            Patients do not see job opportunities on this platform.
          </Typography>
        </Card>
      ) : (
        <Box>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            centered
            sx={{ mb: 4, borderBottom: '1px solid #e3eafc' }}
          >
            <Tab label="Explore Jobs" sx={{ fontWeight: 600 }} />
            <Tab label={`Saved (${savedJobs.length})`} sx={{ fontWeight: 600 }} />
            <Tab label={`Application Tracker (${applications.length})`} sx={{ fontWeight: 600 }} />
          </Tabs>

          {activeTab === 0 ? (
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 3 }}>
                <JobFilters
                  specialties={filterSpecialty}
                  onSpecialtiesChange={setFilterSpecialty}
                  experience={filterExperience}
                  onExperienceChange={setFilterExperience}
                  isRemote={filterRemote}
                  onRemoteChange={setFilterRemote}
                  visaSponsorship={filterVisa}
                  onVisaChange={setFilterVisa}
                  onClear={() => {
                    setFilterSpecialty([]);
                    setFilterExperience('');
                    setFilterRemote(false);
                    setFilterVisa(false);
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Stack spacing={3}>
                  <Card sx={{ p: 3, borderRadius: 4, background: 'linear-gradient(135deg, #f0f7ff 0%, #e0efff 100%)', border: '1px solid #cce3ff', boxShadow: '0 4px 15px rgba(0, 114, 255, 0.05)' }}>
                    <form onSubmit={handleSmartSearch}>
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AutoAwesomeIcon color="primary" />
                          <Typography variant="subtitle1" fontWeight={700} color="primary">
                            AI-Powered Smart Search
                          </Typography>
                          <Chip label="Gemini AI" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                        </Stack>
                        
                        <Typography variant="body2" color="text.secondary">
                          Describe what you're looking for in plain English. We'll automatically filter by specialization, location, type, and more.
                        </Typography>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                          <TextField
                            fullWidth
                            size="small"
                            value={smartQuery}
                            onChange={(e) => setSmartQuery(e.target.value)}
                            placeholder="e.g. show me cardiology internships in Gujarat or remote pediatrics fellowships"
                            disabled={isSmartSearching}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <SearchIcon color="action" />
                                </InputAdornment>
                              ),
                              endAdornment: smartQuery && (
                                <InputAdornment position="end">
                                  <IconButton size="small" onClick={handleClearSmartSearch} disabled={isSmartSearching}>
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                            sx={{ bgcolor: '#fff', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                          <Button
                            variant="contained"
                            type="submit"
                            disabled={isSmartSearching || !smartQuery.trim()}
                            sx={{ minWidth: 120, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                          >
                            {isSmartSearching ? <CircularProgress size={20} color="inherit" /> : 'Search'}
                          </Button>
                        </Stack>

                        {smartSearchError && (
                          <Alert severity="error" sx={{ borderRadius: 2, py: 0.5 }}>
                            {smartSearchError}
                          </Alert>
                        )}

                        {smartSearchActive && (
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" fontWeight={600} color="primary">
                              Showing {jobs.length} smart search result{jobs.length !== 1 ? 's' : ''}
                            </Typography>
                            <Button size="small" onClick={handleClearSmartSearch} sx={{ textTransform: 'none', fontWeight: 600, p: 0 }}>
                              Clear Search
                            </Button>
                          </Stack>
                        )}
                      </Stack>
                    </form>
                  </Card>

                  {jobs.length === 0 ? (
                    <Typography align="center" color="text.secondary">No job opportunities found.</Typography>
                  ) : (
                    jobs.map((j) => {
                      const isSaved = savedJobIds.includes(j._id);
                      const isApplied = applications.some(app => app.id === j._id);

                      return (
                        <Card key={j._id} sx={{ borderRadius: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                          <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography variant="h6" fontWeight={700} color="primary">
                                  {j.title}
                                </Typography>
                                <Stack direction="row" spacing={2} sx={{ mt: 1, color: 'text.secondary' }} flexWrap="wrap" useFlexGap>
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <BusinessIcon sx={{ fontSize: 18 }} />
                                    <Typography variant="caption">{j.company || 'MedInternia Partners'}</Typography>
                                  </Stack>
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <RoomIcon sx={{ fontSize: 18 }} />
                                    <Typography variant="caption">{j.location}</Typography>
                                  </Stack>
                                </Stack>
                              </Box>
                              <IconButton onClick={() => toggleSaveJob(j._id)} color="primary">
                                {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                              </IconButton>
                            </Stack>

                            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                              <Chip label={j.status} color={j.status === 'Open' ? 'success' : 'default'} size="small" sx={{ fontWeight: 700 }} />
                              {j.matchPercentage !== undefined && (
                                <Chip
                                  icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: 'inherit !important' }} />}
                                  label={`${j.matchPercentage}% Match`}
                                  size="small"
                                  sx={{
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    backgroundColor: j.matchPercentage >= 80 
                                      ? '#e6f4ea' 
                                      : (j.matchPercentage >= 50 ? '#fef7e0' : '#fce8e6'),
                                    color: j.matchPercentage >= 80 
                                      ? '#137333' 
                                      : (j.matchPercentage >= 50 ? '#b06000' : '#c5221f'),
                                    '& .MuiChip-icon': {
                                      color: 'inherit !important'
                                    }
                                  }}
                                />
                              )}
                              {j.salary && <Chip label={j.salary} size="small" variant="outlined" />}
                              <DeadlineCountdown deadline={j.applicationDeadline} />
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary">
                                Posted: {new Date(j.createdAt || Date.now()).toLocaleDateString()}
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                {j.postedBy && (typeof j.postedBy === 'string' ? j.postedBy : j.postedBy._id) !== currentUserId && (
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => router.push(`/messages?userId=${typeof j.postedBy === 'string' ? j.postedBy : j.postedBy._id}`)}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                  >
                                    Message Recruiter
                                  </Button>
                                )}
                                {j.status === "Open" ? (
                                  <Button 
                                    variant="contained" 
                                    color={isApplied ? "success" : "primary"}
                                    onClick={() => handleApply(j)}
                                    disabled={isApplied}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                  >
                                    {isApplied ? "Applied" : "Apply"}
                                  </Button>
                                ) : (
                                  <Button variant="outlined" disabled sx={{ borderRadius: 2, textTransform: 'none' }}>
                                    Closed
                                  </Button>
                                )}
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <RecommendationsWidget recommendedJobs={recommendedJobs} setActiveTab={setActiveTab} />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 8 }}>
                {activeTab === 1 && (
                <Stack spacing={3}>
                  {savedJobs.length === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: 3 }}>
                      No saved opportunities. Go to 'Explore Jobs' and click the bookmark icon to save job postings!
                    </Alert>
                  ) : (
                    savedJobs.map((j) => {
                      const isApplied = applications.some(app => app.id === j._id);
                      return (
                        <Card key={j._id} sx={{ borderRadius: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                          <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography variant="h6" fontWeight={700} color="primary">
                                  {j.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">{j.location}</Typography>
                              </Box>
                              <IconButton onClick={() => toggleSaveJob(j._id)} color="primary">
                                <BookmarkIcon />
                              </IconButton>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip label={j.status} color={j.status === 'Open' ? 'success' : 'default'} size="small" sx={{ fontWeight: 700 }} />
                                {j.matchPercentage !== undefined && (
                                  <Chip
                                    icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: 'inherit !important' }} />}
                                    label={`${j.matchPercentage}% Match`}
                                    size="small"
                                    sx={{
                                      borderRadius: '6px',
                                      fontWeight: 700,
                                      fontSize: '0.75rem',
                                      backgroundColor: j.matchPercentage >= 80 
                                        ? '#e6f4ea' 
                                        : (j.matchPercentage >= 50 ? '#fef7e0' : '#fce8e6'),
                                      color: j.matchPercentage >= 80 
                                        ? '#137333' 
                                        : (j.matchPercentage >= 50 ? '#b06000' : '#c5221f'),
                                      '& .MuiChip-icon': {
                                        color: 'inherit !important'
                                      }
                                    }}
                                  />
                                )}
                              </Stack>
                              <Stack direction="row" spacing={1}>
                                {j.postedBy && (typeof j.postedBy === 'string' ? j.postedBy : j.postedBy._id) !== currentUserId && (
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => router.push(`/messages?userId=${typeof j.postedBy === 'string' ? j.postedBy : j.postedBy._id}`)}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                  >
                                    Message Recruiter
                                  </Button>
                                )}
                                {j.status === "Open" ? (
                                  <Button 
                                    variant="contained" 
                                    color={isApplied ? "success" : "primary"}
                                    onClick={() => handleApply(j)}
                                    disabled={isApplied}
                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                  >
                                    {isApplied ? "Applied" : "Apply"}
                                  </Button>
                                ) : (
                                  <Button variant="outlined" disabled sx={{ borderRadius: 2 }}>Closed</Button>
                                )}
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </Stack>
              )}

              {activeTab === 2 && (
                <Card sx={{ borderRadius: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                      Submitted Applications
                    </Typography>
                    {applications.length === 0 ? (
                      <Alert severity="info" sx={{ borderRadius: 3 }}>
                        No applications tracked yet. Click 'Apply' on any open job to add it to the tracker.
                      </Alert>
                    ) : (
                      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
                        <Table aria-label="application tracker table">
                          <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                              <TableCell><strong>Position / Company</strong></TableCell>
                              <TableCell><strong>Applied Date</strong></TableCell>
                              <TableCell><strong>Status</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {applications.map((app) => (
                              <TableRow key={app.id}>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={700}>{app.title}</Typography>
                                  <Typography variant="caption" color="text.secondary">{app.company} - {app.location}</Typography>
                                </TableCell>
                                <TableCell>{app.appliedDate}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={app.status} 
                                    size="small" 
                                    color={
                                      app.status === 'Offered' ? 'success' : 
                                      app.status === 'Interviewing' ? 'warning' : 'primary'
                                    }
                                    sx={{ fontWeight: 700 }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              )}
            </Grid>

            {/* Sidebar: Recommendations Widget */}
            <Grid size={{ xs: 12, md: 4 }}>
              <RecommendationsWidget recommendedJobs={recommendedJobs} setActiveTab={setActiveTab} />
            </Grid>
          </Grid>
          )}
        </Box>
      )}
    </Container>
  );
}

