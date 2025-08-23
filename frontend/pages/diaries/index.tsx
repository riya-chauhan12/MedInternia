
import React, { useEffect, useState } from 'react';
// For rich text editor, install: npm install react-quill
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
import { FaPlusCircle, FaBookOpen, FaMedal } from 'react-icons/fa';
import Image from 'next/image';
import { getInternProfile, getInternCredits, getDiaries, createDiary, addDiaryEntry } from '../../utils/api';

// Type definitions
type InternProfile = {
  name: string;
  email: string;
  imageUrl?: string;
  badge?: string;
  credits: number;
  completion: number;
};

type DiaryEntry = {
  day: string;
  time: string;
  location: string;
  diseaseDescription: string;
  symptoms: string;
  doctorReference: string;
  imageUrl?: string;
  dataSource: string;
  gender: string;
  content: string;
  tags: string[];
  feedback?: string[];
  likes?: number;
  comments?: { user: string; text: string }[];
  symptomsChecklist?: string[];
};

type Diary = {
  id: string;
  title: string;
  entries: DiaryEntry[];
};

const DiariesPage: React.FC = () => {
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [showCreateEntry, setShowCreateEntry] = useState(false);
  const [showCreateDiary, setShowCreateDiary] = useState(false);
  const [newDiaryTitle, setNewDiaryTitle] = useState('');
  const [newEntryDay, setNewEntryDay] = useState('');
  const [newEntryTime, setNewEntryTime] = useState('');
  const [newEntryLocation, setNewEntryLocation] = useState('');
  const [newEntryDiseaseDescription, setNewEntryDiseaseDescription] = useState('');
  const [newEntrySymptoms, setNewEntrySymptoms] = useState('');
  const [newEntryDoctorReference, setNewEntryDoctorReference] = useState('');
  const [newEntryImageUrl, setNewEntryImageUrl] = useState('');
  const [newEntryDataSource, setNewEntryDataSource] = useState('');
  const [newEntryGender, setNewEntryGender] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryTags, setNewEntryTags] = useState<string[]>([]);
  const [newEntrySymptomsChecklist, setNewEntrySymptomsChecklist] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    // Hardcoded sample data for frontend testing
    setProfile({
      name: 'Dr. Anushka Verma',
      email: 'anushka.verma@medinternia.com',
      imageUrl: '/public/ram.jpg',
      badge: 'Verified Intern',
      credits: 120,
      completion: 80,
    });
    setCredits(120);
    setDiaries([
      {
        id: '1',
        title: 'Remote Internship at Rural Clinic',
        entries: [
          {
            day: '1',
            time: '08:30 AM',
            location: 'Rural Clinic, Village A',
            diseaseDescription: 'Fever, cough, dehydration',
            symptoms: 'High temperature, persistent cough, dry mouth',
            doctorReference: 'Dr. S. Kumar',
            imageUrl: '',
            dataSource: 'Clinic',
            gender: 'Female',
            content: 'Arrived at the rural clinic. Faced issues with limited medical supplies. Noticed common symptoms: fever, cough, and dehydration among patients.',
            tags: ['Fever', 'Rural Health'],
            feedback: ['Good observation. Try to note vital signs next time.'],
            likes: 2,
            comments: [{ user: 'Dr. R. Mehta', text: 'Well done!' }],
            symptomsChecklist: ['Fever', 'Cough', 'Dehydration'],
          },
          {
            day: '2',
            time: '09:00 AM',
            location: 'Village B',
            diseaseDescription: 'Malaria, skin infections',
            symptoms: 'Chills, rashes, itching',
            doctorReference: 'Dr. S. Kumar',
            imageUrl: '',
            dataSource: 'Clinic',
            gender: 'Male',
            content: 'Visited nearby villages. Area issues include lack of clean water and poor sanitation. Treated cases of malaria and skin infections.',
            tags: ['Malaria', 'Sanitation'],
            feedback: ['Document water sources next time.'],
            likes: 1,
            comments: [],
            symptomsChecklist: ['Chills', 'Rashes'],
          }
        ]
      },
      {
        id: '2',
        title: 'Urban Hospital Internship',
        entries: [
          {
            day: '1',
            time: '10:00 AM',
            location: 'City Hospital',
            diseaseDescription: 'Trauma, emergency cases',
            symptoms: 'Bleeding, fractures',
            doctorReference: 'Dr. R. Mehta',
            imageUrl: '',
            dataSource: 'Hospital',
            gender: 'Other',
            content: 'Orientation and introduction to hospital staff. Observed emergency cases and trauma patients.',
            tags: ['Trauma'],
            feedback: [],
            likes: 0,
            comments: [],
            symptomsChecklist: ['Bleeding', 'Fractures'],
          },
          {
            day: '2',
            time: '11:30 AM',
            location: 'City Hospital',
            diseaseDescription: 'Respiratory diseases',
            symptoms: 'Cough, shortness of breath',
            doctorReference: 'Dr. R. Mehta',
            imageUrl: '',
            dataSource: 'Hospital',
            gender: 'Female',
            content: 'Assisted in outpatient department. Noted high incidence of respiratory diseases due to pollution.',
            tags: ['Respiratory'],
            feedback: ['Track pollution data for correlation.'],
            likes: 3,
            comments: [{ user: 'Peer Intern', text: 'Interesting data!' }],
            symptomsChecklist: ['Cough', 'Shortness of breath'],
          }
        ]
      }
    ]);
  }, []);

  const handleCreateDiary = async () => {
    if (!newDiaryTitle) return;
    const diary: Diary = await createDiary(newDiaryTitle);
    setDiaries([...diaries, { ...diary, entries: [] }]);
    setShowCreateDiary(false);
    setNewDiaryTitle('');
  };

  const handleAddEntry = async () => {
    if (!selectedDiary || !newEntryDay || !newEntryTime || !newEntryLocation || !newEntryDiseaseDescription || !newEntrySymptoms || !newEntryDoctorReference || !newEntryDataSource || !newEntryGender || !newEntryContent) return;
    const entry: DiaryEntry = {
      day: newEntryDay,
      time: newEntryTime,
      location: newEntryLocation,
      diseaseDescription: newEntryDiseaseDescription,
      symptoms: newEntrySymptoms,
      doctorReference: newEntryDoctorReference,
      imageUrl: newEntryImageUrl,
      dataSource: newEntryDataSource,
      gender: newEntryGender,
      content: newEntryContent,
      tags: newEntryTags,
      symptomsChecklist: newEntrySymptomsChecklist,
    };
    setDiaries(
      diaries.map(d =>
        d.id === selectedDiary.id
          ? { ...d, entries: [...d.entries, entry] }
          : d
      )
    );
    setSelectedDiary({ ...selectedDiary, entries: [...selectedDiary.entries, entry] });
    setNewEntryDay('');
    setNewEntryTime('');
    setNewEntryLocation('');
    setNewEntryDiseaseDescription('');
    setNewEntrySymptoms('');
    setNewEntryDoctorReference('');
    setNewEntryImageUrl('');
    setNewEntryDataSource('');
    setNewEntryGender('');
    setNewEntryContent('');
  };


  return (
    <>
      <style>{`
        .med-blue {
          color: #3fdde6ff !important;
        }
        .med-bg {
          background: #fafdff;
        }
        .med-border {
          border-color: #e3eafe !important;
        }
        .med-btn, .med-btn:visited {
          background: #3fdde6ff !important;
          color: #fff !important;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          box-shadow: 0 2px 8px #e3eafe;
          transition: background 0.3s, color 0.3s, box-shadow 0.3s;
          cursor: pointer;
        }
        .med-btn:hover {
          background: #2bb8c2 !important;
          color: #eaf2fb !important;
          box-shadow: 0 4px 16px #3fdde655;
        }
        .med-btn-outline {
          background: #fff !important;
          color: #3fdde6ff !important;
          border: 2px solid #3fdde6ff !important;
          border-radius: 12px;
          font-weight: 700;
          font-size: 16px;
          transition: background 0.3s, color 0.3s, border 0.3s;
        }
        .med-btn-outline:hover {
          background: #fafdff !important;
          color: #2bb8c2 !important;
          border: 2px solid #2bb8c2 !important;
        }
        .med-card {
          background: #fff !important;
          border: 1.5px solid #e3eafe !important;
          border-radius: 18px;
          box-shadow: 0 2px 12px #e3eafe;
          transition: box-shadow 0.3s, border 0.3s;
        }
        .med-card:hover {
          box-shadow: 0 4px 24px #3fdde655;
          border: 1.5px solid #3fdde6ff !important;
        }
        .med-section {
          background: #fafdff;
          border-radius: 24px;
          box-shadow: 0 2px 16px #e3eafe;
          border: 1.5px solid #e3eafe;
          padding: 2.5rem 2rem;
          max-width: 900px;
          margin: 0 auto;
        }
      `}</style>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fafdff 60%, #eaf2fb 100%)', padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
        <div className="med-section">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
            <button className="med-btn" style={{ padding: '10px 32px', fontSize: 18, letterSpacing: 1 }} onClick={() => setShowCreateDiary(true)}>
              + Create Diary
            </button>
          </div>
          <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }} className="med-blue">
            <FaBookOpen style={{ color: '#3fdde6ff' }} /> Daily Diaries
          </h1>
        {/* Create Diary Popup */}
        {showCreateDiary && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCreateDiary(false)}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 32, minWidth: 350, maxWidth: 500, boxShadow: '0 4px 24px #b3c6e0', position: 'relative' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontWeight: 700, fontSize: 22, color: '#74a9bf', marginBottom: 18 }}>Create New Diary</h3>
              <div style={{ width: '100%' }}>
                <input type="text" placeholder="Diary Title" value={newDiaryTitle} onChange={e => setNewDiaryTitle(e.target.value)} style={{ width: '100%', marginBottom: 16, padding: 10, borderRadius: 8, border: '1px solid #b3c6e0', fontSize: 15 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 8, width: '100%' }}>
                <button onClick={() => { handleCreateDiary(); setShowCreateDiary(false); }} className="med-btn" style={{ fontSize: 17, padding: '10px 32px' }}>Create</button>
                <button onClick={() => setShowCreateDiary(false)} className="med-btn-outline" style={{ fontSize: 17, padding: '10px 32px' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {/* Profile Card */}
        {profile && (
          <div className="med-card" style={{ padding: 24, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }} className="med-blue">{profile.name} <span style={{ background: '#e3eafe', color: '#74a9bf', borderRadius: 8, padding: '2px 8px', fontSize: 13, marginLeft: 8 }}>{profile.badge}</span></div>
              <div style={{ color: '#555', fontSize: 15, marginBottom: 2 }}>{profile.email}</div>
              <div style={{ color: '#74a9bf', fontSize: 15, fontWeight: 600, marginBottom: 2 }}><FaBookOpen style={{ marginRight: 4, fontSize: 15, verticalAlign: 'middle', color: '#74a9bf' }} /> Credits: {profile.credits}</div>
              <div style={{ marginTop: 12, fontSize: 14, color: '#74a9bf', fontWeight: 500 }}>Internship Completion</div>
              <div style={{ width: '100%', background: '#e3eafe', borderRadius: 8, height: 8, margin: '6px 0' }}>
                <div style={{ width: `${profile.completion}%`, background: '#74a9bf', height: 8, borderRadius: 8, transition: 'width 0.5s' }}></div>
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Stats: Diaries: {diaries.length}, Days Logged: {diaries.reduce((a, d) => a + d.entries.length, 0)}, Avg Entries/Week: {Math.round(diaries.reduce((a, d) => a + d.entries.length, 0) / 2)}</div>
            </div>
            <div style={{ display: 'flex', gap: 18 }}>
              <div className="med-card" style={{ padding: 18, minWidth: 90, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <FaBookOpen size={28} color="#74a9bf" style={{ marginBottom: 6 }} />
                <span className="med-blue" style={{ fontWeight: 700, fontSize: 15 }}>7 days</span>
                <span style={{ color: '#888', fontSize: 13 }}>Streak</span>
              </div>
              <div className="med-card" style={{ padding: 18, minWidth: 90, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <FaBookOpen size={28} color="#74a9bf" style={{ marginBottom: 6 }} />
                <span className="med-blue" style={{ fontWeight: 700, fontSize: 15 }}>#3</span>
                <span style={{ color: '#888', fontSize: 13 }}>Leaderboard</span>
              </div>
              <div className="med-card" style={{ padding: 18, minWidth: 90, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <FaPlusCircle size={28} color="#74a9bf" style={{ marginBottom: 6 }} />
                <span className="med-blue" style={{ fontWeight: 700, fontSize: 15 }}>+10</span>
                <span style={{ color: '#888', fontSize: 13 }}>Credits</span>
              </div>
            </div>
          </div>
        )}
        {/* Search & Export */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 12 }}>
          <input type="text" placeholder="Search diaries, tags, symptoms..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1.5px solid #74a9bf', fontSize: 15, background: '#f7faff', transition: 'border 0.3s' }} />
          <button className="med-btn" type="button">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M5 20h14v-2H5v2zm7-18C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10c0-5.52-4.48-10-10-10zm1 15h-2v-6H8l4-4 4 4h-3v6z"/></svg> Export PDF
          </button>
        </div>
    {/* Leaderboard section removed as requested */}
        {/* Diaries Timeline */}
  <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }} className="med-blue"><FaBookOpen style={{ color: '#3fdde6ff' }} /> Diaries Timeline</h2>
        {diaries.map((diary) => (
          <div key={diary.id} className="med-card" style={{ padding: 22, marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6, color: '#222' }} className="med-blue">{diary.title}</div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
              {diary.entries.map((entry, i) => (
                <button
                  key={i}
                  className="med-btn-outline"
                  style={{ padding: '8px 20px', fontWeight: 700, fontSize: 15, minWidth: 80, cursor: 'pointer', boxShadow: '0 1px 6px #e3eafe' }}
                  onClick={() => setSelectedEntry(entry)}
                >
                  Day {entry.day}
                </button>
              ))}
            </div>
            <button
              className="med-btn"
              style={{ marginTop: 4, padding: '8px 28px', alignSelf: 'flex-end', boxShadow: '0 1px 6px #e3eafe' }}
              onClick={() => setShowCreateEntry(true)}
            >
              + Add Entry
            </button>
          </div>
        ))}
      {/* Entry Details Popup */}
      {selectedEntry && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedEntry(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, minWidth: 350, maxWidth: 500, boxShadow: '0 4px 24px #b3c6e0', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, fontSize: 22, color: '#2456e0', marginBottom: 12 }}>Day {selectedEntry.day} Details</h3>
            <div style={{ color: '#333', fontSize: 15 }}><b>Time:</b> {selectedEntry.time}</div>
            <div style={{ color: '#333', fontSize: 15 }}><b>Location:</b> {selectedEntry.location}</div>
            <div style={{ color: '#333', fontSize: 15 }}><b>Disease Description:</b> {selectedEntry.diseaseDescription}</div>
            <div style={{ color: '#333', fontSize: 15 }}><b>Symptoms:</b> {selectedEntry.symptoms}</div>
            <div style={{ color: '#333', fontSize: 15 }}><b>Tags:</b> {selectedEntry.tags?.join(', ')}</div>
            <div style={{ color: '#333', fontSize: 15 }}><b>Doctor Reference:</b> {selectedEntry.doctorReference}</div>
            <div style={{ color: '#333', fontSize: 15 }}><b>Gender:</b> {selectedEntry.gender}</div>
            <div style={{ color: '#333', fontSize: 15 }}><b>Data Source:</b> {selectedEntry.dataSource}</div>
            <div style={{ color: '#333', fontSize: 15 }}><b>Symptom Checklist:</b> {selectedEntry.symptomsChecklist?.join(', ')}</div>
            {selectedEntry.imageUrl && (
              <div style={{ margin: '8px 0' }}>
                <Image src={selectedEntry.imageUrl} alt="Entry Image" width={120} height={80} style={{ borderRadius: 8 }} />
              </div>
            )}
            <div style={{ marginTop: 8, color: '#333', fontSize: 15 }}><b>Notes:</b> {selectedEntry.content}</div>
            <div style={{ marginTop: 8 }}>
              <b>Mentor Feedback:</b>{' '}
              {selectedEntry.feedback?.map((f, i) => (
                <span key={i} style={{ background: '#e0f7fa', color: '#2456e0', borderRadius: 8, padding: '2px 8px', marginRight: 6 }}>{f}</span>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <b>Likes:</b> {selectedEntry.likes || 0} <b>Comments:</b> {selectedEntry.comments?.length || 0}
              <div style={{ marginTop: 4 }}>
                {selectedEntry.comments?.map((c, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#555', marginBottom: 2 }}><b>{c.user}:</b> {c.text}</div>
                ))}
              </div>
            </div>
            <button onClick={() => setSelectedEntry(null)} style={{ marginTop: 18, background: '#2456e0', color: '#fff', fontWeight: 600, fontSize: 16, borderRadius: 8, padding: '8px 22px', border: 'none', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}

      {/* Add Entry Popup */}
      {showCreateEntry && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCreateEntry(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, minWidth: 350, maxWidth: 500, boxShadow: '0 4px 24px #b3c6e0', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, fontSize: 22, color: '#2456e0', marginBottom: 18 }}>Add Entry</h3>
            <div style={{ width: '100%' }}>
              <input type="text" placeholder="Day (e.g. 1, 2, 3)" value={newEntryDay} onChange={e => setNewEntryDay(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid #b3c6e0', fontSize: 15 }} />
              <input type="text" placeholder="Time (e.g. 08:30 AM)" value={newEntryTime} onChange={e => setNewEntryTime(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid #b3c6e0', fontSize: 15 }} />
              <input type="text" placeholder="Location Description" value={newEntryLocation} onChange={e => setNewEntryLocation(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid #b3c6e0', fontSize: 15 }} />
              <input type="text" placeholder="Disease Description" value={newEntryDiseaseDescription} onChange={e => setNewEntryDiseaseDescription(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid #b3c6e0', fontSize: 15 }} />
              <input type="text" placeholder="Symptoms" value={newEntrySymptoms} onChange={e => setNewEntrySymptoms(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid #b3c6e0', fontSize: 15 }} />
              <input type="text" placeholder="Doctor Reference" value={newEntryDoctorReference} onChange={e => setNewEntryDoctorReference(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid #b3c6e0', fontSize: 15 }} />
              <input type="text" placeholder="Image URL (optional)" value={newEntryImageUrl} onChange={e => setNewEntryImageUrl(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid #b3c6e0', fontSize: 15 }} />
              <input type="text" placeholder="Data Source (Hospital, NGO, etc.)" value={newEntryDataSource} onChange={e => setNewEntryDataSource(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid #b3c6e0', fontSize: 15 }} />
              <input type="text" placeholder="Gender (Male, Female, Other, Custom)" value={newEntryGender} onChange={e => setNewEntryGender(e.target.value)} style={{ width: '100%', marginBottom: 12, padding: 10, borderRadius: 8, border: '1px solid #b3c6e0', fontSize: 15 }} />
              <textarea placeholder="Notes / Additional Details" value={newEntryContent} onChange={e => setNewEntryContent(e.target.value)} style={{ width: '100%', marginBottom: 12, minHeight: 80, padding: 10, borderRadius: 8, border: '1px solid #b3c6e0', fontSize: 15 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 8, width: '100%' }}>
              <button onClick={() => { handleAddEntry(); setShowCreateEntry(false); }} style={{ background: '#2456e0', color: '#fff', fontWeight: 700, fontSize: 17, borderRadius: 8, padding: '10px 32px', border: 'none', boxShadow: '0 2px 8px #b3c6e0', cursor: 'pointer', transition: 'background 0.2s' }}>Add Entry</button>
              <button onClick={() => { setShowCreateEntry(false); }} style={{ background: '#eaf2fb', color: '#2456e0', fontWeight: 700, fontSize: 17, borderRadius: 8, padding: '10px 32px', border: 'none', boxShadow: '0 2px 8px #b3c6e0', cursor: 'pointer', transition: 'background 0.2s' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
        {/* Charts & Analytics Placeholder */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px #e3eafe', padding: 24, marginTop: 32, border: '1.5px solid #e3eafe' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#2456e0', marginBottom: 8 }}>Charts & Analytics (Coming Soon)</div>
          <div style={{ color: '#888', fontSize: 15 }}>Symptom trends, location-based health issues, etc.</div>
        </div>
  {/* Removed bottom Create button as requested */}
      </div>
      </div>
    </>
  );
};

export default DiariesPage;
