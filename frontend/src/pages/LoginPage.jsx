/**
 * LoginPage — Simple email + password only
 * No OTP on login — user already verified at registration
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [form,    setForm]    = useState({ email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [showPass,setShowPass]= useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError("Please fill all fields");
    setError(""); setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      login(data.token, data.user);
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <span style={{fontSize:30}}>💬</span>
          <h1 style={S.logoText}>LetsChats</h1>
        </div>
        <p style={S.subtitle}>Welcome back! Sign in to continue.</p>

        {error && <div style={S.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.field}>
            <label style={S.label}>Email address</label>
            <input type="email" value={form.email} placeholder="you@example.com"
              onChange={e=>setForm(p=>({...p,email:e.target.value}))} style={S.input}/>
          </div>

          <div style={S.field}>
            <label style={S.label}>Password</label>
            <div style={{position:"relative"}}>
              <input type={showPass?"text":"password"} value={form.password}
                placeholder="••••••••"
                onChange={e=>setForm(p=>({...p,password:e.target.value}))}
                style={{...S.input,paddingRight:44}}/>
              <button type="button" onClick={()=>setShowPass(v=>!v)}
                style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"rgba(255,255,255,.4)",cursor:"pointer",fontSize:16}}>
                {showPass?"🙈":"👁"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={S.btn}>
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <p style={S.registerLink}>
          New to LetsChats?{" "}
          <Link to="/register" style={S.linkA}>Create account</Link>
        </p>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        *{box-sizing:border-box}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0px 1000px #0f0d24 inset!important;-webkit-text-fill-color:#fff!important}
        input:focus{border-color:rgba(99,102,241,.6)!important;box-shadow:0 0 0 3px rgba(99,102,241,.15)!important;outline:none}
      `}</style>
    </div>
  );
}

const S = {
  page:         {minHeight:"100vh",background:"#07051a",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'DM Sans',sans-serif"},
  card:         {width:"100%",maxWidth:420,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:24,padding:"40px 32px",backdropFilter:"blur(20px)"},
  logo:         {display:"flex",alignItems:"center",gap:10,marginBottom:6},
  logoText:     {fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:24,color:"#fff",margin:0},
  subtitle:     {color:"rgba(255,255,255,.35)",fontSize:14,marginBottom:28,marginTop:4},
  error:        {background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:10,padding:"10px 14px",color:"#fca5a5",fontSize:13,marginBottom:14},
  form:         {display:"flex",flexDirection:"column",gap:18},
  field:        {display:"flex",flexDirection:"column",gap:7},
  label:        {fontSize:11,fontWeight:600,color:"rgba(255,255,255,.45)",textTransform:"uppercase",letterSpacing:".08em"},
  input:        {width:"100%",padding:"13px 16px",background:"rgba(255,255,255,.07)",border:"1.5px solid rgba(255,255,255,.12)",borderRadius:12,color:"#fff",fontSize:14,outline:"none",fontFamily:"'DM Sans',sans-serif",transition:"border-color .2s,box-shadow .2s"},
  btn:          {width:"100%",padding:"14px",borderRadius:12,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,cursor:"pointer",marginTop:4},
  registerLink: {textAlign:"center",fontSize:13,color:"rgba(255,255,255,.35)",marginTop:20,marginBottom:0},
  linkA:        {color:"#a78bfa",textDecoration:"none",fontWeight:600},
};
