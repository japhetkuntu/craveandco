'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, Clock3, Gift,
  Info, Loader2, RefreshCw, Sparkles, X,
} from 'lucide-react';
import { API_BASE, API_PATHS } from '@/lib/constants';
import { friendlyError } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OtpResponse    { message: string; phone: string }
interface VerifyResponse { accessCode: string; phone: string; eligibleToSpin: boolean; remainingSpins: number; message: string }
interface SpinReward     { type: string; label: string; description: string; expiresAt: string }
interface SpinResponse   { eligibleToSpin: boolean; remainingSpins: number; message: string; reward?: SpinReward; nextEligibleAt?: string }
interface WheelSegment   { type: string; short: string; emoji: string; fill: string; textColor: string }

const SEGMENTS: WheelSegment[] = [
  { type: 'FIVE_PERCENT',             short: '5% OFF',        emoji: '✦',  fill: '#c07d1a', textColor: '#fff8e1' },
  { type: 'FREE_WATER',               short: 'Free Water',    emoji: '◆',  fill: '#1e3a8a', textColor: '#e0eaff' },
  { type: 'TEN_PERCENT',              short: '10% OFF',       emoji: '★',  fill: '#9a2a0a', textColor: '#ffe4d6' },
  { type: 'FREE_DELIVERY',            short: '12% OFF',       emoji: '▲',  fill: '#14532d', textColor: '#d1fae5' },
  { type: 'FIFTY_PERCENT_FIRST_MEAL', short: '50% OFF',       emoji: '♛',  fill: '#6b1212', textColor: '#ffd6d6' },
];

