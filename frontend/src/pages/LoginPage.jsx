import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  RecaptchaVerifier, signInWithPhoneNumber,
  GoogleAuthProvider, signInWithPopup,
} from "firebase/auth";
import { auth } from "../../services/firebaseConfig";
import { authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [tab,       setTab]       = useState("email");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [otpSent,   setOtpSent]   = useState(false);
  const [otp,       setOtp]       = useState(["","","","","",""]);
  const [phone,     setPhone]     = useState("");
  const [confirm,   setConfirm]   = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [form,      setForm]      = useState({ email:"", password:"" });
  const recaptchaRef  = useRef(null);
  const recaptchaInst = useRef(null);
  const otpRefs       = useRef([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const switchTab = (t) => { setTab(t); setError(""); setOtpSent(false); setOtp(["","","","","",""]); };

  // Email login
  const handleEmailLogin = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      login(data.token, data.user);
      navigate("/chat");
    } catch (err) { setError(err.response?.data?.message || "Login failed"); }
    finally { setLoading(false); }
  };

  // Phone OTP
  const setupRecaptcha = () => {
    if (!recaptchaInst.current) {
      recaptchaInst.current = new RecaptchaVerifier(auth, recaptchaRef.current, { size: "invisible", callback: () => {} });
    }
    return recaptchaInst.current;
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) { setError("Enter valid phone number"); return; }
    setError(""); setLoading(true);
    try {
      const verifier     = setupRecaptcha();
      const formatted    = phone.startsWith("+") ? phone : "+91" + phone;
      const confirmation = await signInWithPhoneNumber(auth, formatted, verifier);
      setConfirm(confirmation); setOtpSent(true); setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
      recaptchaInst.current = null;
    } finally { setLoading(false); }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleVerifyOTP = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Enter complete OTP"); return; }
    setError(""); setLoading(true);
    try {
      const result = await confirm.confirm(code);
      const { data } = await authAPI.firebaseLogin({
        firebaseUID: result.user.uid,
        phone: result.user.phoneNumber,
        method: "phone",
      });
      login(data.token, data.user);
      navigate("/chat");
    } catch { setError("Invalid OTP. Try again."); }
    finally { setLoading(false); }
  };

  // Google OAuth
  const handleGoogleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const { uid, email, displayName, photoURL } = result.user;
      const { data } = await authAPI.firebaseLogin({
        firebaseUID: uid, email, name: displayName, photo: photoURL, method: "google",
      });
      login(data.token, data.user);
      navigate("/chat");
    } catch (err) { setError(err.message || "Google login failed"); }
    finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <span style={{ fontSize: 28 }}>💬</span>
          <h1 style={S.logoText}>LetsChats</h1>
        </div>
        <p style={S.subtitle}>Sign in to continue</p>

        {/* Tabs */}
        <div style={S.tabs}>
          {[{id:"email",icon:"✉️",label:"Email"},{id:"phone",icon:"📱",label:"Phone"},{id:"google",icon:"G",label:"Google"}].map(t => (
            <button key={t.id} onClick={() => switchTab(t.id)}
              style={{...S.tab,...(tab===t.id?S.tabActive:{})}}>
              <span style={{fontSize: t.id==="google"?15:17}}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {error && <div style={S.error}>{error}</div>}
        <div ref={recaptchaRef}/>

        {/* Email */}
        {tab === "email" && (
          <form onSubmit={handleEmailLogin} style={S.form}>
            <FInput label="Email" type="email" value={form.email} placeholder="you@example.com"
              onChange={e => setForm(p=>({...p,email:e.target.value}))}/>
            <FInput label="Password" type="password" value={form.password} placeholder="••••••••"
              onChange={e => setForm(p=>({...p,password:e.target.value}))}/>
            <PrimaryBtn loading={loading}>Sign in</PrimaryBtn>
            <p style={S.link}>No account? <Link to="/register" style={S.linkA}>Register</Link></p>
          </form>
        )}

        {/* Phone */}
        {tab === "phone" && (
          <div style={S.form}>
            {!otpSent ? (
              <>
                <FInput label="Phone Number" type="tel" value={phone}
                  placeholder="+91 98765 43210" onChange={e => setPhone(e.target.value)}/>
                <p style={S.hint}>A 6-digit OTP will be sent via SMS</p>
                <PrimaryBtn loading={loading} onClick={handleSendOTP} type="button">Send OTP 📲</PrimaryBtn>
              </>
            ) : (
              <>
                <p style={S.otpLabel}>OTP sent to <strong style={{color:"#a78bfa"}}>{phone}</strong></p>
                <div style={S.otpRow}>
                  {otp.map((v,i) => (
                    <input key={i} ref={el => otpRefs.current[i]=el}
                      value={v} maxLength={1} inputMode="numeric"
                      onChange={e => handleOtpChange(e.target.value, i)}
                      onKeyDown={e => e.key==="Backspace"&&!v&&i>0&&otpRefs.current[i-1]?.focus()}
                      style={{...S.otpBox,...(v?S.otpFilled:{})}}/>
                  ))}
                </div>
                <PrimaryBtn loading={loading} onClick={handleVerifyOTP} type="button">Verify OTP ✓</PrimaryBtn>
                <button style={S.resendBtn} disabled={countdown>0}
                  onClick={()=>{setOtpSent(false);setOtp(["","","","","",""]);setCountdown(0);}}>
                  {countdown>0?`Resend in ${countdown}s`:"Resend OTP"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Google */}
        {tab === "google" && (
          <div style={S.form}>
            <p style={S.hint}>Sign in instantly with your Google account. No password needed.</p>
            <button onClick={handleGoogleLogin} disabled={loading} style={S.googleBtn}>
              {loading ? "Signing in…" : <><span style={S.gLetter}>G</span>Continue with Google</>}
            </button>
          </div>
        )}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        *{box-sizing:border-box}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0px 1000px #0f0d24 inset!important;-webkit-text-fill-color:#fff!important}
        input:focus{border-color:rgba(99,102,241,.6)!important;box-shadow:0 0 0 3px rgba(99,102,241,.15)!important}
      `}</style>
    </div>
  );
}

const FInput = ({label,...props}) => (
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,.45)",textTransform:"uppercase",letterSpacing:".08em"}}>{label}</label>
    <input {...props} style={{width:"100%",padding:"12px 16px",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",borderRadius:12,color:"#fff",fontSize:14,outline:"none",fontFamily:"'DM Sans',sans-serif",transition:"border-color .2s,box-shadow .2s"}}/>
  </div>
);

const PrimaryBtn = ({loading,children,...props}) => (
  <button {...props} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:12,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer",opacity:loading?.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"opacity .2s"}}>
    {loading?"Please wait…":children}
  </button>
);

const S = {
  page:      {minHeight:"100vh",background:"#07051a",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'DM Sans',sans-serif"},
  card:      {width:"100%",maxWidth:420,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:24,padding:"36px 32px",backdropFilter:"blur(20px)"},
  logo:      {display:"flex",alignItems:"center",gap:10,marginBottom:4},
  logoText:  {fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:"#fff",margin:0},
  subtitle:  {color:"rgba(255,255,255,.35)",fontSize:14,marginBottom:24,marginTop:4},
  tabs:      {display:"flex",gap:4,marginBottom:20,background:"rgba(255,255,255,.05)",borderRadius:12,padding:4},
  tab:       {flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"8px 4px",borderRadius:9,background:"transparent",border:"none",color:"rgba(255,255,255,.4)",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .2s"},
  tabActive: {background:"rgba(99,102,241,.25)",color:"#a78bfa"},
  error:     {background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:10,padding:"10px 14px",color:"#fca5a5",fontSize:13,marginBottom:12},
  form:      {display:"flex",flexDirection:"column",gap:16},
  hint:      {color:"rgba(255,255,255,.35)",fontSize:12,margin:0,lineHeight:1.6},
  link:      {textAlign:"center",fontSize:13,color:"rgba(255,255,255,.35)",margin:0},
  linkA:     {color:"#a78bfa",textDecoration:"none",fontWeight:600},
  otpLabel:  {color:"rgba(255,255,255,.5)",fontSize:13,margin:0},
  otpRow:    {display:"flex",gap:8,justifyContent:"center"},
  otpBox:    {width:44,height:52,textAlign:"center",fontSize:20,fontWeight:700,background:"rgba(255,255,255,.07)",border:"1.5px solid rgba(255,255,255,.15)",borderRadius:10,color:"#fff",outline:"none",transition:"border-color .2s"},
  otpFilled: {borderColor:"#6366f1",background:"rgba(99,102,241,.15)"},
  resendBtn: {background:"none",border:"none",color:"#a78bfa",fontSize:13,cursor:"pointer",textAlign:"center",padding:0,opacity:1},
  googleBtn: {width:"100%",padding:"13px",borderRadius:12,background:"#fff",border:"none",color:"#1a1a2e",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10},
  gLetter:   {fontWeight:900,fontSize:18,color:"#4285f4"},
};