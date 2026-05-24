import MedicalCasePanel from "./MedicalCasePanel";
import DiscussionChat from "./DiscussionChat";

const CaseDiscussionPage = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef4fb",
        padding: "40px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "95%",
          maxWidth: "1350px",
          height: "85vh",
          background: "white",
          borderRadius: "24px",
          display: "flex",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        {/* LEFT SIDE */}
        <div
          style={{
            width: "42%",
            borderRight: "1px solid #e5e7eb",
            overflowY: "auto",
            background: "#f9fcff",
          }}
        >
          <MedicalCasePanel />
        </div>

        {/* RIGHT SIDE */}
        <div
          style={{
            width: "58%",
            overflow: "hidden",
          }}
        >
          <DiscussionChat />
        </div>
      </div>
    </div>
  );
};

export default CaseDiscussionPage;