const REWARD_DISPLAY: Record<string, { emoji: string; color: string }> = {
  FIVE_PERCENT:             { emoji: '🎁', color: '#f59e0b' },
  FREE_WATER:               { emoji: '🥤', color: '#3b82f6' },
  TEN_PERCENT:              { emoji: '🔥', color: '#ea580c' },
  FREE_DELIVERY:            { emoji: '🚀', color: '#16a34a' },
  FIFTY_PERCENT_FIRST_MEAL: { emoji: '👑', color: '#dc2626' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function postPublic<T>(path: string, body: unknown): Promise<T> {
  const base = API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
  const res  = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(friendlyError(res.status, data?.message));
  return data as T;
}
function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function arc(cx: number, cy: number, r: number, a1: number, a2: number) {
  const s = polar(cx, cy, r, a2), e = polar(cx, cy, r, a1);
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${a2 - a1 <= 180 ? 0 : 1} 0 ${e.x} ${e.y} Z`;
}
function fmt(ms: number) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  return [Math.floor(s/3600), Math.floor((s%3600)/60), s%60].map(n => String(n).padStart(2,'0')).join(':');
}
function getDeviceId() {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('crave_device_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('crave_device_id', id); }
  return id;
}
const SK = 'crave_sw_session';
interface Stored { accessCode: string; phone: string; remainingSpins: number; reward?: SpinReward }
const readStored  = (): Stored | null => { try { const r = localStorage.getItem(SK); return r ? JSON.parse(r) : null; } catch { return null; } };
const writeStored = (s: Stored | null) => { s ? localStorage.setItem(SK, JSON.stringify(s)) : localStorage.removeItem(SK); };

// ─── Page ─────────────────────────────────────────────────────────────────────
type Step = 'phone' | 'verify' | 'spin';

export default function SpinWinPage() {
  const [step,           setStep]           = useState<Step>('phone');
  const [phone,          setPhone]          = useState('');
  const [maskedPhone,    setMaskedPhone]     = useState('');
  const [name,           setName]           = useState('');
  const [accessCode,     setAccessCode]     = useState<string | null>(null);
  const [otp,            setOtp]            = useState('');
  const [remainingSpins, setRemainingSpins] = useState(3);
  const [reward,         setReward]         = useState<SpinReward | null>(null);
  const [showReward,     setShowReward]     = useState(false);
  const [errorMsg,       setErrorMsg]       = useState<string | null>(null);
  const [submitting,     setSubmitting]     = useState(false);
  const [spinning,       setSpinning]       = useState(false);
  const [rotation,       setRotation]       = useState(0);
  const [now,            setNow]            = useState(() => Date.now());
  const rotRef = useRef(0);
  const segAngle = 360 / SEGMENTS.length;

  useEffect(() => {
    const s = readStored();
    if (s) { setAccessCode(s.accessCode); setPhone(s.phone); setRemainingSpins(s.remainingSpins); if (s.reward && new Date(s.reward.expiresAt).getTime() > Date.now()) setReward(s.reward); setStep('spin'); }
  }, []);
  useEffect(() => { if (accessCode) writeStored({ accessCode, phone, remainingSpins, reward: reward ?? undefined }); }, [accessCode, phone, remainingSpins, reward]);
  useEffect(() => { if (!reward) return; const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, [reward]);

  const requestOtp = async (inputPhone: string, inputName: string, refreshCode = false) => {
    setErrorMsg(null);
    const cleanPhone = inputPhone.trim();
    const cleanName = inputName.trim();
    if (!cleanPhone) { setErrorMsg('Enter your phone number.'); return; }
    if (!cleanName) { setErrorMsg('Enter your first name.'); return; }

    setSubmitting(true);
    try {
      const r = await postPublic<OtpResponse>(API_PATHS.raffle.requestOtp, {
        phone: cleanPhone,
        name: cleanName,
        deviceId: getDeviceId(),
        ...(refreshCode ? { refreshCode: true } : {}),
      });
      setPhone(cleanPhone);
      setMaskedPhone(r.phone);
      setStep('verify');
    } catch (e) { setErrorMsg(e instanceof Error ? e.message : 'Could not send code.'); }
    finally { setSubmitting(false); }
  };

  const handleVerify = async (code: string) => {
    setErrorMsg(null); setSubmitting(true);
    try {
      const r = await postPublic<VerifyResponse>(API_PATHS.raffle.verify, { phone: phone.trim(), accessCode: code.toUpperCase(), deviceId: getDeviceId() });
      setAccessCode(r.accessCode); setRemainingSpins(r.remainingSpins); setStep('spin');
    } catch (e) { setErrorMsg(e instanceof Error ? e.message : 'Verification failed.'); }
    finally { setSubmitting(false); }
  };

  const handleReturnLogin = async (ph: string, code: string) => {
    setErrorMsg(null); setSubmitting(true);
    try {
      const r = await postPublic<VerifyResponse>(API_PATHS.raffle.verify, { phone: ph.trim(), accessCode: code.toUpperCase(), deviceId: getDeviceId() });
      setPhone(ph.trim()); setAccessCode(r.accessCode); setRemainingSpins(r.remainingSpins); setStep('spin');
    } catch (e) { setErrorMsg(e instanceof Error ? e.message : 'Could not sign in. Check your number and code.'); }
    finally { setSubmitting(false); }
  };

  const handleSpin = async () => {
    if (!accessCode || spinning) return;
    setErrorMsg(null); setSpinning(true); setReward(null); setShowReward(false);
    try {
      const r = await postPublic<SpinResponse>(API_PATHS.raffle.spin, { accessCode });
      setRemainingSpins(r.remainingSpins);
      const ti = Math.max(0, SEGMENTS.findIndex(s => s.type === r.reward?.type));
      const tc = ti * segAngle + segAngle / 2;
      const cm = ((rotRef.current % 360) + 360) % 360;
      const dm = (360 - tc) % 360;
      const nr = rotRef.current + 6 * 360 + (dm - cm + 360) % 360;
      rotRef.current = nr; setRotation(nr);
      setTimeout(() => { if (r.reward) { setReward(r.reward); setShowReward(true); } setSpinning(false); }, 5200);
    } catch (e) { setErrorMsg(e instanceof Error ? e.message : 'Spin failed.'); setSpinning(false); }
  };

  const handleReset = () => {
    writeStored(null); setAccessCode(null); setPhone(''); setName(''); setOtp('');
    setRemainingSpins(3); setReward(null); setShowReward(false); setErrorMsg(null);
    setRotation(0); rotRef.current = 0; setStep('phone');
  };

  const expiryMs = reward ? new Date(reward.expiresAt).getTime() - now : 0;

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a0502 0%, #150905 40%, #0d0603 100%)', color: '#fff', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @keyframes orb-drift { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,20px) scale(1.05)} }
        @keyframes orb-drift2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(25px,-20px) scale(0.95)} }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 40px rgba(181,69,27,0.4),0 0 80px rgba(181,69,27,0.15)} 50%{box-shadow:0 0 60px rgba(181,69,27,0.7),0 0 120px rgba(181,69,27,0.25)} }
        @keyframes shimmer-text { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes pop-in { 0%{transform:scale(0.5) rotate(-10deg);opacity:0} 70%{transform:scale(1.1) rotate(2deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes slide-up { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes wheel-idle { 0%,100%{filter:drop-shadow(0 0 10px rgba(181,69,27,0.3))} 50%{filter:drop-shadow(0 0 24px rgba(181,69,27,0.6))} }
        @keyframes confetti-fall { 0%{transform:translateY(-10px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
        @keyframes spin-dot-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.6)} }
        .spin-btn:not(:disabled):hover { transform: translateY(-2px); }
        .spin-btn { transition: transform 0.2s, box-shadow 0.2s; }
        .glass-card { background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        .glass-card-warm { background: rgba(181,69,27,0.06); backdrop-filter: blur(20px); border: 1px solid rgba(181,69,27,0.15); }
        .input-dark { background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 16px; color: #fff; outline: none; transition: border-color 0.2s, background 0.2s; }
        .input-dark:focus { border-color: rgba(181,69,27,0.7); background: rgba(181,69,27,0.08); }
        .input-dark::placeholder { color: rgba(255,255,255,0.25); }
        .otp-box { background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1); border-radius: 14px; color: #fff; text-align: center; font-size: 1.25rem; font-weight: 800; outline: none; caret-color: #b5451b; transition: all 0.15s; }
        .otp-box:focus { border-color: rgba(181,69,27,0.8); background: rgba(181,69,27,0.12); box-shadow: 0 0 0 4px rgba(181,69,27,0.15); }
        .otp-box.filled { border-color: rgba(181,69,27,0.6); background: rgba(181,69,27,0.15); }
        .reward-ticket { background: linear-gradient(135deg, rgba(181,69,27,0.15), rgba(232,164,90,0.1)); border: 1px solid rgba(181,69,27,0.25); border-radius: 20px; }
        .layout-shell { max-width: 1200px; margin: 0 auto; padding: 32px 20px 60px; min-height: 100vh; }
        .desktop-pane { display: none; }
        .main-pane { max-width: 440px; margin: 0 auto; display: flex; flex-direction: column; }
        .wheel-wrap { max-width: 340px; }

        @media (min-width: 1024px) {
          .layout-shell {
            display: grid;
            grid-template-columns: minmax(360px, 420px) minmax(560px, 1fr);
            gap: 40px;
            padding: 42px 26px 64px;
            align-items: start;
          }
          .desktop-pane {
            display: block;
            position: sticky;
            top: 26px;
          }
          .main-pane {
            max-width: none;
            margin: 0;
            min-height: calc(100vh - 84px);
          }
          .wheel-wrap {
            max-width: 460px;
          }
          .otp-box {
            max-width: 60px !important;
            font-size: 1.45rem;
          }
        }
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position:'fixed', top:'-15%', right:'-10%', width:480, height:480, borderRadius:'50%', background:'radial-gradient(circle, rgba(181,69,27,0.12) 0%, transparent 70%)', pointerEvents:'none', animation:'orb-drift 8s ease-in-out infinite' }} />
      <div style={{ position:'fixed', bottom:'-20%', left:'-10%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(232,164,90,0.07) 0%, transparent 70%)', pointerEvents:'none', animation:'orb-drift2 10s ease-in-out infinite' }} />

      <div className="layout-shell">
        <aside className="desktop-pane">
          <DesktopShowcase />
        </aside>

        <div className="main-pane">
        {/* Header */}
        <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
          <Link href="/" style={{ textDecoration:'none', display:'flex', flexDirection:'column', lineHeight:1.2 }}>
            <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.4em', textTransform:'uppercase', color:'rgba(232,164,90,0.7)' }}>Crave & Co.</span>
            <span style={{ fontSize:'1rem', fontWeight:800, color:'#fff', letterSpacing:'-0.01em' }}>Spin &amp; Win</span>
          </Link>
          {step === 'spin' && (
            <button onClick={handleReset} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:99, padding:'7px 14px', color:'rgba(255,255,255,0.6)', fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all 0.2s' }}>
              <RefreshCw size={12} /> Change number
            </button>
          )}
        </header>

        {/* Step dots */}
        {step !== 'spin' && (
          <div style={{ display:'flex', gap:6, marginBottom:28, justifyContent:'center' }}>
            {(['phone','verify'] as Step[]).map((s,i) => (
              <div key={s} style={{ height:4, width: step === s ? 28 : 8, borderRadius:99, background: step === s ? '#b5451b' : i < (['phone','verify'] as Step[]).indexOf(step) ? 'rgba(181,69,27,0.4)' : 'rgba(255,255,255,0.12)', transition:'all 0.4s ease' }} />
            ))}
          </div>
        )}

        {step === 'phone'  && <PhoneStep  phone={phone} name={name} onPhoneChange={setPhone} onNameChange={setName} onRequestCode={requestOtp} onReturnLogin={handleReturnLogin} submitting={submitting} errorMsg={errorMsg} onClearError={() => setErrorMsg(null)} />}
        {step === 'verify' && <VerifyStep maskedPhone={maskedPhone} otp={otp} onOtpChange={setOtp} onVerify={handleVerify} onResend={() => { setStep('phone'); setOtp(''); setErrorMsg(null); }} submitting={submitting} errorMsg={errorMsg} onClearError={() => setErrorMsg(null)} />}
        {step === 'spin'   && <SpinStep   rotation={rotation} spinning={spinning} onSpin={handleSpin} remainingSpins={remainingSpins} reward={reward} expiryMs={expiryMs} errorMsg={errorMsg} phone={phone} accessCode={accessCode} />}
        </div>
      </div>

      {showReward && reward && (
        <WinModal reward={reward} expiryMs={expiryMs} remainingSpins={remainingSpins} accessCode={accessCode}
          onClose={() => setShowReward(false)}
          onSpinAgain={() => { setShowReward(false); setTimeout(() => handleSpin(), 300); }} />
      )}
    </main>
  );
}

// ─── Phone Step ────────────────────────────────────────────────────────────────
function PhoneStep({
  phone, name, onPhoneChange, onNameChange, onRequestCode, onReturnLogin, submitting, errorMsg, onClearError,
}: {
  phone: string; name: string; onPhoneChange:(v:string)=>void; onNameChange:(v:string)=>void;
  onRequestCode:(phone:string, name:string, refreshCode?:boolean)=>Promise<void>; onReturnLogin:(ph:string,code:string)=>Promise<void>;
  submitting:boolean; errorMsg:string|null; onClearError:()=>void;
}) {
  const [mode,       setMode]       = useState<'new'|'return'|'refresh'>('new');
  const [returnCode, setReturnCode] = useState('');
  const [localError, setLocalError] = useState<string|null>(null);
  const error = errorMsg || localError;

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    onClearError();
    if (!phone.trim()) { setLocalError('Enter your phone number.'); return; }
    if (!name.trim()) { setLocalError('Enter your first name.'); return; }
    await onRequestCode(phone, name, false);
  };

  const handleReturn = async (e: FormEvent) => {
    e.preventDefault(); setLocalError(null); onClearError();
    if (!phone.trim()) { setLocalError('Enter your phone number.'); return; }
    if (returnCode.trim().length !== 8) { setLocalError('Enter your 8-character Spin & Win code.'); return; }
    await onReturnLogin(phone.trim(), returnCode.trim());
  };

  const handleRefresh = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    onClearError();
    if (!phone.trim()) { setLocalError('Enter your phone number.'); return; }
    if (!name.trim()) { setLocalError('Enter your first name.'); return; }
    await onRequestCode(phone, name, true);
  };

  return (
    <section style={{ flex:1, display:'flex', flexDirection:'column', animation:'slide-up 0.4s ease' }}>
      {/* Hero banner */}
      <div style={{ position:'relative', borderRadius:28, overflow:'hidden', marginBottom:24, padding:'32px 28px' }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, #1a0805 0%, #2d1208 50%, #3d1a0a 100%)' }} />
        <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(181,69,27,0.25) 0%, transparent 70%)' }} />
        <div style={{ position:'absolute', bottom:-30, left:-20, width:140, height:140, borderRadius:'50%', background:'radial-gradient(circle, rgba(232,164,90,0.15) 0%, transparent 70%)' }} />
        <div style={{ position:'relative' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(181,69,27,0.2)', border:'1px solid rgba(181,69,27,0.3)', borderRadius:99, padding:'5px 14px', marginBottom:16 }}>
            <Sparkles size={12} color="#f59e0b" />
            <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.3em', textTransform:'uppercase', color:'#f59e0b' }}>Free Daily Spins</span>
          </div>
          <h1 style={{ fontSize:'clamp(1.75rem,6vw,2.25rem)', fontWeight:900, lineHeight:1.1, letterSpacing:'-0.02em', margin:0 }}>
            Spin the wheel.<br />
            <span style={{ background:'linear-gradient(90deg, #f59e0b, #fb923c, #f97316)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Win big rewards.</span>
          </h1>
          <p style={{ marginTop:12, fontSize:'0.875rem', color:'rgba(255,255,255,0.6)', lineHeight:1.65 }}>3 free spins every day. Your code arrives by SMS — enter it once to start playing.</p>
          <div style={{ marginTop:16, display:'flex', gap:16, fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'rgba(255,255,255,0.4)' }}>
            <span>🎯 3 spins/day</span>
            <span style={{ opacity:0.3 }}>·</span>
            <span>📱 SMS code</span>
            <span style={{ opacity:0.3 }}>·</span>
            <span>⚡ Instant</span>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', borderRadius:16, padding:4, marginBottom:20, border:'1px solid rgba(255,255,255,0.07)' }}>
        {(['new','return','refresh'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); onClearError(); setLocalError(null); }} style={{ flex:1, padding:'10px 0', borderRadius:13, fontSize:'13px', fontWeight:700, border:'none', cursor:'pointer', transition:'all 0.2s', background: mode===m ? 'rgba(181,69,27,0.9)' : 'transparent', color: mode===m ? '#fff' : 'rgba(255,255,255,0.45)' }}>
            {m === 'new' ? 'First time? Get code' : m === 'return' ? 'I have my code' : 'I lost my code'}
          </button>
        ))}
      </div>

      {mode === 'new' ? (
        <form onSubmit={handleRequest} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:8 }}>Phone number</label>
            <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => onPhoneChange(e.target.value)} placeholder="+233 20 123 4567" className="input-dark" style={{ width:'100%', padding:'14px 18px', fontSize:'16px', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:8 }}>First name</label>
            <input value={name} onChange={e => onNameChange(e.target.value)} required placeholder="e.g. Ama" className="input-dark" style={{ width:'100%', padding:'14px 18px', fontSize:'16px', boxSizing:'border-box' }} />
          </div>
          {error && <ErrorBox msg={error} />}
          <button type="submit" disabled={submitting} className="spin-btn" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'16px', borderRadius:99, background: submitting ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #b5451b 0%, #e8803a 100%)', border:'none', color:'#fff', fontSize:'15px', fontWeight:700, cursor: submitting ? 'not-allowed' : 'pointer', animation: submitting ? 'none' : 'glow-pulse 2.5s ease-in-out infinite', marginTop:4 }}>
            {submitting ? <><Loader2 size={18} className="animate-spin" /> Sending code…</> : <>Send my code <ArrowRight size={17} /></>}
          </button>
          <p style={{ textAlign:'center', fontSize:'11px', color:'rgba(255,255,255,0.25)', marginTop:4 }}>You receive one personal code. Keep it safe and reuse it to sign in.</p>
        </form>
      ) : mode === 'return' ? (
        <form onSubmit={handleReturn} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:8 }}>Phone number</label>
            <input type="tel" inputMode="tel" value={phone} onChange={e => onPhoneChange(e.target.value)} placeholder="+233 20 123 4567" className="input-dark" style={{ width:'100%', padding:'14px 18px', fontSize:'16px', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:8 }}>Your Spin &amp; Win code</label>
            <input value={returnCode} onChange={e => setReturnCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8))} placeholder="e.g. AB3D7YZ9" autoCapitalize="characters" autoCorrect="off" spellCheck={false} className="input-dark" style={{ width:'100%', padding:'14px 18px', fontSize:'20px', fontWeight:800, letterSpacing:'0.3em', textAlign:'center', boxSizing:'border-box' }} />
          </div>
          {error && <ErrorBox msg={error} />}
          <button type="submit" disabled={submitting} className="spin-btn" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'16px', borderRadius:99, background: submitting ? 'rgba(255,255,255,0.1)' : 'rgba(181,69,27,0.85)', border:'1px solid rgba(181,69,27,0.4)', color:'#fff', fontSize:'15px', fontWeight:700, cursor: submitting ? 'not-allowed' : 'pointer', marginTop:4 }}>
            {submitting ? <><Loader2 size={18} className="animate-spin" /> Signing in…</> : <>Sign back in <ArrowRight size={17} /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRefresh} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:8 }}>Phone number</label>
            <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => onPhoneChange(e.target.value)} placeholder="+233 20 123 4567" className="input-dark" style={{ width:'100%', padding:'14px 18px', fontSize:'16px', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:8 }}>First name</label>
            <input value={name} onChange={e => onNameChange(e.target.value)} required placeholder="e.g. Ama" className="input-dark" style={{ width:'100%', padding:'14px 18px', fontSize:'16px', boxSizing:'border-box' }} />
          </div>
          {error && <ErrorBox msg={error} />}
          <button type="submit" disabled={submitting} className="spin-btn" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'16px', borderRadius:99, background: submitting ? 'rgba(255,255,255,0.1)' : 'rgba(59,130,246,0.75)', border:'1px solid rgba(59,130,246,0.4)', color:'#fff', fontSize:'15px', fontWeight:700, cursor: submitting ? 'not-allowed' : 'pointer', marginTop:4 }}>
            {submitting ? <><Loader2 size={18} className="animate-spin" /> Refreshing code…</> : <>Refresh my code <ArrowRight size={17} /></>}
          </button>
          <p style={{ textAlign:'center', fontSize:'11px', color:'rgba(255,255,255,0.25)', marginTop:4 }}>Code refresh is limited to once every 7 days.</p>
        </form>
      )}

      <HowItWorksCollapsed />
      <TermsCollapsed />
    </section>
  );
}

// ─── Verify Step ──────────────────────────────────────────────────────────────
function VerifyStep({ maskedPhone, otp, onOtpChange, onVerify, onResend, submitting, errorMsg, onClearError }: {
  maskedPhone:string; otp:string; onOtpChange:(v:string)=>void; onVerify:(code:string)=>void;
  onResend:()=>void; submitting:boolean; errorMsg:string|null; onClearError:()=>void;
}) {
  const handleSubmit = (e: FormEvent) => { e.preventDefault(); if (otp.length === 8) onVerify(otp); };
  return (
    <section style={{ flex:1, display:'flex', flexDirection:'column', animation:'slide-up 0.4s ease' }}>
      <div style={{ position:'relative', borderRadius:28, overflow:'hidden', marginBottom:28, padding:'32px 28px' }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, #0d1a2e 0%, #0f2540 50%, #0a1e38 100%)' }} />
        <div style={{ position:'absolute', top:-30, right:-30, width:150, height:150, borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)' }} />
        <div style={{ position:'relative' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:99, padding:'5px 14px', marginBottom:16 }}>
            <span style={{ fontSize:14 }}>📱</span>
            <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.3em', textTransform:'uppercase', color:'#93c5fd' }}>Check your SMS</span>
          </div>
          <h1 style={{ fontSize:'clamp(1.6rem,6vw,2rem)', fontWeight:900, lineHeight:1.1, margin:0 }}>
            Enter your<br /><span style={{ color:'#93c5fd' }}>secret code.</span>
          </h1>
          <p style={{ marginTop:10, fontSize:'0.85rem', color:'rgba(255,255,255,0.55)', lineHeight:1.65 }}>We sent an 8-character code to <strong style={{ color:'rgba(255,255,255,0.85)' }}>{maskedPhone}</strong>.</p>
          <p style={{ marginTop:6, fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>You have 3 attempts. Valid today only.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
        <div>
          <label style={{ display:'block', fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:12, textAlign:'center' }}>Your code</label>
          <OtpBoxes value={otp} onChange={v => { onOtpChange(v); onClearError(); }} />
        </div>

        {errorMsg && <ErrorBox msg={errorMsg} />}

        <button type="submit" disabled={submitting || otp.length < 8} className="spin-btn" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'16px', borderRadius:99, background: otp.length < 8 || submitting ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg, #b5451b 0%, #e8803a 100%)', border:'none', color: otp.length < 8 ? 'rgba(255,255,255,0.3)' : '#fff', fontSize:'15px', fontWeight:700, cursor: submitting || otp.length < 8 ? 'not-allowed' : 'pointer', animation: otp.length === 8 && !submitting ? 'glow-pulse 2.5s ease-in-out infinite' : 'none' }}>
          {submitting ? <><Loader2 size={18} className="animate-spin" /> Verifying…</> : <>Verify &amp; Start Spinning <ArrowRight size={17} /></>}
        </button>

        <button type="button" onClick={onResend} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', fontSize:'13px', fontWeight:600, cursor:'pointer', padding:'8px', transition:'color 0.2s' }}>
          Didn't receive a code? Go back
        </button>
      </form>
    </section>
  );
}

// ─── OTP Boxes ────────────────────────────────────────────────────────────────
function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focus = (i: number) => refs.current[i]?.focus();

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const ch = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(-1);
    const next = (value.slice(0,i) + ch + value.slice(i+1)).slice(0,8);
    onChange(next); if (ch && i < 7) focus(i+1);
  };
  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') { if (value[i]) { onChange(value.slice(0,i) + value.slice(i+1)); } else if (i > 0) { onChange(value.slice(0,i-1) + value.slice(i)); focus(i-1); } e.preventDefault(); }
    else if (e.key === 'ArrowLeft' && i > 0) focus(i-1);
    else if (e.key === 'ArrowRight' && i < 7) focus(i+1);
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
    onChange(p); focus(Math.min(p.length, 7));
  };

  return (
    <div
      style={{
        display:'grid',
        gridTemplateColumns:'repeat(8, minmax(0, 1fr))',
        gap:'clamp(3px, 1.4vw, 7px)',
        width:'100%',
      }}
    >
      {Array.from({ length: 8 }, (_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          value={value[i]??''}
          onChange={e => handleChange(i,e)}
          onKeyDown={e => handleKeyDown(i,e)}
          onPaste={handlePaste}
          maxLength={2}
          className={`otp-box${value[i] ? ' filled' : ''}`}
          style={{
            width:'100%',
            minWidth:0,
            height:'clamp(42px, 11vw, 52px)',
            padding:0,
            boxSizing:'border-box',
          }}
        />
      ))}
    </div>
  );
}

// ─── Spin Step ────────────────────────────────────────────────────────────────
function SpinStep({ rotation, spinning, onSpin, remainingSpins, reward, expiryMs, errorMsg, phone, accessCode }: {
  rotation:number; spinning:boolean; onSpin:()=>void; remainingSpins:number;
  reward:SpinReward|null; expiryMs:number; errorMsg:string|null; phone:string; accessCode:string|null;
}) {
  const canSpin = remainingSpins > 0 && !spinning;
  return (
    <section style={{ flex:1, display:'flex', flexDirection:'column' }}>
      {/* Player chip */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 18px', borderRadius:16, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', marginBottom:8 }}>
        <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', fontWeight:600 }}>
          {phone.replace(/.(?=.{4})/g,'•') || 'Your session'}
        </span>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i < remainingSpins ? '#b5451b' : 'rgba(255,255,255,0.12)', transition:'all 0.3s', boxShadow: i < remainingSpins ? '0 0 8px rgba(181,69,27,0.6)' : 'none', animation: i < remainingSpins && spinning ? `spin-dot-pulse 1s ease-in-out ${i * 0.2}s infinite` : 'none' }} />
          ))}
          <span style={{ fontSize:'12px', color: remainingSpins > 0 ? '#e8803a' : 'rgba(255,255,255,0.3)', fontWeight:700, marginLeft:6 }}>
            {remainingSpins} left
          </span>
        </div>
      </div>

      <div style={{ marginBottom:10, padding:'10px 12px', borderRadius:12, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', fontSize:'12px', color:'rgba(255,255,255,0.62)', lineHeight:1.5 }}>
        Your latest reward is the one used at checkout. You can spin up to 3 times, but you do not need to use all 3.
      </div>

      <SpinWheel rotation={rotation} spinning={spinning} />

      {reward && <ActiveTicket reward={reward} expiryMs={expiryMs} />}
      {errorMsg && <ErrorBox msg={errorMsg} />}

      <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:12 }}>
        <button onClick={onSpin} disabled={!canSpin} className="spin-btn" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'18px', borderRadius:99, border:'none', cursor: canSpin ? 'pointer' : 'not-allowed', fontSize:'17px', fontWeight:800, letterSpacing:'0.02em', color: canSpin ? '#fff' : 'rgba(255,255,255,0.25)', background: canSpin ? 'linear-gradient(135deg, #b5451b 0%, #e8803a 60%, #f59e0b 100%)' : 'rgba(255,255,255,0.06)', animation: canSpin ? 'glow-pulse 2.5s ease-in-out infinite' : 'none', position:'relative', overflow:'hidden' }}>
          {spinning ? <><Loader2 size={20} className="animate-spin" /> Spinning the wheel…</>
          : remainingSpins > 0 ? <><Sparkles size={20} /> SPIN THE WHEEL</>
          : 'Come back tomorrow 🌙'}
        </button>
        {reward && accessCode && (
          <Link href={`/menu?raffle=${accessCode}`} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'15px', borderRadius:99, border:'1px solid rgba(255,255,255,0.12)', textDecoration:'none', color:'rgba(255,255,255,0.8)', fontSize:'14px', fontWeight:700, transition:'all 0.2s' }}>
            Order now &amp; use reward <ArrowRight size={16} />
          </Link>
        )}
      </div>

      <PossiblePrizes />
    </section>
  );
}

// ─── Spin Wheel ───────────────────────────────────────────────────────────────
function SpinWheel({ rotation, spinning }: { rotation: number; spinning: boolean }) {
  const size = 320; const cx = size/2; const cy = size/2; const r = size/2 - 6;
  const sa = 360 / SEGMENTS.length;
  const segs = useMemo(() => SEGMENTS.map((seg, i) => {
    const s = i * sa, e = s + sa;
    return { ...seg, path: arc(cx, cy, r, s, e), mid: s + sa/2, label: polar(cx, cy, r * 0.64, s + sa/2) };
  }), [sa]);

  return (
    <div className="wheel-wrap" style={{ position:'relative', margin:'16px auto', width:'100%', aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center' }}>
      {/* Outer glow ring */}
      <div style={{ position:'absolute', inset:-4, borderRadius:'50%', background:'conic-gradient(#b5451b, #e8803a, #f59e0b, #e8803a, #b5451b)', opacity:0.35, animation: spinning ? 'none' : 'wheel-idle 3s ease-in-out infinite' }} />
      <div style={{ position:'absolute', inset:-1, borderRadius:'50%', border:'2px solid rgba(232,164,90,0.25)' }} />

      {/* Pointer */}
      <div style={{ position:'absolute', top:-2, left:'50%', transform:'translateX(-50%)', zIndex:20, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ width:0, height:0, borderLeft:'12px solid transparent', borderRight:'12px solid transparent', borderTop:'26px solid #f59e0b', filter:'drop-shadow(0 4px 12px rgba(245,158,11,0.8))' }} />
        <div style={{ width:8, height:8, borderRadius:'50%', background:'#f59e0b', marginTop:-2, boxShadow:'0 0 12px rgba(245,158,11,0.9)' }} />
      </div>

      {/* Wheel SVG */}
      <svg viewBox={`0 0 ${size} ${size}`} style={{ position:'absolute', inset:0, width:'100%', height:'100%', transform:`rotate(${rotation}deg)`, transition: spinning ? 'transform 5s cubic-bezier(0.16,1,0.3,1)' : 'transform 0.4s ease' }}>
        {/* Outer decorative ring */}
        <circle cx={cx} cy={cy} r={r+2} fill="none" stroke="rgba(232,164,90,0.18)" strokeWidth={5} />
        {segs.map(seg => (
          <g key={seg.type}>
            <path d={seg.path} fill={seg.fill} stroke="rgba(0,0,0,0.4)" strokeWidth={1.5} />
            <g transform={`translate(${seg.label.x} ${seg.label.y}) rotate(${seg.mid})`}>
              <text textAnchor="middle" dy="-8" fontSize="18" fontWeight="900" fill={seg.textColor} style={{ fontFamily:'serif', letterSpacing:2 }}>{seg.emoji}</text>
              <text textAnchor="middle" dy="11" fontSize="9.5" fontWeight="800" fill={seg.textColor} letterSpacing="1">{seg.short}</text>
            </g>
          </g>
        ))}
        {/* Divider dots */}
        {segs.map((_,i) => { const p = polar(cx,cy,r-3,i*sa); return <circle key={i} cx={p.x} cy={p.y} r={3} fill="rgba(232,164,90,0.5)" />; })}
        {/* Inner ring */}
        <circle cx={cx} cy={cy} r={28} fill="#0d0603" stroke="rgba(232,164,90,0.3)" strokeWidth={2} />
      </svg>

      {/* Center hub */}
      <div style={{ position:'absolute', zIndex:10, width:56, height:56, borderRadius:'50%', background:'radial-gradient(circle at 35% 35%, #2a1506, #0d0603)', border:'2px solid rgba(232,164,90,0.4)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.6)' }}>
        <Gift size={22} color="#f59e0b" />
      </div>
    </div>
  );
}

// ─── Desktop Showcase ─────────────────────────────────────────────────────────
function DesktopShowcase() {
  const desktopRewards = ['5% Discount', 'Free Water', '10% Discount', '12% Discount', '50% Discount'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ borderRadius:28, padding:'30px 28px', background:'linear-gradient(145deg, rgba(28,12,8,0.92), rgba(54,23,10,0.88))', border:'1px solid rgba(232,164,90,0.18)', boxShadow:'0 26px 80px rgba(0,0,0,0.4)' }}>
        <p style={{ margin:0, fontSize:'10px', color:'rgba(232,164,90,0.75)', letterSpacing:'0.32em', fontWeight:700, textTransform:'uppercase' }}>Crave & Co.</p>
        <h2 style={{ margin:'12px 0 10px', fontSize:'2.1rem', lineHeight:1.05, fontWeight:900, color:'#fff', letterSpacing:'-0.02em' }}>
          Spin &amp; Win
        </h2>
        <p style={{ margin:0, color:'rgba(255,255,255,0.58)', fontSize:'14px', lineHeight:1.7 }}>
          Get verified once, then spin daily and redeem your reward instantly at payment.
        </p>
      </div>

      <div style={{ borderRadius:22, padding:'18px 18px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
        <p style={{ margin:'0 0 12px', fontSize:'10px', letterSpacing:'0.26em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', fontWeight:700 }}>Possible Rewards</p>
        <div style={{ display:'grid', gap:8 }}>
          {desktopRewards.map((item) => (
            <div key={item} style={{ display:'flex', alignItems:'center', padding:'9px 10px', borderRadius:12, background:'rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.78)', fontWeight:600 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderRadius:18, padding:'14px 16px', background:'rgba(181,69,27,0.09)', border:'1px solid rgba(181,69,27,0.2)', color:'rgba(255,255,255,0.6)', fontSize:'12px', lineHeight:1.6 }}>
        Daily flow: enter phone, verify code, spin up to 3 times, redeem at checkout.
      </div>
    </div>
  );
}

// ─── Active Ticket ─────────────────────────────────────────────────────────────
function ActiveTicket({ reward, expiryMs }: { reward: SpinReward; expiryMs: number }) {
  const d = REWARD_DISPLAY[reward.type] ?? { emoji:'🎁', color:'#f59e0b' };
  return (
    <div className="reward-ticket" style={{ marginTop:16, padding:'18px 20px', display:'flex', alignItems:'center', gap:16 }}>
      <div style={{ width:52, height:52, borderRadius:16, background:`rgba(${d.color === '#f59e0b' ? '245,158,11' : d.color === '#3b82f6' ? '59,130,246' : d.color === '#ea580c' ? '234,88,12' : d.color === '#16a34a' ? '22,163,74' : '220,38,38'},0.15)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
        {d.emoji}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.25em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', margin:'0 0 4px' }}>Active reward</p>
        <p style={{ fontSize:'1.05rem', fontWeight:800, color:'#fff', margin:0, lineHeight:1.2 }}>{reward.label}</p>
        <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.45)', margin:'3px 0 0', lineHeight:1.4 }}>{reward.description}</p>
      </div>
      <div style={{ flexShrink:0, textAlign:'right' }}>
        <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.35)', fontWeight:600, marginBottom:3 }}>expires</div>
        <div style={{ fontFamily:'monospace', fontSize:'14px', fontWeight:800, color: expiryMs < 3600000 ? '#ef4444' : '#f59e0b' }}>{fmt(expiryMs)}</div>
      </div>
    </div>
  );
}

