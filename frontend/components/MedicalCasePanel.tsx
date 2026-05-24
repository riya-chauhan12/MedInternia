import { useRouter } from "next/router";

const MedicalCasePanel = () => {
  const router = useRouter();

  return (
    <div
      style={{
        padding: "22px",
        lineHeight: "1.6",
      }}
    >
      <h1
        style={{
          marginBottom: "20px",
          fontSize: "24px",
          fontWeight: 700,
        }}
      >
        🩺 Medical Case
      </h1>

      {/* BADGES */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            background: "#dbeafe",
            color: "#2563eb",
            padding: "5px 12px",
            borderRadius: "20px",
            fontWeight: 600,
            fontSize: "12px",
          }}
        >
          🫁 Pulmonology
        </span>

        <span
          style={{
            background: "#fee2e2",
            color: "#dc2626",
            padding: "6px 14px",
            borderRadius: "20px",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          🔴 Urgent Case
        </span>
      </div>

      <p>
        <strong>Patient:</strong> Male, 45 years
      </p>

      <p>
        <strong>Chief Complaint:</strong> Persistent fever,
        chest pain, dry cough, and shortness of breath
        for the last 5 days.
      </p>

      <p>
        <strong>History:</strong> Chronic smoker for
        15 years with occasional alcohol consumption.
      </p>

      <p>
        <strong>Additional Description:</strong> The
        patient reports worsening breathing difficulty
        during mild physical activity and discomfort
        while lying flat.
      </p>

      {/* VITALS */}
      <div style={{ marginTop: "24px" }}>
        <h3 style={{ marginBottom: "10px" }}>
          📊 Vital Signs
        </h3>

        <ul style={{ paddingLeft: "20px" }}>
          <li>Temperature: 102°F</li>
          <li>Blood Pressure: 140/90 mmHg</li>
          <li>Heart Rate: 108 bpm</li>
          <li>Respiratory Rate: 24/min</li>
          <li>SpO₂: 91%</li>
        </ul>
      </div>

      {/* INVESTIGATIONS */}
      <div style={{ marginTop: "24px" }}>
        <h3 style={{ marginBottom: "10px" }}>
          🧪 Suggested Investigations
        </h3>

        <ul style={{ paddingLeft: "20px" }}>
          <li>Chest X-Ray</li>
          <li>CBC Test</li>
          <li>ECG</li>
          <li>CRP & ESR</li>
        </ul>
      </div>

      {/* QUESTION */}
      <div style={{ marginTop: "24px" }}>
        <h3 style={{ marginBottom: "10px" }}>
          ❓ Discussion Question
        </h3>

        <p>
          What could be the most likely diagnosis and
          immediate treatment approach for this patient?
        </p>
      </div>

      {/* BUTTON */}
      <button
        onClick={() => router.push("/landing")}
        style={{
          marginTop: "28px",
          padding: "12px 20px",
          border: "none",
          borderRadius: "12px",
          background: "#0ea5e9",
          color: "white",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "15px",
        }}
      >
        Exit Discussion
      </button>
    </div>
  );
};

export default MedicalCasePanel;