import React, { useState, useEffect } from 'react';
import { Button, Snackbar, Alert, Tooltip } from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';

interface OfflineSaveButtonProps {
  caseId: string;
  caseData: any;
}

export default function OfflineSaveButton({ caseId, caseData }: OfflineSaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    // Check if it's already cached
    if ('caches' in window) {
      caches.match(`/cases/${caseId}`).then((response) => {
        if (response) setIsSaved(true);
      });
    }
  }, [caseId]);

  const handleSaveOffline = async () => {
    if (!('caches' in window)) {
      setSnack({ open: true, message: 'Offline mode is not supported in this browser.', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const cache = await caches.open('medinternia-offline-cases');
      
      // Cache the API response data manually
      const apiResponse = new Response(JSON.stringify({ success: true, data: { case: caseData } }), {
        headers: { 'Content-Type': 'application/json' },
      });
      await cache.put(`/api/cases/${caseId}`, apiResponse);

      // Cache the HTML page itself (will trigger a network request to cache it)
      await cache.add(`/cases/${caseId}`);

      setIsSaved(true);
      setSnack({ open: true, message: 'Case saved for offline viewing!', severity: 'success' });
    } catch (error) {
      console.error('Failed to save offline:', error);
      setSnack({ open: true, message: 'Failed to save offline.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip title={isSaved ? "Saved Offline" : "Download for Offline Viewing"}>
        <span>
          <Button
            variant={isSaved ? "outlined" : "contained"}
            color={isSaved ? "success" : "secondary"}
            startIcon={isSaved ? <DownloadDoneIcon /> : <CloudDownloadIcon />}
            onClick={handleSaveOffline}
            disabled={loading || isSaved}
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: isSaved ? 0 : 3,
            }}
          >
            {loading ? 'Saving...' : isSaved ? 'Saved Offline' : 'Save Offline'}
          </Button>
        </span>
      </Tooltip>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
