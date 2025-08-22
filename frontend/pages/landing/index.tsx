import React, { useState } from "react";
import { badges } from '../../utils/badges';
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Clock,
  MapPin,
  GraduationCap,
  Award,
  Phone,
  Mail,
  Paperclip,
} from "lucide-react";
import StarBorderIcon from '@mui/icons-material/StarBorder';

const VisibilityToggle = () => {
  const [isPublic, setIsPublic] = useState(true);
  const toggleVisibility = () => setIsPublic((prev) => !prev);
  return (
    <button
      onClick={toggleVisibility}
      style={{
        fontSize: "14px",
        color: isPublic ? "#065f46" : "#991b1b",
        background: isPublic ? "#bbf7d0" : "#fecaca",
        border: "1px solid",
        borderColor: isPublic ? "#34d399" : "#f87171",
        borderRadius: "6px",
        padding: "4px 10px",
        cursor: "pointer",
        transition: "all 0.3s ease",
      }}
    >
      {isPublic ? "🌍 Public" : "🔒 Private"}
    </button>
  );
};

const ProfileSidebar = () => {
  const [user, setUser] = React.useState<Doctor | null>(null);
  React.useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!userId) return;
    import('../../utils/api').then(apiModule => {
      apiModule.default.get(`/users/${userId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        // Ensure correct extraction of counts from backend response
        const userData = res.data?.data?.user || res.data?.user || res.data;
        setUser({
          ...userData,
          followersCount: userData.followersCount ?? (Array.isArray(userData.followers) ? userData.followers.length : undefined),
          followingCount: userData.followingCount ?? (Array.isArray(userData.following) ? userData.following.length : undefined),
        });
      });
    });
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "1px solid #f0f4f8",
        position: "sticky",
        top: 20,
        height: "fit-content",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
          height: 120,
          borderRadius: 12,
          position: "relative",
          marginBottom: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Heart size={30} color="white" />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: -40,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#e0f2fe",
            border: "4px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: "bold",
            color: "#0284c7",
          }}
        >
          {user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}` : 'DR'}
        </div>
      </div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#1e293b",
            margin: "0 0 8px 0",
          }}
        >
            {user ? `Dr. ${user.firstName} ${user.lastName}` : 'Loading...'}
        </h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
          {user ? user.specialization : ''}
        </p>
      </div>
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 24,
        marginBottom: 20,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0ea5e9" }}>
          {user?.followersCount ?? '...'}
        </div>
        <a href="/profile/connections" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: 12, color: "#64748b", cursor: 'pointer' }}>Followers</div>
        </a>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>
          {user?.followingCount ?? '...'}
        </div>
        <a href="/profile/connections" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: 12, color: "#64748b", cursor: 'pointer' }}>Following</div>
        </a>
      </div>
    </div>
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 14, color: "#64748b" }}>
          85% to next badge
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: 8,
          backgroundColor: "#e2e8f0",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "85%",
            height: "100%",
            background: "linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)",
            borderRadius: 4,
          }}
        ></div>
      </div>
    </div>
    <div style={{ marginBottom: 24 }}>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#1e293b",
          marginBottom: 12,
        }}
      >
        Badges & Achievements
      </h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        {badges.filter(b => b.unlocked).map((badge, idx) => (
          <div key={badge.id} style={{ position: 'relative', width: 60, height: 60 }}>
            <img
              src={badge.image.src}
              alt={badge.name}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                boxShadow: '0 2px 8px #2193b022',
                border: '2px solid #e0e7ef',
              }}
            />
          </div>
        ))}
      </div>
    </div>
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[
        {
        icon: <Heart size={16} color="#64748b" />,
        label: "Specialization:",
        value: user?.specialization || "N/A",
        },
        {
        icon: <MapPin size={16} color="#64748b" />,
        label: "Hospital:",
        value: user?.hospital || "N/A",
        },
        {
        icon: <GraduationCap size={16} color="#64748b" />,
        label: "Education:",
        value: user?.education || "N/A",
        },
        {
        icon: <MapPin size={16} color="#64748b" />,
        label: "Location:",
        value: user?.location || "N/A",
        },
        {
        icon: <Clock size={16} color="#64748b" />,
        label: "Experience:",
        value: user?.experience || "N/A",
        },
      ].map((item, idx) => (
        <div
        key={idx}
        style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
        {item.icon}
        <span style={{ fontSize: 14, color: "#64748b" }}>{item.label}</span>
        <span style={{ fontSize: 14, color: "#1e293b", fontWeight: 500 }}>
          {item.value}
        </span>
        </div>
      ))}
      </div>
    </div>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "#f8fafc",
        borderRadius: 12,
        marginBottom: 20,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#10b981" }}>
          4.9
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>Rating</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#0ea5e9" }}>
          2
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>Cases</div>
      </div>
    </div>
    <div>
      <h3
      style={{
        fontSize: 16,
        fontWeight: 600,
        color: "#1e293b",
        marginBottom: 12,
      }}
      >
      Contact
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Mail size={16} color="#64748b" />
        <span style={{ fontSize: 14, color: "#64748b" }}>
        {user?.email || "N/A"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Phone size={16} color="#64748b" />
        <span style={{ fontSize: 14, color: "#64748b" }}>
        {user?.phone || "N/A"}
        </span>
      </div>
      </div>
    </div>
  </div>
  );
}

