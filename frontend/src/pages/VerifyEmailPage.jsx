import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmailPage() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [status,  setStatus]  = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setStatus("error"); setMessage("Invalid verification link."); return; }
    authAPI.verifyEmail(token)
      .then(({ data }) => {
        setStatus("success");
        setMessage(data.message);
        if (data.token && data.user) {
          login(data.token, data.user);
          setTimeout(() => navigate("/"), 2000);
        }
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed. Please try again.");
      });
  }, []);

  return (
    <div style={{minHeight:"100vh",background:"#07051a",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{width:"100%",maxWidth:420,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:24,padding:"48px 32px",textAlign:"center",color:"#fff"}}>
        <div style={{fontSize:52,marginBottom:20}}>
          {status==="loading"?"⏳":status==="success"?"✅":"❌"}
        </div>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,margin:"0 0 12px"}}>
          {status==="loading"?"Verifying your email…":status==="success"?"Email Verified!":"Verification Failed"}
        </h2>
        <p style={{color:"rgba(255,255,255,.5)",fontSize:14,lineHeight:1.7,margin:"0 0 24px"}}>{message}</p>
        {status==="success" && <p style={{color:"rgba(255,255,255,.3)",fontSize:12}}>Redirecting to chat…</p>}
        {status==="error" && (
          <button onClick={()=>navigate("/register")}
            style={{padding:"12px 28px",borderRadius:12,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer"}}>
            Register again
          </button>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');*{box-sizing:border-box}`}</style>
    </div>
  );
}
