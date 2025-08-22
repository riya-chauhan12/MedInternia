import React, { useState, useEffect } from 'react';
import {
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  MenuItem,
} from '@mui/material';
import ResearchPaperCard from '../../components/ResearchPaperCard';
import ResearchPaperDiscussion from '../../components/ResearchPaperDiscussion';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { useRouter } from 'next/router';
import api from '../../utils/api'; // Make sure this path matches your project structure

export default function ResearchPaperUpload() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    field: '',
    difficulty: 'beginner',
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openPaper, setOpenPaper] = useState<any>(null);
  const [openDiscussionId, setOpenDiscussionId] = useState<string | null>(null);
  const router = useRouter();

  // Fetch research papers on mount
  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/research-papers');
      setPapers(res.data);
    } catch (err) {
      setError('Failed to fetch research papers.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      // For now, just simulate file upload by sending file name as fileUrl
      // In production, you should upload the file and get a URL
      const payload = {
        title: form.title,
        description: form.description,
        field: form.field,
        difficulty: form.difficulty,
        fileUrl: file ? file.name : '',
      };
      await api.post('/research-papers', payload, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Research paper uploaded successfully!');
      setForm({ title: '', description: '', field: '', difficulty: 'beginner' });
      setFile(null);
      fetchPapers();
    } catch (err: any) {
      setError('Failed to upload research paper.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)', py: 6 }}>
      {/* Section header like cases */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography variant="h2" fontWeight={900} color="#3b5cb8" sx={{ mb: 1, letterSpacing: 1 }}>
          Research Papers
        </Typography>
        <Typography variant="h6" color="#555" sx={{ fontWeight: 400, mb: 2 }}>
          Discover, review, and contribute to medical research papers. Share your findings and expand the knowledge base.
        </Typography>
        <Button
          variant="contained"
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.2,
            fontWeight: 700,
            fontSize: '1.1rem',
            background: 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)',
            boxShadow: '0 4px 20px #2193b044',
            textTransform: 'none',
            mb: 2,
            '&:hover': {
              background: 'linear-gradient(90deg, #6dd5ed 0%, #2193b0 100%)',
            },
          }}
          onClick={() => {
            const formSection = document.getElementById('upload-research-paper-form');
            if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          + Upload New Paper
        </Button>
      </Box>
      {/* List of research papers */}
      <Box sx={{ maxWidth: 800, mx: 'auto', mb: 6 }}>
        {loading ? (
          <Typography align="center" color="text.secondary">Loading...</Typography>
        ) : papers.length === 0 ? (
          <Box sx={{ borderRadius: 4, boxShadow: '0 4px 24px #2193b022', mb: 3, bgcolor: '#fff', p: 3, textAlign: 'center' }}>
            <Typography fontWeight={700} fontSize={20} color="#1976d2">No research papers yet</Typography>
            <Typography fontSize={15} color="#888">Be the first to share a research paper with the community!</Typography>
          </Box>
        ) : (
          papers.map((paper) => (
            <ResearchPaperCard
              key={paper._id}
              paper={paper}
              onReadMore={() => setOpenPaper(paper)}
              onOpenDiscussion={(id: string) => setOpenDiscussionId(id)}
            />
          ))
        )}
      {/* Read More Modal */}
      <Dialog open={!!openPaper} onClose={() => setOpenPaper(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={800} color="#1565c0">{openPaper?.title}</DialogTitle>
        <DialogContent>
          <Typography color="#444" fontSize={16} sx={{ mb: 2, mt: 0.5, fontWeight: 400 }}>
            {openPaper?.description}
          </Typography>
          <Typography fontSize={15} color="#1976d2" mt={1}>
            Field: {openPaper?.field} | Difficulty: {openPaper?.difficulty}
          </Typography>
          {openPaper?.fileUrl && (
            <Button
              variant="outlined"
              sx={{ mt: 2, borderRadius: 3, fontWeight: 700, color: '#2193b0', borderColor: '#2193b0', background: '#f8fafd', '&:hover': { background: '#e3f2fd' } }}
              startIcon={<span style={{ display: 'flex', alignItems: 'center' }}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="#2193b0" d="M12 16.5a1 1 0 0 1-1-1V5a1 1 0 1 1 2 0v10.5a1 1 0 0 1-1 1Z"/><path fill="#2193b0" d="M7.21 13.79a1 1 0 0 1 1.42-1.42l2.29 2.3 2.29-2.3a1 1 0 1 1 1.42 1.42l-3 3a1 1 0 0 1-1.42 0l-3-3Z"/><path fill="#2193b0" d="M5 20a1 1 0 0 1 0-2h14a1 1 0 1 1 0 2H5Z"/></svg></span>}
              href={openPaper.fileUrl}
              download
              target="_blank"
            >
              Download PDF
            </Button>
          )}
        </DialogContent>
      </Dialog>
      {/* Discussions Modal (full-featured) */}
      <Dialog open={!!openDiscussionId} onClose={() => setOpenDiscussionId(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={800} color="#1565c0">Discussions</DialogTitle>
        <DialogContent>
          {openDiscussionId && <ResearchPaperDiscussion id={openDiscussionId} modalMode />}
        </DialogContent>
      </Dialog>
      </Box>
      {/* Upload form section */}
      <Box id="upload-research-paper-form" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Box sx={{
          p: 4,
          borderRadius: 4,
          minWidth: 350,
          maxWidth: 500,
          width: '100%',
          background: 'rgba(255,255,255,0.98)',
          boxShadow: '0 8px 32px 0 rgba(33,147,176,0.10)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 900, color: '#1565c0', letterSpacing: 1, zIndex: 1, position: 'relative' }}>
            <span style={{ color: '#2193b0', marginRight: 8, fontSize: 36, verticalAlign: 'middle' }}>📄</span>
            Upload Research Paper
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" mb={3} align="center" sx={{ fontSize: '1.12rem', fontWeight: 500 }}>
            Share medical research papers, guides, and reference materials to support the community.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <form onSubmit={handleSubmit} style={{ zIndex: 1, position: 'relative' }}>
            <TextField
              label="Title *"
              name="title"
              value={form.title}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              sx={{ bgcolor: '#f8fafd', borderRadius: 2 }}
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
              sx={{ bgcolor: '#f8fafd', borderRadius: 2 }}
            />
            <TextField
              label="Field *"
              name="field"
              value={form.field}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              sx={{ bgcolor: '#f8fafd', borderRadius: 2 }}
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
              sx={{ bgcolor: '#f8fafd', borderRadius: 2 }}
            >
              <MenuItem value="beginner">Beginner</MenuItem>
              <MenuItem value="intermediate">Intermediate</MenuItem>
              <MenuItem value="complex">Complex</MenuItem>
            </TextField>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mt: 2, mb: 2, fontWeight: 700, color: '#2193b0', borderColor: '#2193b0', borderRadius: 2, background: '#f8fafd', '&:hover': { background: '#e3f2fd' } }}
            >
              UPLOAD RESEARCH PAPER (PDF)
              <input type="file" hidden accept="application/pdf" onChange={handleFileChange} />
            </Button>
            {file && (
              <Box sx={{ mb: 2, color: '#1976d2', fontWeight: 600, fontSize: 15 }}>
                Selected file: {file.name}
              </Box>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                py: 1.3,
                fontWeight: 700,
                fontSize: '1.1rem',
                borderRadius: 3,
                boxShadow: '0 4px 20px 0 rgba(31, 38, 135, 0.10)',
                background: 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)',
                textTransform: 'none',
                letterSpacing: 1,
                '&:hover': {
                  background: 'linear-gradient(90deg, #6dd5ed 0%, #2193b0 100%)',
                },
              }}
            >
              📤 SUBMIT PAPER
            </Button>
          </form>
  </Box>
      </Box>
    </Box>
  );
}
