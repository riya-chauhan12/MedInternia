import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Grid
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import api from '../utils/api';
import WebinarJoin from "../components/WebinarJoin";
import { canUser } from "../utils/permissions";
import PageHeader from "../components/layout/PageHeader";
import EmptyState from "../components/layout/EmptyState";
import { Plus, Video, Calendar as CalendarIcon, ExternalLink } from "lucide-react";
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { generateGoogleCalendarUrl, generateOutlookCalendarUrl } from '../utils/calendarLinks';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const specialtiesList = [
  "general",
  "cardiology",
  "neurology",
  "oncology",
  "pediatrics",
  "surgery",
  "psychiatry",
  "radiology",
  "emergency",
  "internal-medicine"
];

const typesList = [
  { value: "webinar", label: "Webinar" },
  { value: "ama", label: "AMA" },
  { value: "case-discussion", label: "Case Discussion" },
  { value: "live-conference", label: "Live Conference" }
];

const getWebinarEndTime = (webinar: any) => {
  const duration = Number(webinar.duration || 0);
  return new Date(new Date(webinar.scheduledAt).getTime() + duration * 60 * 1000);
};

const isWebinarExpired = (webinar: any) => {
  const now = new Date();
  if (webinar.status === "completed" || webinar.status === "cancelled") {
    return true;
  }
  if (webinar.status === "live") {
    return getWebinarEndTime(webinar) <= now;
  }
  return new Date(webinar.scheduledAt) <= now;
};

