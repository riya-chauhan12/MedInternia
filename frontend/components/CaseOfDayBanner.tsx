import { useRouter } from "next/router";

const CaseOfDayBanner = () => {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push("/case-of-the-day")}
      style={{
        marginBottom: "18px",
        padding: "16px 20px",
        background: "linear-gradient(90deg, #0ea5e9, #38bdf8)",
        borderRadius: "16px",
        color: "white",
        fontWeight: 600,
        fontSize: "16px",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        transition: "0.3s ease",
      }}
    >
      🔬 Case of the Day — Join Live Discussion →
    </div>
  );
};

export default CaseOfDayBanner;