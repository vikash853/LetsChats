/**
 * RegisterPage — 3 steps:
 * Step 1: Fill form (username, email, password)
 * Step 2: Choose verification — Phone OTP or Google
 * Step 3: Verified → account created → redirect to chat
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  RecaptchaVerifier, signInWithPhoneNumber,
  GoogleAuthProvider, signInWithPopup,
} from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const STEPS = { FORM: 1, VERIFY: 2, OTP: 3 };

export default function RegisterPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [step,      setStep]      = useState(STEPS.FORM);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [method,    setMethod]    = useState(""); // "phone" | "google"
  const [phone,     setPhone]     = useState("");
  const [otp,       setOtp]       = useState(["","","","","",""]);
  const [confirm,   setConfirm]   = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [form,      setForm]      = useState({
    username: "", email: "", password: "", confirmPassword: "",
  });

  const recaptchaRef  = useRef(null);
  const recaptchaInst = useRef(null);
  const otpRefs       = useRef([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Step 1: Validate form ──────────────────────────────────
  const handleFormNext = (e) => {
    e.preventDefault();
    setError("");
    if (!form.username.trim() || form.username.length < 2)
      return setError("Username must be at least 2 characters");
    if (!form.email.includes("@"))
      return setError("Enter a valid email");
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match");
    setStep(STEPS.VERIFY);
  };

  // ── Step 2: Choose method ──────────────────────────────────
  const handleGoogleVerify = async () => {
    setError(""); setLoading(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const { uid, email, displayName } = result.user;
      // Register with Google verification
      const { data } = await authAPI.register({
        username:    form.username,
        email:       form.email || email,
        password:    form.password,
        firebaseUID: uid,
        authMethod:  "google",
        verified:    true,
      });
      login(data.token, data.user);
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Google verification failed");
    } finally { setLoading(false); }
  };

  // ── Step 2→3: Send phone OTP ───────────────────────────────
  const setupRecaptcha = () => {
    if (!recaptchaInst.current) {
      recaptchaInst.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
        size: "invisible", callback: () => {},
      });
    }
    return recaptchaInst.current;
  };

  const handleSendOTP = async () => {
    if (!phone || phone.replace(/\D/g,"").length < 10)
      return setError("Enter valid phone number");
    setError(""); setLoading(true);
    try {
      const verifier    = setupRecaptcha();
      const formatted   = phone.startsWith("+") ? phone : "+91" + phone.replace(/\D/g,"");
      const confirmation = await signInWithPhoneNumber(auth, formatted, verifier);
      setConfirm(confirmation);
      setStep(STEPS.OTP);
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
      recaptchaInst.current = null;
    } finally { setLoading(false); }
  };

  // ── Step 3: Verify OTP → Register ─────────────────────────
  const handleVerifyOTP = async () => {
    const code = otp.join("");
    if (code.length < 6) return setError("Enter complete 6-digit OTP");
    setError(""); setLoading(true);
    try {
      const result = await confirm.confirm(code);
      // OTP verified → now register account
      const { data } = await authAPI.register({
        username:    form.username,
        email:       form.email,
        password:    form.password,
        phone:       result.user.phoneNumber,
        firebaseUID: result.user.uid,
        authMethod:  "phone",
        verified:    true,
      });
      login(data.token, data.user);
      navigate("/chat");
    } catch (err) {
      if (err.code === "auth/invalid-verification-code")
        setError("Wrong OTP. Please try again.");
      else
        setError(err.response?.data?.message || "Verification failed");
    } finally { setLoading(false); }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val.slice(-1); setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* Logo */}
        <div style={S.logo}>
          <span style={{fontSize:28}}>💬</span>
          <h1 style={S.logoText}>LetsChats</h1>
        </div>

        {/* Progress bar */}
        <div style={S.progress}>
          {[1,2,3].map(n => (
            <div key={n} style={{...S.dot, ...(step >= n ? S.dotActive : {})}}>
              {step > n ? "✓" : n}
            </div>
          ))}
          <div style={{...S.progressLine, width: step === 1 ? "0%" : step === 2 ? "50%" : "100%"}}/>
        </div>
        <p style={S.stepLabel}>
          {step === 1 ? "Your details" : step === 2 ? "Verify identity" : "Enter OTP"}
        </p>

        {error && <div style={S.error}>{error}</div>}
        <div ref={recaptchaRef}/>

        {/* ── STEP 1: Form ── */}
        {step === STEPS.FORM && (
          <form onSubmit={handleFormNext} style={S.form}>
            <FInput label="Username" value={form.username} placeholder="e.g. vikash123"
              onChange={e => setForm(p=>({...p,username:e.target.value}))}/>
            <FInput label="Email" type="email" value={form.email} placeholder="you@example.com"
              onChange={e => setForm(p=>({...p,email:e.target.value}))}/>
            <FInput label="Password" type="password" value={form.password} placeholder="Min. 6 characters"
              onChange={e => setForm(p=>({...p,password:e.target.value}))}/>
            <FInput label="Confirm Password" type="password" value={form.confirmPassword} placeholder="Repeat your password"
              onChange={e => setForm(p=>({...p,confirmPassword:e.target.value}))}/>
            <PrimaryBtn type="submit">Continue →</PrimaryBtn>
            <p style={S.link}>
              Already have an account? <Link to="/login" style={S.linkA}>Sign in</Link>
            </p>
          </form>
        )}

        {/* ── STEP 2: Choose verification method ── */}
        {step === STEPS.VERIFY && (
          <div style={S.form}>
            <p style={S.verifyTitle}>Verify your identity once to create your account</p>

            {/* Phone option */}
            <div style={S.methodCard}>
              <div style={S.methodHeader}>
                <span style={{fontSize:24}}>📱</span>
                <div>
                  <p style={S.methodTitle}>Phone number OTP</p>
                  <p style={S.methodSub}>Get a 6-digit code via SMS</p>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <input value={phone} onChange={e=>setPhone(e.target.value)}
                  placeholder="+91 98765 43210" style={S.phoneInput}/>
                <button type="button" onClick={handleSendOTP} disabled={loading}
                  style={S.sendBtn}>
                  {loading && method==="phone" ? "…" : "Send OTP"}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div style={S.divider}><span style={S.dividerText}>or</span></div>

            {/* Google option */}
            <button onClick={handleGoogleVerify} disabled={loading} style={S.googleBtn}>
              {loading ? "Verifying…" : <><span style={S.gLetter}>G</span>Verify with Google</>}
            </button>

            <button onClick={()=>setStep(STEPS.FORM)} style={S.backBtn}>← Back</button>
          </div>
        )}

        {/* ── STEP 3: OTP input ── */}
        {step === STEPS.OTP && (
          <div style={S.form}>
            <p style={S.verifyTitle}>
              OTP sent to <strong style={{color:"#a78bfa"}}>{phone}</strong>
            </p>
            <div style={S.otpRow}>
              {otp.map((v,i) => (
                <input key={i} ref={el => otpRefs.current[i]=el}
                  value={v} maxLength={1} inputMode="numeric"
                  onChange={e => handleOtpChange(e.target.value, i)}
                  onKeyDown={e => e.key==="Backspace"&&!v&&i>0&&otpRefs.current[i-1]?.focus()}
                  style={{...S.otpBox,...(v?S.otpFilled:{})}}/>
              ))}
            </div>
            <PrimaryBtn loading={loading} onClick={handleVerifyOTP} type="button">
              ✓ Verify &amp; Create Account
            </PrimaryBtn>
            <button style={S.resendBtn} disabled={countdown>0}
              onClick={()=>{setStep(STEPS.VERIFY);setOtp(["","","","","",""]);setCountdown(0);}}>
              {countdown>0?`Resend in ${countdown}s`:"← Change number / Resend"}
            </button>
          </div>
        )}
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