// ─── Win Modal ────────────────────────────────────────────────────────────────
function WinModal({ reward, expiryMs, remainingSpins, accessCode, onClose, onSpinAgain }: {
  reward:SpinReward; expiryMs:number; remainingSpins:number; accessCode:string|null; onClose:()=>void; onSpinAgain:()=>void;
}) {
  const d = REWARD_DISPLAY[reward.type] ?? { emoji:'🎁', color:'#f59e0b' };
  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'flex-end', justifyContent:'center', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', padding:'0 16px 24px' }} role="dialog" aria-modal="true">
      <Confetti />
      <div style={{ width:'100%', maxWidth:440, borderRadius:32, overflow:'hidden', background:'linear-gradient(180deg, #120903 0%, #0d0502 100%)', border:'1px solid rgba(232,164,90,0.2)', boxShadow:'0 40px 100px rgba(0,0,0,0.8)', animation:'slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {/* Close */}
        <button onClick={onClose} style={{ position:'absolute', right:20, top:20, zIndex:10, width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.6)', cursor:'pointer' }}>
          <X size={16} />
        </button>

        {/* Win header */}
        <div style={{ padding:'40px 28px 32px', textAlign:'center', background:'linear-gradient(180deg, rgba(181,69,27,0.2) 0%, transparent 100%)' }}>
          <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.4em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', margin:'0 0 16px' }}>🎉 You won</p>
          <div style={{ fontSize:72, lineHeight:1, animation:'pop-in 0.6s cubic-bezier(0.34,1.56,0.64,1)', display:'block' }}>{d.emoji}</div>
          <h2 style={{ fontSize:'clamp(1.75rem,6vw,2.25rem)', fontWeight:900, margin:'16px 0 8px', background:`linear-gradient(135deg, #fff, ${d.color})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{reward.label}</h2>
          <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.55)', maxWidth:280, margin:'0 auto' }}>{reward.description}</p>
        </div>

        {/* Timer + actions */}
        <div style={{ padding:'24px 24px 28px', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderRadius:16, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ display:'flex', alignItems:'center', gap:8, fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.6)' }}>
              <Clock3 size={15} color="#f59e0b" /> Expires in
            </span>
            <span style={{ fontFamily:'monospace', fontSize:'18px', fontWeight:900, color: expiryMs < 3600000 ? '#ef4444' : '#f59e0b' }}>{fmt(expiryMs)}</span>
          </div>
          <div style={{ padding:'12px 16px', borderRadius:14, background:'rgba(232,164,90,0.06)', border:'1px solid rgba(232,164,90,0.12)', fontSize:'12px', color:'rgba(255,255,255,0.5)', textAlign:'center', lineHeight:1.6 }}>
            Show this screen to the cashier, or quote your Spin &amp; Win code when you order. Only your latest reward is applied to the order.
          </div>
          <Link href={accessCode ? `/menu?raffle=${accessCode}` : '/menu'} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'16px', borderRadius:99, background:'linear-gradient(135deg, #b5451b, #e8803a)', textDecoration:'none', color:'#fff', fontSize:'15px', fontWeight:800, boxShadow:'0 12px 32px rgba(181,69,27,0.4)' }}>
            Order now &amp; use reward <ArrowRight size={18} />
          </Link>
          <button onClick={onSpinAgain} disabled={remainingSpins <= 0} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'15px', borderRadius:99, background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color: remainingSpins > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', fontSize:'14px', fontWeight:700, cursor: remainingSpins > 0 ? 'pointer' : 'not-allowed' }}>
            <Sparkles size={16} />
            {remainingSpins > 0 ? `Spin again — ${remainingSpins} spin${remainingSpins>1?'s':''} left` : 'No spins left today'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Possible Prizes ──────────────────────────────────────────────────────────
function PossiblePrizes() {
  const items = [
    { emoji:'🎁', label:'5% OFF',        color:'#c07d1a' },
    { emoji:'🥤', label:'Free Water',    color:'#1e3a8a' },
    { emoji:'🔥', label:'10% OFF',       color:'#9a2a0a' },
    { emoji:'🚀', label:'12% OFF',       color:'#14532d' },
    { emoji:'👑', label:'50% OFF',       color:'#6b1212' },
  ];
  return (
    <div style={{ marginTop:24, padding:'16px 18px', borderRadius:20, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
      <p style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,0.25)', margin:'0 0 14px' }}>What you could win</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {items.map(it => (
          <div key={it.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:14, background:`rgba(255,255,255,0.03)`, border:'1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize:18 }}>{it.emoji}</span>
            <div>
              <p style={{ margin:0, fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.8)' }}>{it.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── How It Works (collapsed) ─────────────────────────────────────────────────
function HowItWorksCollapsed() {
  const [open, setOpen] = useState(false);
  const steps = [
    { n:'01', t:'Enter your number', b:'No app or account needed.' },
    { n:'02', t:'Receive and keep your code', b:'One Spin & Win code is linked to your number.' },
    { n:'03', t:'Spin up to 3× a day', b:'Each spin reveals a real reward. The latest reward is the one used for your order.' },
    { n:'04', t:'Redeem at the counter', b:'Quote your code to the cashier. You do not have to use all 3 spins.' },
  ];
  return (
    <div style={{ marginTop:16, borderRadius:20, overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width:'100%', padding:'15px 18px', background:'rgba(255,255,255,0.03)', border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'12px', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', gap:8 }}>
          <Sparkles size={13} color="#f59e0b" /> How it works
        </span>
        <span style={{ fontSize:'12px', fontWeight:700, color:'rgba(181,69,27,0.8)', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>▾</span>
      </button>
      {open && (
        <div style={{ background:'rgba(255,255,255,0.02)', padding:'4px 18px 18px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          {steps.map(s => (
            <div key={s.n} style={{ display:'flex', gap:14, padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize:'10px', fontWeight:900, color:'rgba(181,69,27,0.6)', width:22, paddingTop:2, letterSpacing:'0.05em' }}>{s.n}</span>
              <div><p style={{ margin:0, fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.75)' }}>{s.t}</p><p style={{ margin:'2px 0 0', fontSize:'12px', color:'rgba(255,255,255,0.35)', lineHeight:1.5 }}>{s.b}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Terms (collapsed) ────────────────────────────────────────────────────────
function TermsCollapsed() {
  const [open, setOpen] = useState(false);
  const rules = ['3 spins per number per day. Resets at midnight.','Each customer keeps one Spin & Win code. Keep it safe.','Code refresh is limited to once every 7 days.','Reward probabilities are not publicly displayed.','Only the latest unredeemed reward is applied to an order.','Rewards expire 24 hours after winning.','Redeemed in-store only — quote your code to the cashier.','One reward per order. Not combinable with other promotions.','Non-transferable. No cash equivalent.','1 device registration per day.','3 attempts to enter your code. Wrong entries lock the code for the day.','Crave & Co. may modify or end Spin & Win at any time.'];
  return (
    <div style={{ marginTop:8, marginBottom:8, borderRadius:20, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width:'100%', padding:'15px 18px', background:'rgba(255,255,255,0.02)', border:'none', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'12px', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', display:'flex', alignItems:'center', gap:8 }}>
          <Info size={13} color="rgba(255,255,255,0.3)" /> Terms &amp; Conditions
        </span>
        <span style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.3)', transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}>▾</span>
      </button>
      {open && (
        <ul style={{ margin:0, padding:'4px 18px 16px 18px', background:'rgba(255,255,255,0.02)', borderTop:'1px solid rgba(255,255,255,0.04)', listStyle:'none' }}>
          {rules.map((r,i) => (
            <li key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom: i < rules.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <CheckCircle2 size={13} color="rgba(181,69,27,0.5)" style={{ flexShrink:0, marginTop:2 }} />
              <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', lineHeight:1.55 }}>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Error Box ────────────────────────────────────────────────────────────────
function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ padding:'12px 16px', borderRadius:14, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', fontSize:'13px', color:'#fca5a5', lineHeight:1.5 }}>
      {msg}
    </div>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    id: i, left: Math.random()*100, delay: Math.random()*1,
    dur: 1.8 + Math.random()*1.4, rot: Math.random()*360,
    color: ['#b5451b','#e8803a','#f59e0b','#fbbf24','#fff8eb','#ff6b2b','#ffd700'][i%7],
    w: 5 + Math.random()*8, h: 3 + Math.random()*4,
  })), []);
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:49 }}>
      {pieces.map(p => (
        <span key={p.id} style={{ position:'absolute', top:0, left:`${p.left}%`, width:p.w, height:p.h, background:p.color, borderRadius:2, animation:`confetti-fall ${p.dur}s ${p.delay}s ease-out forwards`, transform:`rotate(${p.rot}deg)` }} />
      ))}
    </div>
  );
}
