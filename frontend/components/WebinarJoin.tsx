import React from 'react';

export default function WebinarJoin({ meetingLink, onLeave }: { meetingLink: string, onLeave: () => void }) {
  return (
    <div style={{
      width: '100%',
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      background: 'linear-gradient(120deg, #e0eafc 0%, #f8f9fa 100%)',
      borderRadius: 16,
      boxShadow: '0 2px 16px #2193b044',
      padding: '32px 0px',
      position: 'relative'
    }}>
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 32px',
        marginBottom: 16
      }}>
        <h2 style={{ fontWeight: 900, color: '#1565c0', margin: 0, fontSize: 28, letterSpacing: 1 }}>Live Webinar</h2>
        <button
          style={{
            padding: '10px 28px',
            fontWeight: 700,
            fontSize: 17,
            borderRadius: 8,
            background: 'linear-gradient(90deg, #1976d2 60%, #2193b0 100%)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px #2193b044',
            transition: 'all 0.2s',
            marginLeft: 16
          }}
          onClick={onLeave}
        >
          Leave Meeting
        </button>
      </div>
      <div style={{
        width: '96%',
        height: '70vh',
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 2px 12px #2193b022',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <iframe
          src={meetingLink}
          allow="camera; microphone; fullscreen; display-capture"
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
          title="Jitsi Webinar"
        />
      </div>
    </div>
  );
}