const PostForm = () => {
  const [activeTab, setActiveTab] = useState("Case Study");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAttachClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (idx: number) => {
    setAttachedFiles((files) => files.filter((_, i) => i !== idx));
  };

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "1px solid #f0f4f8",
        marginBottom: 24,
      }}
    >
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: 20,
        }}
      >
        Post New
      </h2>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Announcement", "Case Study", "Research Paper", "Information"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border:
                    activeTab === tab
                      ? "2px solid #2193b0"
                      : "1px solid #e2e8f0",
                  background: activeTab === tab ? "linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)" : "#fff",
                  color: activeTab === tab ? "#fff" : "#64748b",
                  boxShadow: activeTab === tab ? "0 2px 8px #2193b044" : undefined,
                  fontSize: 14,
                  fontWeight: activeTab === tab ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {tab}
              </button>
            )
          )}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Title"
          value={postTitle}
          onChange={(e) => setPostTitle(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            fontSize: 14,
            marginBottom: 16,
            outline: "none",
            transition: "border-color 0.2s",
          }}
        />
        <textarea
          placeholder="Share your case study details, findings, and insights..."
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          style={{
            width: "100%",
            height: 120,
            padding: "12px 16px",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            fontSize: 14,
            resize: "vertical",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <VisibilityToggle />
          <Eye size={16} color="#64748b" />
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              marginLeft: 8,
              display: "flex",
              alignItems: "center",
            }}
            title="Attach files"
            onClick={handleAttachClick}
          >
            <Paperclip size={18} color="#64748b" />
          </button>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFilesChange}
          />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            style={{
              padding: "8px 16px",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              backgroundColor: "#fff",
              color: "#64748b",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Save as Draft
          </button>
          <button
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: 8,
              background: "linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Publish New
          </button>
        </div>
      </div>
      {attachedFiles.length > 0 && (
        <div style={{ marginTop: 12, marginBottom: 8 }}>
          <strong style={{ fontSize: 13, color: "#1e293b" }}>
            Attached Files:
          </strong>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {attachedFiles.map((file, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.name}
                </span>
                <button
                  style={{
                    background: "#ef4444",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 12,
                    padding: "2px 10px",
                    borderRadius: 6,
                    boxShadow: "0 1px 4px rgba(239,68,68,0.08)",
                    transition: "background 0.2s",
                  }}
                  title="Remove file"
                  onClick={() => handleRemoveFile(idx)}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#dc2626")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "#ef4444")
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const CaseStudyList = () => {
  const [studies, setStudies] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      import('../../utils/api').then(apiModule => {
        apiModule.default.get('/cases?limit=5',
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        )
          .then(res => {
            // Adjust according to your backend response structure
            // If your backend returns { data: { cases: [...] } }
            // setStudies(res.data.data.cases || []);
            // If your backend returns { data: [...] }
            setStudies(res.data?.data?.cases || res.data?.cases || res.data || []);
          })
          .catch(() => setStudies([]))
          .finally(() => setLoading(false));
      });
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "1px solid #f0f4f8",
        width: "100%",
        minWidth: 0,
        marginBottom: 24,
        boxSizing: "border-box",
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>
          Recent Case Studies
        </h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            style={{
              color: "#0ea5e9",
              fontSize: 14,
              fontWeight: 600,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Newest →
          </button>
          <button
            style={{
              color: "#10b981",
              fontSize: 14,
              fontWeight: 600,
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            View All
          </button>
        </div>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", color: "#64748b", padding: 24 }}>
          Loading case studies...
        </div>
      ) : (
        <RecentCaseStudies studies={studies} />
      )}
    </div>
  );
};

const RecentCaseStudies = ({ studies }: { studies: any[] }) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [activeCase, setActiveCase] = React.useState<any>(null);

  const handleOpenDiscussion = (study: any) => {
    setActiveCase(study);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setActiveCase(null);
  };
  if (!studies || studies.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#64748b", padding: 24 }}>
        No case studies found.
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {studies.filter(study => study._id).map((study, idx) => {
          return (
            <div
              key={study._id}
              style={{
                padding: 16,
                border: "1px solid #f1f5f9",
                borderRadius: 12,
                backgroundColor: "#fafbfc",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: "#e0f2fe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#0284c7",
                    flexShrink: 0,
                  }}
                >
                  {study.authorInitials ||
                    (study.doctor?.firstName && study.doctor?.lastName
                      ? `${study.doctor.firstName[0]}${study.doctor.lastName[0]}`
                      : "DR")}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#1e293b",
                          margin: "0 0 4px 0",
                        }}
                      >
                        {study.title}
                      </h3>
                      <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                        {study.date ||
                          study.createdAt?.slice(0, 10) ||
                          study.createdAt}
                      </p>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: "#374151",
                      margin: "0 0 12px 0",
                    }}
                  >
                    {study.description || study.content}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Heart size={16} color="#64748b" />
                      <span style={{ fontSize: 14, color: "#64748b" }}>
                        {Array.isArray(study.likes) ? study.likes.length : (typeof study.likes === 'number' ? study.likes : 0)}
                      </span>
                    </div>
                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                      onClick={() => handleOpenDiscussion(study)}
                      title="View and join discussion"
                    >
                      <MessageCircle size={16} color="#64748b" />
                      <span style={{ fontSize: 14, color: "#64748b" }}>
                        {Array.isArray(study.comments) ? study.comments.length : (typeof study.comments === 'number' ? study.comments : 0)}
                      </span>
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Share2 size={16} color="#64748b" />
                      <span style={{ fontSize: 14, color: "#64748b" }}>
                        {typeof study.shares === 'number' ? study.shares : (typeof study.shareCount === 'number' ? study.shareCount : 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Star rating for the case (right side) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <StarBorderIcon sx={{ fontSize: 22, color: study.ratedBy?.length > 0 ? '#ffd700' : '#bdbdbd' }} />
                <span style={{ fontSize: 15, color: '#64748b', fontWeight: 600 }}>{study.rating || 0}</span>
              </div>
            </div>
          );
        })}
      </div>
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(30,41,59,0.25)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 32,
              minWidth: 340,
              maxWidth: 480,
              boxShadow: "0 8px 32px rgba(30,41,59,0.12)",
              position: "relative",
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
                color: "#64748b",
              }}
              onClick={handleCloseModal}
              title="Close"
            >
              ×
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>
              Discussion: {activeCase?.title}
            </h2>
            <div style={{ marginBottom: 16, color: "#64748b", fontSize: 14 }}>
              {activeCase?.description || activeCase?.content}
            </div>
            <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 16 }}>
              {Array.isArray(activeCase?.comments) && activeCase.comments.length > 0 ? (
                activeCase.comments.map((comment: any, idx: number) => (
                  <div key={comment._id || idx} style={{ marginBottom: 12, padding: 8, background: "#f8fafc", borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, color: "#0284c7", marginBottom: 4 }}>
                      {comment.author?.firstName || "User"} {comment.author?.lastName || ""}
                    </div>
                    <div style={{ fontSize: 13, color: "#374151" }}>{comment.content}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: "#64748b", fontSize: 13 }}>No discussion yet.</div>
              )}
            </div>
            {/* Add reply box or actions here if needed */}
          </div>
        </div>
      )}
    </>
  );
};