// ── Sub components ───────────────────────────────────────────
const FInput = ({label,...props}) => (
  <div style={{display:"flex",flexDirection:"column",gap:6}}>
    <label style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,.45)",textTransform:"uppercase",letterSpacing:".08em"}}>{label}</label>
    <input {...props} style={{width:"100%",padding:"12px 16px",background:"rgba(255,255,255,.07)",border:"1.5px solid rgba(255,255,255,.12)",borderRadius:12,color:"#fff",fontSize:14,outline:"none",fontFamily:"'DM Sans',sans-serif",transition:"border-color .2s,box-shadow .2s"}}/>
  </div>
);

const PrimaryBtn = ({loading,children,...props}) => (
  <button {...props} disabled={loading} style={{width:"100%",padding:"13px",borderRadius:12,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer",opacity:loading?.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
    {loading?"Please wait…":children}
  </button>
);

const S = {
  page:        {minHeight:"100vh",background:"#07051a",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'DM Sans',sans-serif"},
  card:        {width:"100%",maxWidth:440,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.09)",borderRadius:24,padding:"36px 32px",backdropFilter:"blur(20px)"},
  logo:        {display:"flex",alignItems:"center",gap:10,marginBottom:20},
  logoText:    {fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,color:"#fff",margin:0},
  progress:    {display:"flex",alignItems:"center",gap:0,marginBottom:8,position:"relative"},
  progressLine:{position:"absolute",top:"50%",left:24,height:2,background:"#6366f1",transition:"width .4s ease",zIndex:0,transform:"translateY(-50%)"},
  dot:         {width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,.1)",border:"2px solid rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"rgba(255,255,255,.4)",zIndex:1,flexShrink:0,marginRight:32},
  dotActive:   {background:"#6366f1",border:"2px solid #8b5cf6",color:"#fff"},
  stepLabel:   {color:"rgba(255,255,255,.35)",fontSize:12,marginBottom:20,marginTop:4},
  error:       {background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:10,padding:"10px 14px",color:"#fca5a5",fontSize:13,marginBottom:14},
  form:        {display:"flex",flexDirection:"column",gap:16},
  link:        {textAlign:"center",fontSize:13,color:"rgba(255,255,255,.35)",margin:0},
  linkA:       {color:"#a78bfa",textDecoration:"none",fontWeight:600},
  verifyTitle: {color:"rgba(255,255,255,.6)",fontSize:14,margin:0,lineHeight:1.6,textAlign:"center"},
  methodCard:  {background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:14,padding:"16px"},
  methodHeader:{display:"flex",alignItems:"center",gap:12},
  methodTitle: {color:"#fff",fontWeight:600,fontSize:14,margin:0},
  methodSub:   {color:"rgba(255,255,255,.35)",fontSize:12,margin:"2px 0 0"},
  phoneInput:  {flex:1,padding:"11px 14px",background:"rgba(255,255,255,.07)",border:"1.5px solid rgba(255,255,255,.12)",borderRadius:10,color:"#fff",fontSize:14,outline:"none",fontFamily:"'DM Sans',sans-serif"},
  sendBtn:     {padding:"11px 18px",borderRadius:10,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",color:"#fff",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"},
  divider:     {display:"flex",alignItems:"center",gap:12},
  dividerText: {color:"rgba(255,255,255,.2)",fontSize:12,padding:"0 8px",background:"rgba(255,255,255,.03)",borderRadius:4},
  googleBtn:   {width:"100%",padding:"13px",borderRadius:12,background:"#fff",border:"none",color:"#1a1a2e",fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10},
  gLetter:     {fontWeight:900,fontSize:18,color:"#4285f4"},
  otpRow:      {display:"flex",gap:8,justifyContent:"center"},
  otpBox:      {width:48,height:56,textAlign:"center",fontSize:22,fontWeight:700,background:"rgba(255,255,255,.07)",border:"1.5px solid rgba(255,255,255,.15)",borderRadius:12,color:"#fff",outline:"none",transition:"border-color .2s"},
  otpFilled:   {borderColor:"#6366f1",background:"rgba(99,102,241,.15)"},
  backBtn:     {background:"none",border:"none",color:"rgba(255,255,255,.4)",fontSize:13,cursor:"pointer",textAlign:"center",padding:0},
  resendBtn:   {background:"none",border:"none",color:"#a78bfa",fontSize:13,cursor:"pointer",textAlign:"center",padding:0},
};