export default function WebinarsPage() {
  const router = useRouter();
  const [webinars, setWebinars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWebinar, setSelectedWebinar] = useState<any>(null);
  const [canManageWebinars, setCanManageWebinars] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'calendar'>('active');
  const [registeredWebinars, setRegisteredWebinars] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Filters State
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sortBy, setSortBy] = useState("scheduledAt");

  const fetchWebinars = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTab === 'active') {
      params.append('upcoming', 'true');
    } else {
      params.append('limit', '100');
    }

    if (filterSpecialty) params.append('specialization', filterSpecialty);
    if (filterType) params.append('type', filterType);
    
    if (sortBy === 'most_registered') {
      params.append('sortBy', 'most_registered');
    } else if (sortBy === 'highest_rated') {
      params.append('sortBy', 'highest_rated');
    } else {
      params.append('sortBy', 'scheduledAt');
      params.append('sortOrder', activeTab === 'active' ? 'asc' : 'desc');
    }

    api.get(`/webinars?${params.toString()}`)
      .then(res => {
        const fetchedWebinars = res.data.data.webinars || [];
        let visibleWebinars = fetchedWebinars;
        if (activeTab === 'active') {
          visibleWebinars = fetchedWebinars.filter((w: any) => !isWebinarExpired(w));
        } else if (activeTab === 'completed') {
          visibleWebinars = fetchedWebinars.filter((w: any) => isWebinarExpired(w));
        }

        setWebinars(visibleWebinars);
        setLoading(false);
      })
      .catch(() => {
        setWebinars([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWebinars();
  }, [activeTab, filterSpecialty, filterType, sortBy]);

  useEffect(() => {
    // Fetch user profile
    api.get('/auth/profile')
      .then(res => {
        const user = res.data?.data?.user;
        const userType = user?.userType;
        setCurrentUserId(user?._id || '');
        setCanManageWebinars(canUser(userType, 'webinar:manage'));
      })
      .catch(() => setCanManageWebinars(false));
  }, []);

  // Update registered status when webinars or user ID loads
  useEffect(() => {
    if (!currentUserId) return;
    const registered = new Set<string>();
    webinars.forEach((w) => {
      const isRegistered = w.participants?.some(
        (p: any) => (p.user?._id === currentUserId || p.user === currentUserId)
      );
      if (isRegistered) {
        registered.add(w._id);
      }
    });
    setRegisteredWebinars(registered);
  }, [webinars, currentUserId]);

  const handleRegister = async (webinarId: string) => {
    try {
      await api.post(`/webinars/${webinarId}/register`, {});
      setRegisteredWebinars(prev => new Set([...prev, webinarId]));
      alert('Registered successfully for webinar!');
      fetchWebinars();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to register for webinar';
      alert(message);
    }
  };

  const handleUnregister = async (webinarId: string) => {
    try {
      await api.delete(`/webinars/${webinarId}/register`);
      setRegisteredWebinars(prev => {
        const updated = new Set(prev);
        updated.delete(webinarId);
        return updated;
      });
      alert('Unregistered successfully!');
      fetchWebinars();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to unregister';
      alert(message);
    }
  };

  const handleClearFilters = () => {
    setFilterSpecialty("");
    setFilterType("");
    setSortBy("scheduledAt");
  };

  if (selectedWebinar) {
    return <WebinarJoin meetingLink={selectedWebinar.meetingLink} onLeave={() => setSelectedWebinar(null)} />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, minHeight: "80vh" }}>
      <PageHeader
        title="Medical Webinars"
        subtitle="Join live clinical classes, AMAs, and interactive case discussions led by specialists."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Webinars" }]}
        action={
          canManageWebinars ? (
            <Button
              onClick={() => router.push('/webinars/create')}
              variant="contained"
              startIcon={<Plus size={18} />}
              sx={{ borderRadius: 3, fontWeight: 700 }}
            >
              Create Webinar
            </Button>
          ) : null
        }
      />

      {/* Tab selection */}
      <Tabs
        value={activeTab}
        onChange={(_, value) => {
          setActiveTab(value);
          setWebinars([]);
        }}
        sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Active Webinars" value="active" sx={{ fontWeight: 600 }} />
        <Tab label="Completed Webinars" value="completed" sx={{ fontWeight: 600 }} />
        <Tab label="Calendar View" value="calendar" sx={{ fontWeight: 600 }} />
      </Tabs>

      {/* Filters and Sorting Panel */}
      <Card sx={{ p: 3, borderRadius: 4, mb: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel id="specialty-filter-label">Specialty</InputLabel>
              <Select
                labelId="specialty-filter-label"
                value={filterSpecialty}
                label="Specialty"
                onChange={e => setFilterSpecialty(e.target.value)}
                startAdornment={<FilterListIcon sx={{ color: 'text.secondary', mr: 1 }} />}
              >
                <MenuItem value="">All Specialties</MenuItem>
                {specialtiesList.map(s => (
                  <MenuItem key={s} value={s}>{s.toUpperCase()}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel id="type-filter-label">Type</InputLabel>
              <Select
                labelId="type-filter-label"
                value={filterType}
                label="Type"
                onChange={e => setFilterType(e.target.value)}
                startAdornment={<FilterListIcon sx={{ color: 'text.secondary', mr: 1 }} />}
              >
                <MenuItem value="">All Types</MenuItem>
                {typesList.map(t => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel id="sort-by-label">Sort By</InputLabel>
              <Select
                labelId="sort-by-label"
                value={sortBy}
                label="Sort By"
                onChange={e => setSortBy(e.target.value)}
                startAdornment={<SortIcon sx={{ color: 'text.secondary', mr: 1 }} />}
              >
                <MenuItem value="scheduledAt">Date Scheduled</MenuItem>
                <MenuItem value="most_registered">Most Registered (Popular)</MenuItem>
                <MenuItem value="highest_rated">Highest Rated</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {(filterSpecialty || filterType || sortBy !== 'scheduledAt') && (
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" justifyContent="flex-end">
                <Button variant="text" onClick={handleClearFilters} sx={{ fontWeight: 600 }}>
                  Clear Filters
                </Button>
              </Stack>
            </Grid>
          )}
        </Grid>
      </Card>

      {/* Webinars List */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : webinars.length === 0 ? (
        <EmptyState
          icon={Video}
          title={activeTab === 'active' ? 'No active webinars' : 'No completed webinars'}
          description={activeTab === 'active' ? 'Upcoming expert sessions will appear here once they are scheduled.' : 'Completed webinar recordings and history will appear here.'}
          actionLabel="Reset Filters"
          onAction={handleClearFilters}
        />
      ) : activeTab === 'calendar' ? (
        <Card sx={{ p: 3, borderRadius: 4, border: '1px solid #e3eafc', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <Calendar
            localizer={localizer}
            events={webinars.map((w: any) => ({
              id: w._id,
              title: w.title,
              start: new Date(w.scheduledAt),
              end: new Date(new Date(w.scheduledAt).getTime() + (w.duration || 60) * 60 * 1000),
              resource: w,
            }))}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 650, fontFamily: 'inherit' }}
            onSelectEvent={(event) => {
              // Open a quick window for Google Calendar on click, or we could just open it directly
              const url = generateGoogleCalendarUrl(event.resource);
              window.open(url, '_blank');
            }}
          />
        </Card>
      ) : (
        <Grid container spacing={3}>
          {webinars.map((w) => {
            const expired = isWebinarExpired(w);
            const isRegistered = registeredWebinars.has(w._id);
            const canJoin = activeTab === 'active' && !expired && (w.status === 'live');
            const canRegister = activeTab === 'active' && !expired && w.status === 'scheduled' && !isRegistered;
            const canUnregister = activeTab === 'active' && !expired && w.status === 'scheduled' && isRegistered;

            const hostName = w.host 
              ? `${w.host.firstName || ''} ${w.host.lastName || ''}`.trim() 
              : 'Verified Specialist';

            return (
              <Grid size={{ xs: 12, md: 6 }} key={w._id}>
                <Card sx={{
                  borderRadius: 4,
                  border: '1px solid #e3eafc',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Chip
                        label={w.type?.toUpperCase()}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      />
                      <Stack direction="row" spacing={1}>
                        {isRegistered && (
                          <Chip label="Registered" color="success" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        )}
                        <Chip 
                          label={expired ? 'Completed' : w.status?.toUpperCase()} 
                          color={w.status === 'live' ? 'success' : 'default'}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </Stack>
                    </Stack>

                    <Typography variant="h6" fontWeight={800} color="#333" sx={{ mb: 1.5 }}>
                      {w.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 2.5
                    }}>
                      {w.description}
                    </Typography>

                    <Stack spacing={1.5} sx={{ mb: 3 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                        <PersonIcon sx={{ fontSize: 18 }} />
                        <Typography variant="caption">Host: <strong>{hostName}</strong></Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                        <CalendarTodayIcon sx={{ fontSize: 18 }} />
                        <Typography variant="caption">
                          {new Date(w.scheduledAt).toLocaleDateString()} at {new Date(w.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary' }}>
                        <AccessTimeIcon sx={{ fontSize: 18 }} />
                        <Typography variant="caption">Duration: <strong>{w.duration} mins</strong></Typography>
                      </Stack>
                    </Stack>

                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {!expired && (
                        <>
                          <Button
                            variant="outlined"
                            size="small"
                            color="info"
                            href={generateGoogleCalendarUrl(w)}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<CalendarIcon size={14} />}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                          >
                            Google
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="info"
                            href={generateOutlookCalendarUrl(w)}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<ExternalLink size={14} />}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                          >
                            Outlook
                          </Button>
                        </>
                      )}
                      {canJoin ? (
                        <Button variant="contained" color="primary" onClick={() => setSelectedWebinar(w)} sx={{ borderRadius: 2, px: 3, textTransform: 'none' }}>
                          Join Live
                        </Button>
                      ) : canRegister ? (
                        <Button variant="contained" color="success" onClick={() => handleRegister(w._id)} sx={{ borderRadius: 2, px: 3, textTransform: 'none' }}>
                          Register
                        </Button>
                      ) : canUnregister ? (
                        <Button variant="outlined" color="warning" onClick={() => handleUnregister(w._id)} sx={{ borderRadius: 2, px: 3, textTransform: 'none' }}>
                          Unregister
                        </Button>
                      ) : (
                        <Chip 
                          label={expired ? 'Closed' : 'Not Joinable'}
                          size="small" 
                          variant="outlined" 
                        />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}


