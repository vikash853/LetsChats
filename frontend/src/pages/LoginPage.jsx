import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [form,     setForm]     = useState({ email:"", password:"" });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError("Please fill all fields");
    setError(""); setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      login(data.token, data.user);
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}><span style={{fontSize:28}}>💬</span><h1 style={S.logoText}>LetsChats</h1></div>
        <h2 style={S.heading}>Welcome back!</h2>
        <p style={S.sub}>Sign in to continue to LetsChats</p>
        {error && <div style={S.error}>{error}</div>}
        <form onSubmit={handleSubmit} style={S.form}>
          <FInput label="Email address" type="email" value={form.email} placeholder="you@example.com"
            onChange={e=>setForm(p=>({...p,email:e.target.value}))}/>
          <div style={{position:"relative"}}>
            <FInput label="Password" type={showPass?"text":"password"} value={form.password} placeholder="••••••••"
              onChange={e=>setForm(p=>({...p,password:e.target.value}))}/>
            <button type="button" onClick={()=>setShowPass(v=>!v)}
              style={{position:"absolute",right:14,bottom:13,background:"none",border:"none",color:"rgba(255,255,255,.4)",cursor:"pointer",fontSize:16}}>
              {showPass?"🙈":"👁"}
            </button>
          </div>
          <button type="submit" disabled={loading} style={S.btn}>
            {loading?"Signing in…":"Sign in →"}
          </button>
        </form>
        <p style={S.link}>New to LetsChats? <Link to="/register" style={S.linkA}>Create account</Link></p>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');*{box-sizing:border-box}input:focus{border-color:rgba(99,102,241,.6)!important;box-shadow:0 0 0 3px rgba(99,102,241,.15)!important;outline:none}`}</style>
    </div>
  );
}

const FInput = ({label,...props}) => (
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,.45)",textTransform:"uppercase",letterSpacing:".08em"}}>{label}</label>
    <input {...props} style={{width:"100%",padding:"13px 16px",background:"rgba(255,255,255,.07)",border:"1.5px solid rgba(255,255,255,.12)",borderRadius:12,color:"#fff",fontSize:14,outline:"none",fontFamily:"inherit",transition:"border-color .2s,box-shadow .2s"}}/>
  </div>
);

const S = {
  page:    {minHeight:"100vh",background:"#07051a",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'DM Sans',sans-serif"},
  card:    {width:"100%",maxWidth:420,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:24,padding:"40px 32px",backdropFilter:"blur(20px)"},
  logo:    {display:"flex",alignItems:"center",gap:10,marginBottom:16},
  logoText:{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:"#fff",margin:0},
  heading: {fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:"#fff",margin:"0 0 4px"},
  sub:     {color:"rgba(255,255,255,.35)",fontSize:13,margin:"0 0 24px"},
  error:   {background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:10,padding:"10px 14px",color:"#fca5a5",fontSize:13,marginBottom:16},
  form:    {display:"flex",flexDirection:"column",gap:16},
  btn:     {width:"100%",padding:"14px",borderRadius:12,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,cursor:"pointer",marginTop:4},
  link:    {textAlign:"center",fontSize:13,color:"rgba(255,255,255,.35)",marginTop:20},
  linkA:   {color:"#a78bfa",textDecoration:"none",fontWeight:600},
};
