import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Avatar,
  Stack,
  Collapse,
  Modal,
  IconButton
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import CaseCard from '../../components/CaseCard';
import CaseFilters, { CaseFilterParams } from '../../components/CaseFilters';
import api from "../../utils/api";
import Link from "next/link";
import { canUser } from "../../utils/permissions";

import dynamic from 'next/dynamic';
const CaseDiscussion = dynamic(() => import('./[id]'), { ssr: false });

export default function Cases() {
  const [cases, setCases] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [openDiscussionId, setOpenDiscussionId] = useState<string | null>(null);
  const [canCreateCases, setCanCreateCases] = useState(false);
  const [filters, setFilters] = useState<CaseFilterParams>({ search: '', specialization: '', sortBy: 'newest' });

  const fetchCases = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.specialization) params.append("specialization", filters.specialization);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);

    api
      .get(`/cases?${params.toString()}`)
      .then((res) => {
        setCases(res.data.data.cases || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch cases");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCases();
  }, [filters]);

  useEffect(() => {
    api
      .get("/auth/profile")
      .then((res) => {
        const userType = res.data?.data?.user?.userType;
        setCanCreateCases(canUser(userType, "case:create"));
      })
      .catch(() => setCanCreateCases(false));
  }, []);

  if (loading) {
    return <CircularProgress />;
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography
          variant="h3"
          fontWeight={900}
          color="#1565c0"
          gutterBottom
          sx={{ letterSpacing: 1 }}
        >
          Medical Cases
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          mb={2}
          sx={{ fontSize: "1.15rem", fontWeight: 500 }}
        >
          Discover, review, and contribute to real-world medical cases. Dive
          into interactive case studies and expand your clinical knowledge.
        </Typography>
        {canCreateCases && (
          <Button
            variant="contained"
            color="primary"
            sx={{
              mb: 2,
              borderRadius: 3,
              fontWeight: 700,
              px: 4,
              py: 1.2,
              fontSize: "1.08rem",
              boxShadow: "0 2px 8px #2193b044",
              transition: "all 0.2s",
              "&:hover": {
                background: "#1565c0",
                boxShadow: "0 4px 16px #2193b066",
              },
            }}
            component={Link}
            href="/cases/create"
          >
            + Create New Case
          </Button>
        )}
      </Box>

      <CaseFilters 
        filters={filters} 
        onFilterChange={setFilters} 
        onClearFilters={() => setFilters({ search: '', specialization: '', sortBy: 'newest' })} 
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          animation: "fadeIn 1s",
        }}
      >
        {cases.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No cases found matching your filters.
            </Typography>
            <Button 
              variant="text" 
              color="primary" 
              onClick={() => setFilters({ search: '', specialization: '', sortBy: 'newest' })}
            >
              Clear Filters
            </Button>
          </Box>
        ) : (
          cases.map((c, i) => (
            <Card key={c._id} sx={{ borderRadius: 4, boxShadow: "0 2px 16px #2193b022", p: 0, overflow: "visible", animation: `slideUp 0.6s ${i * 0.1}s both` }}>
              <CardContent sx={{ pb: 2 }}>
                <CaseCard caseData={c}
                  onOpenDiscussion={() => setOpenDiscussionId(c._id)}
                  onReadMore={() => setExpanded(expanded === c._id ? null : c._id)}
                  isExpanded={expanded === c._id}
                />
                <Collapse in={expanded === c._id} timeout="auto" unmountOnExit>
                  <Box sx={{ mt: 2, mb: 1, p: 2, borderRadius: 3, bgcolor: "#f5fafd", boxShadow: "0 2px 12px #2193b022", border: "1px solid #e3eafc" }}>
                    <Typography variant="subtitle1" fontWeight={700} color="#1976d2" sx={{ mb: 1 }}>Full Description</Typography>
                    <Typography color="#333" fontSize={15} sx={{ whiteSpace: "pre-line" }}>{c.description || "No description."}</Typography>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          ))
        )}
        {/* Modal for Discussions */}
        <Modal open={!!openDiscussionId} onClose={() => setOpenDiscussionId(null)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ width: { xs: '98vw', sm: 600 }, maxHeight: '90vh', overflowY: 'auto', bgcolor: '#f8fafd', borderRadius: 4, boxShadow: 24, p: 2, position: 'relative' }}>
            <IconButton onClick={() => setOpenDiscussionId(null)} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
              <CloseIcon />
            </IconButton>
            {openDiscussionId && <CaseDiscussion id={openDiscussionId} modalMode hideDescription />}
          </Box>
        </Modal>
      </Box>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Container>
  );
}