const RecentUpdatesSection = () => (
  <div
    style={{
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 24,
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      border: "1px solid #f0f4f8",
      marginBottom: 24,
      boxSizing: "border-box",
      width: "100%",
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: 24,
    }}
  >
    <h3
      style={{
        fontSize: 18,
        fontWeight: 700,
        color: "#1e293b",
        marginBottom: 16,
      }}
    >
      Updates
    </h3>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
      <div
        style={{
          background: "#f8fafc",
          borderRadius: 12,
          padding: 18,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          border: "1px solid #e2e8f0",
          flex: 1,
          minWidth: 220,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h4
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#10b981",
              margin: 0,
            }}
          >
            Announcements
          </h4>
          <button
            style={{
              color: "#10b981",
              fontSize: 13,
              fontWeight: 600,
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            More
          </button>
        </div>
        <ul
          style={{ margin: 0, paddingLeft: 18, color: "#64748b", fontSize: 13 }}
        >
          <li>Webinar: Cardiac Imaging - Aug 25</li>
          <li>Badge Awarded: Top Contributor</li>
          <li>System Update: New Features Added</li>
        </ul>
      </div>
      <div
        style={{
          background: "#f8fafc",
          borderRadius: 12,
          padding: 18,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          border: "1px solid #e2e8f0",
          flex: 1,
          minWidth: 220,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h4
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#f59e0b",
              margin: 0,
            }}
          >
            Research Papers
          </h4>
          <button
            style={{
              color: "#f59e0b",
              fontSize: 13,
              fontWeight: 600,
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            More
          </button>
        </div>
        <ul
          style={{ margin: 0, paddingLeft: 18, color: "#64748b", fontSize: 13 }}
        >
          <li>Medical Journal: AI in Healthcare</li>
          <li>Conference: Global Health Summit</li>
          <li>Policy: New Guidelines Released</li>
        </ul>
      </div>
      <div
        style={{
          background: "#f8fafc",
          borderRadius: 12,
          padding: 18,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          border: "1px solid #e2e8f0",
          flex: 1,
          minWidth: 220,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <h4
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#0ea5e9",
              margin: 0,
            }}
          >
            Information
          </h4>
          <button
            style={{
              color: "#0ea5e9",
              fontSize: 13,
              fontWeight: 600,
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            More
          </button>
        </div>
        <ul
          style={{ margin: 0, paddingLeft: 18, color: "#64748b", fontSize: 13 }}
        >
          <li>Case study: Advances in Cardiology</li>
          <li>Research: New Drug Trials</li>
          <li>Discussion: Patient Care Best Practices</li>
        </ul>
      </div>
    </div>
  </div>
);

type Doctor = {
  _id: string;
  firstName?: string;
  lastName?: string;
  specialization?: string;
  email?: string;
  phone?: string;
  hospital?: string;
  education?: string;
  location?: string;
  experience?: string;
  followersCount?: number;
  followingCount?: number;
};

const RecommendedConnections = () => {
  const [following, setFollowing] = React.useState<string[]>([]);
  const [doctors, setDoctors] = React.useState<Doctor[]>([]);
  React.useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    import('../../utils/api').then(apiModule => {
      apiModule.default.get('/users/leaderboard?userType=doctor&limit=10')
        .then(res => {
          setDoctors(res.data.data.leaderboard || []);
        });
      if (token) {
        apiModule.default.get('/users/connections', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          setFollowing((res.data.following || []).map((u: any) => u._id));
        });
      }
    });
  }, []);
  const handleFollow = async (doctorId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    await import('../../utils/api').then(apiModule =>
      apiModule.default.post('/users/follow', { userId: doctorId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
    setFollowing((prev) => [...prev, doctorId]);
  };
  const handleUnfollow = async (doctorId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    await import('../../utils/api').then(apiModule =>
      apiModule.default.post('/users/unfollow', { userId: doctorId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
    setFollowing((prev) => prev.filter((id) => id !== doctorId));
  };
  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "1px solid #f0f4f8",
        marginBottom: 24,
        boxSizing: "border-box",
        width: "100%",
        minWidth: 0,
      }}
    >
      <h3
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#1e293b",
          marginBottom: 20,
        }}
      >
        Recommended Connections
      </h3>
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          gap: 16,
          paddingBottom: 8,
          scrollbarWidth: "thin",
          scrollbarColor: "#e0e8f0 #fff",
        }}
      >
        {doctors.slice(0, 5).map((doctor, idx) => {
          const isFollowing = following.includes(doctor._id);
          return (
            <div key={doctor._id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  minWidth: 180,
                  maxWidth: 220,
                  backgroundColor: "#fafbfc",
                  border: "1px solid #f1f5f9",
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  padding: "16px 12px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    backgroundColor: "#e0f2fe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#0284c7",
                    marginBottom: 8,
                  }}
                >
                  {doctor.firstName && doctor.lastName
                    ? `${doctor.firstName[0]}${doctor.lastName[0]}`
                    : doctor.firstName || doctor.lastName || "DR"}
                </div>
                <h4
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1e293b",
                    margin: "0 0 2px 0",
                  }}
                >
                  Dr. {doctor.firstName} {doctor.lastName}
                </h4>
                <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                  {doctor.specialization}
                </p>
                <button
                  style={{
                    width: "100%",
                    padding: "6px 12px",
                    backgroundColor: isFollowing ? "#64748b" : "#0284c7",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginTop: 8,
                  }}
                  onClick={async () => {
                    if (isFollowing) {
                      await handleUnfollow(doctor._id);
                    } else {
                      await handleFollow(doctor._id);
                    }
                  }}
                >
                  {isFollowing ? "Connected" : "Connect"}
                </button>
              </div>
              {idx === 4 && (
                <button
                  style={{
                    minWidth: 100,
                    height: 48,
                    alignSelf: "center",
                    background: "#e0e8f0",
                    color: "#1e293b",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    marginLeft: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                  title="Show more connections"
                >
                  More →
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Landing = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const notificationCategories = [
    { label: "All", count: 8 },
    { label: "Comments", count: 4 },
    { label: "Likes", count: 2 },
    { label: "Collaboration", count: 1 },
    { label: "Mentions", count: 1 },
  ];
  const notificationItems = [
    {
      category: "Comments",
      color: "#10b981",
      bg: "#f0fdf4",
      text: "Dr. Martinez replied to your comment on 'Pediatric Arrhythmia Case'",
      time: "2 min ago",
    },
    {
      category: "Collaboration",
      color: "#0ea5e9",
      bg: "#f0f9ff",
      text: "Dr. Loo sent you a collaboration request for cardiac research",
      time: "15 min ago",
    },
    {
      category: "Likes",
      color: "#f59e0b",
      bg: "#fffbeb",
      text: "Your case study received 25 new likes",
      time: "1 hour ago",
    },
  ];
  // Ref for PostForm height sync
  const postFormRef = React.useRef<HTMLDivElement>(null);
  const [postFormHeight, setPostFormHeight] = useState<number | undefined>(
    undefined
  );
  React.useEffect(() => {
    if (postFormRef.current) {
      setPostFormHeight(postFormRef.current.offsetHeight);
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 20 }}>
        <div className="landing-grid">
          <div className="landing-left">
            <ProfileSidebar />
          </div>
          <div
            className="landing-main"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              width: "100%",
              minWidth: 0,
            }}
          >
            <div ref={postFormRef}>
              <PostForm />
            </div>
            <div style={{ width: "100%", minWidth: 0 }}>
              <CaseStudyList />
              <RecentUpdatesSection />
              <RecommendedConnections />
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .landing-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
        }
        @media (max-width: 1200px) {
          .landing-grid {
            grid-template-columns: 280px 1fr;
          }
        }
        @media (max-width: 968px) {
          .landing-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .landing-left {
            order: 2;
          }
          .landing-main {
            order: 1;
          }
        }
        .landing-main {
          min-width: 0;
        }
        .landing-main > div {
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default Landing;
