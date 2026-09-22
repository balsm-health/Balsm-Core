/* auth.jsx — Welcome → Phone → OTP → Profile setup */

/* Calm mood face drawn from arcs (no emoji) — shared with report flow */
function MoodFace({ level, size = 34, color }) {
  // level 1..5 → mouth curvature. eyes are simple dots.
  const curve = { 1: 7, 2: 3, 3: 0, 4: -4, 5: -8 }[level] ?? 0;
  const cy = 21 + (curve > 0 ? 1 : 0);
  const d = `M9 ${cy} Q17 ${cy + curve * 1.4} 25 ${cy}`;
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" style={{ display: 'block' }}>
      <circle cx="12.5" cy="14" r="1.9" fill={color} />
      <circle cx="21.5" cy="14" r="1.9" fill={color} />
      <path d={d} stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/* Apple + Google brand icons (inline SVG, no external deps) */
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.86-3.08.38-1.08-.49-2.07-.48-3.2 0-1.42.61-2.17.44-3.05-.38C2.38 14.9 3.2 7.05 9.32 6.72c1.35.07 2.28.74 3.07.8 1.16-.22 2.27-.92 3.5-.83 1.5.12 2.63.72 3.36 1.82-3.1 1.86-2.37 5.95.48 7.1-.57 1.53-1.31 3.04-2.68 4.67zM12.03 6.65c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function WelcomeScreen() {
  const { t, lang, setLang, go } = useApp();
  const handleSocial = (provider) => {
    // Simulate instant social auth → go straight to profile setup
    go('profile');
  };
  return (
    <div className="welcome fade-in">
      <div className="wbg" style={{ backgroundImage: 'url(assets/balsm-background.png)' }} />
      <div className="wgrad" />
      <div className="pad-top" />
      <div className="wbody">
        <img className="wlogo" src="assets/logo-vertical.svg" alt="Balsm.health" />
        <div className="wtitle" style={{ textWrap: 'balance' }}>{t('w_title')}</div>
        <div className="wsub" style={{ textWrap: 'pretty' }}>{t('w_sub')}</div>
        <div className="wactions">
          {/* Primary: phone */}
          <button className="btn primary lg block" onClick={() => go('phone')}>{t('w_start')}</button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.28)' }} />
            <span style={{ fontSize: 'var(--pt-xs)', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{t('w_or')}</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.28)' }} />
          </div>

          {/* Apple */}
          <button className="btn block" onClick={() => handleSocial('apple')} style={{
            height: 52, background: '#1A1A17', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, fontSize: 'var(--pt-md)', fontWeight: 600, cursor: 'pointer', width: '100%',
          }}>
            <AppleIcon />{t('w_apple')}
          </button>

          {/* Google */}
          <button className="btn block" onClick={() => handleSocial('google')} style={{
            height: 52, background: '#fff', color: '#3C3C3A', border: '1.5px solid rgba(60,60,58,0.18)',
            borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, fontSize: 'var(--pt-md)', fontWeight: 600, cursor: 'pointer', width: '100%',
          }}>
            <GoogleIcon />{t('w_google')}
          </button>

          <div className="signin-link" onClick={() => go('phone')}>
            {t('w_have')} <b>{t('w_signin')}</b>
          </div>
        </div>
      </div>
      <div className="trust">
        <div className="ti"><Icon name="smartphone" size={22} /><span>{t('trust_device')}</span></div>
        <div className="ti"><Icon name="lock" size={22} /><span>{t('trust_private')}</span></div>
        <div className="ti"><Icon name="cloud-off" size={22} /><span>{t('trust_offline')}</span></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 20px 0' }}>
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px',
            borderRadius: 999, cursor: 'pointer',
            background: 'rgba(26,26,23,0.42)', border: '1px solid rgba(255,255,255,0.32)',
            color: '#fff', fontWeight: 700, fontSize: 'var(--pt-sm)',
          }}>
          <Icon name="languages" size={17} />
          <span style={{ fontFamily: lang === 'ar' ? 'var(--font-body)' : 'var(--font-arabic)' }}>
            {lang === 'ar' ? 'English' : 'العربية'}
          </span>
        </button>
      </div>
      <div className="pad-bottom" />
    </div>
  );
}

function AuthHeader({ onBack, step }) {
  return (
    <div className="appbar">
      <button className="round-btn" onClick={onBack} aria-label="Back"><Icon name="arrow-left" /></button>
      <div className="grow" />
      {step && (
        <div className="segmented" style={{ padding: 4, gap: 4, background: 'transparent', border: 'none' }}>
          {[0,1,2].map(i => (
            <span key={i} style={{
              width: i === step - 1 ? 22 : 7, height: 7, borderRadius: 999,
              background: i <= step - 1 ? 'var(--app-accent)' : 'var(--balsm-ink-200)',
              transition: 'all .25s var(--ease-out)', display: 'inline-block',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

function PhoneScreen() {
  const { t, lang, go, phone, setPhone, authEmail, setAuthEmail, authMethod, setAuthMethod } = useApp();
  const [mode, setMode] = useState(authMethod || 'phone');
  const isEmail = mode === 'email';
  const [val, setVal] = useState('');
  const [dialCode, setDialCode] = useState('EG');
  const [pickerOpen, setPickerOpen] = useState(false);
  const dc = DIAL_CODES.find(c => c.code === dialCode) || DIAL_CODES[0];

  const switchMode = (m) => { setMode(m); setAuthMethod(m); setVal(''); };

  const emailOk = isEmail && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val);
  const phoneOk = !isEmail && val.replace(/\D/g, '').length >= 10;
  const ok = isEmail ? emailOk : phoneOk;

  const submit = () => {
    if (!ok) return;
    if (isEmail) { setAuthEmail(val); } else { setPhone(dc.dial + ' ' + val); }
    go('otp');
  };

  return (
    <div className="screen cream fade-in">
      <div className="pad-top" />
      <AuthHeader onBack={() => go('welcome')} step={1} />
      <div className="screen-scroll px-20">
        <div className="segmented" style={{ width: '100%', marginTop: 10, marginBottom: 24 }}>
          <button className={cx(!isEmail && 'active')} onClick={() => switchMode('phone')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="phone" size={14} />{t('ph_label')}
          </button>
          <button className={cx(isEmail && 'active')} onClick={() => switchMode('email')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="mail" size={14} />{t('em_label')}
          </button>
        </div>
        <h1 className="title" style={{ margin: '0 0 8px' }}>{isEmail ? t('em_title') : t('ph_title')}</h1>
        <p className="body" style={{ margin: '0 0 24px' }}>{isEmail ? t('em_help') : t('ph_help')}</p>
        {isEmail ? (
          <div className="field">
            <label>{t('em_label')}</label>
            <input className="input" type="email" inputMode="email" autoFocus dir="ltr"
              placeholder={t('em_ph')} value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
          </div>
        ) : (
          <div className="field">
            <label>{t('ph_label')}</label>
            <div className="phone-field">
              <button type="button" className="dial-code" onClick={() => setPickerOpen(true)}
                style={{ cursor: 'pointer', background: '#fff' }}>
                <span className="flag">{dc.flag}</span>
                <span className="num" style={{ direction: 'ltr' }}>{dc.dial}</span>
                <Icon name="chevron-down" size={15} style={{ color: 'var(--fg3)', marginInlineStart: 1 }} />
              </button>
              <input className="input num" inputMode="tel" autoFocus
                placeholder="10 1234 5678" value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
              />
            </div>
          </div>
        )}
      </div>
      <div className="flow-foot" style={{ flexDirection: 'column', gap: 14 }}>
        <button className={cx('btn primary lg block', !ok && 'is-disabled')} onClick={submit}>{t('continue')}</button>
        <p className="meta" style={{ textAlign: 'center', margin: 0, lineHeight: 1.5 }}>{t('ph_terms')}</p>
      </div>
      {pickerOpen && (
        <DialCodePicker lang={lang} current={dialCode}
          onPick={c => setDialCode(c.code)} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}

function OtpScreen() {
  const { t, lang, go, phone, authEmail, authMethod } = useApp();
  const isEmail = authMethod === 'email';
  const contact = isEmail ? authEmail : phone;
  const [code, setCode] = useState('');
  const [secs, setSecs] = useState(28);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);
  useEffect(() => {
    if (secs <= 0) return;
    const id = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secs]);
  const ok = code.length === 6;
  const [verifying, setVerifying] = useState(false);
  const submit = () => { if (!ok || verifying) return; setVerifying(true); setTimeout(() => go('profile'), 950); };
  // auto-submit on 6th digit
  useEffect(() => { if (code.length === 6) { const id = setTimeout(submit, 280); return () => clearTimeout(id); } }, [code]);
  return (
    <div className="screen cream fade-in">
      <div className="pad-top" />
      <AuthHeader onBack={() => go('phone')} step={2} />
      <div className="screen-scroll px-20">
        <h1 className="title mt-8" style={{ margin: '8px 0 8px' }}>{t('otp_title')}</h1>
        <p className="body" style={{ margin: '0 0 28px' }}>
          {isEmail ? t('em_otp_h') : t('otp_help')} <b style={{ color: 'var(--fg1)', direction: 'ltr', display: 'inline-block' }}>{contact}</b>
        </p>
        <div className="otp-row" onClick={() => inputRef.current && inputRef.current.focus()} dir="ltr">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className={cx('otp-box', code[i] && 'filled', code.length === i && 'active')}>
              {code[i] || ''}
            </div>
          ))}
        </div>
        <input
          ref={inputRef} inputMode="numeric" maxLength={6}
          value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0,6))}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0 }}
        />
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          {secs > 0
            ? <span className="meta">{t('otp_in')} <b className="num">{secs}s</b></span>
            : <button className="btn ghost" onClick={() => setSecs(28)}>{t('otp_resend')}</button>}
        </div>
      </div>
      <div className="flow-foot">
        <DSProgressButton block variant="primary" loading={verifying} disabled={!ok} onClick={submit}>
          {verifying ? (lang === 'ar' ? 'جارٍ التحقق…' : 'Verifying…') : t('verify')}
        </DSProgressButton>
      </div>
    </div>
  );
}

/* Username availability hook — shared by ProfileSetup & PersonalDetails */
const TAKEN_HANDLES = new Set(['layla','hassan','balsm','admin','doctor','health','user','support','test','omar','sara','mona','ahmed']);
function useUsername(initial) {
  const [handle, setHandleRaw] = useState(initial || '');
  const [status, setStatus]    = useState('idle'); // idle | checking | available | taken | invalid
  const timerRef = useRef(null);

  const isValid = (v) => /^[a-z0-9_]{3,20}$/.test(v);

  const setHandle = (raw) => {
    const v = raw.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setHandleRaw(v);
    if (!v) { setStatus('idle'); return; }
    if (!isValid(v)) { setStatus('invalid'); return; }
    setStatus('checking');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setStatus(TAKEN_HANDLES.has(v) ? 'taken' : 'available');
    }, 700);
  };

  return [handle, setHandle, status];
}

function UsernameField({ handle, setHandle, status, t, lang }) {
  const icon = { idle: null, checking: 'loader', available: 'check-circle-2', taken: 'x-circle', invalid: 'alert-circle' }[status];
  const col  = { idle: 'var(--fg4)', checking: 'var(--fg3)', available: 'var(--hue-mint-600)', taken: 'var(--balsm-danger)', invalid: 'var(--balsm-sun-500)' }[status];
  const msg  = { idle: '', checking: t('un_checking'), available: t('un_avail'), taken: t('un_taken'), invalid: t('un_invalid') }[status];
  return (
    <div className="field">
      <label>{t('un_label')}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 'var(--pt-sm)', fontWeight: 700, color: 'var(--fg3)', fontFamily: 'var(--font-mono)', userSelect: 'none', zIndex: 1, lineHeight: 1, pointerEvents: 'none' }}>@</span>
        <input className="input num" dir="ltr" placeholder={t('un_ph')} value={handle}
          onChange={e => setHandle(e.target.value)}
          style={{ paddingLeft: 28, paddingRight: icon ? 36 : 12 }} />
        {icon && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
            <Icon name={icon} size={17} style={{ color: col, animation: status === 'checking' ? 'spin 0.9s linear infinite' : 'none' }} />
          </span>
        )}
      </div>
      {msg && <div style={{ fontSize: 'var(--pt-xs)', color: col, marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>{msg}</div>}
    </div>
  );
}

function ProfileSetupScreen() {
  const { t, lang, go } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const name = (firstName + ' ' + lastName).trim();
  const [dob, setDob]       = useState(''); // ISO yyyy-mm-dd
  const [dobOpen, setDobOpen] = useState(false);
  const [gender, setGender] = useState('female');

  // Auto-suggest handle from name
  const suggest = (f, l) => (f + (l ? '_' + l : '')).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
  const [handle, setHandle, unStatus] = useUsername('');

  // When name changes and handle is still empty/was auto-suggested, update
  const prevSuggest = useRef('');
  useEffect(() => {
    const s = suggest(firstName, lastName);
    if (handle === '' || handle === prevSuggest.current) {
      prevSuggest.current = s;
      if (s.length >= 3) setHandle(s);
    }
  }, [firstName, lastName]);

  const ok = name.trim().length > 1 && (unStatus === 'available' || unStatus === 'idle');
  const [creating, setCreating] = useState(false);
  const createAccount = () => { if (!ok || creating) return; setCreating(true); setTimeout(() => go('app'), 1150); };

  return (
    <div className="screen cream fade-in">
      <div className="pad-top" />
      <AuthHeader onBack={() => go('otp')} step={3} />
      <div className="screen-scroll px-20" style={{ paddingBottom: 12 }}>
        <h1 className="title mt-8" style={{ margin: '8px 0 8px' }}>{t('pf_title')}</h1>
        <p className="body" style={{ margin: '0 0 24px' }}>{t('pf_help')}</p>
        <div className="gap-16">
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>{t('pf_fname')}</label>
              <input className="input" placeholder={t('pf_fname_ph')} value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>{t('pf_lname')}</label>
              <input className="input" placeholder={t('pf_lname_ph')} value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <UsernameField handle={handle} setHandle={setHandle} status={unStatus} t={t} lang={lang} />
            {handle && (
              <div style={{ fontSize: 'var(--pt-xs)', color: 'var(--fg3)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="link" size={12} />
                <span dir="ltr" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg3)' }}>balsm.health/@{handle}</span>
              </div>
            )}
          </div>
          <div className="field">
            <label>{t('pf_dob')}</label>
            <button type="button" className="input" onClick={() => setDobOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'start' }}>
              <Icon name="calendar" size={17} style={{ color: 'var(--fg3)', flexShrink: 0 }} />
              <span className={dob ? 'num' : ''} style={{ flex: 1, color: dob ? 'var(--fg1)' : 'var(--fg3)', direction: 'ltr', textAlign: 'start' }}>
                {dob ? fmtDob(dob, lang) : (lang === 'ar' ? 'يوم / شهر / سنة' : 'DD / MM / YYYY')}
              </span>
              <Icon name="chevron-down" size={15} style={{ color: 'var(--fg3)', flexShrink: 0 }} />
            </button>
          </div>
          <div className="field">
            <label>{t('pf_gender')}</label>
            <div className="segmented">
              <button className={cx(gender === 'female' && 'active')} onClick={() => setGender('female')}>{t('pf_female')}</button>
              <button className={cx(gender === 'male' && 'active')} onClick={() => setGender('male')}>{t('pf_male')}</button>
            </div>
          </div>
        </div>
      </div>
      <div className="flow-foot" style={{ flexDirection: 'column', gap: 12 }}>
        <DSProgressButton block variant="primary" loading={creating} disabled={!ok} onClick={createAccount}>
          {creating ? (lang === 'ar' ? 'جارٍ إنشاء حسابك…' : 'Creating your account…') : t('pf_create')}
        </DSProgressButton>
        <p className="meta" style={{ textAlign: 'center', margin: 0, display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
          <Icon name="shield-check" size={14} />{t('pf_secure')}
        </p>
      </div>
      {dobOpen && (
        <DobPicker lang={lang} value={dob}
          onPick={iso => setDob(iso)} onClose={() => setDobOpen(false)} />
      )}
    </div>
  );
}

/* ── Date-of-birth calendar picker ──────────────────────── */
function fmtDob(iso, lang) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = lang === 'ar'
    ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}

function DobPicker({ onClose, onPick, value, lang }) {
  const today = new Date();
  const init = value ? new Date(value + 'T00:00:00') : new Date(today.getFullYear() - 25, today.getMonth(), 1);
  const [view, setView] = useState({ y: init.getFullYear(), m: init.getMonth() });
  const [sel, setSel] = useState(value || '');
  const [mode, setMode] = useState('day'); // 'day' | 'year'

  const months = lang === 'ar'
    ? ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
    : ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const wd = lang === 'ar' ? ['أحد','إثن','ثلا','أرب','خمي','جمع','سبت'] : ['Su','Mo','Tu','We','Th','Fr','Sa'];

  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysIn = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);

  const prevMonth = () => setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  const nextMonth = () => setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });

  const pick = (d) => {
    const iso = `${view.y}-${String(view.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setSel(iso);
  };
  const isFuture = (d) => new Date(view.y, view.m, d) > today;
  const years = []; for (let y = today.getFullYear(); y >= 1920; y--) years.push(y);

  return (
    <>
      <style>{`@keyframes dobUp{from{transform:translateY(110%)}to{transform:none}}`}</style>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(43,43,37,0.36)' }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 61,
        background: '#fff', borderRadius: '20px 20px 0 0',
        display: 'flex', flexDirection: 'column', maxHeight: '82%',
        animation: 'dobUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        <div style={{ padding: '10px 20px 0', flexShrink: 0 }}>
          <div style={{ width: 38, height: 4, borderRadius: 999, background: 'var(--balsm-ink-200)', margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-lg)', color: 'var(--fg1)' }}>
              {lang === 'ar' ? 'تاريخ الميلاد' : 'Date of birth'}
            </div>
            <button className="round-btn ghost" onClick={onClose}><Icon name="x" size={17} /></button>
          </div>
        </div>

        <div style={{ padding: '0 20px 8px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button className="round-btn ghost" onClick={prevMonth} aria-label="Previous month">
              <Icon name={lang === 'ar' ? 'chevron-right' : 'chevron-left'} size={18} />
            </button>
            <button onClick={() => setMode(mode === 'year' ? 'day' : 'year')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-md)', color: 'var(--fg1)' }}>
              {months[view.m]} {view.y}
              <Icon name="chevron-down" size={15} style={{ color: 'var(--fg3)' }} />
            </button>
            <button className="round-btn ghost" onClick={nextMonth} aria-label="Next month">
              <Icon name={lang === 'ar' ? 'chevron-left' : 'chevron-right'} size={18} />
            </button>
          </div>

          {mode === 'year' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, paddingBottom: 12 }}>
              {years.map(y => (
                <button key={y} onClick={() => { setView(v => ({ ...v, y })); setMode('day'); }}
                  className="num" style={{
                    height: 42, borderRadius: 12, cursor: 'pointer',
                    border: '1.5px solid ' + (y === view.y ? 'var(--app-accent)' : 'var(--balsm-border)'),
                    background: y === view.y ? 'var(--app-accent)' : '#fff',
                    color: y === view.y ? '#fff' : 'var(--fg1)', fontWeight: 600, fontSize: 'var(--pt-sm)',
                  }}>{y}</button>
              ))}
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
                {wd.map((w, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: 'var(--pt-xs)', fontWeight: 700, color: 'var(--fg3)' }}>{w}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {cells.map((d, i) => {
                  if (d === null) return <div key={i} />;
                  const iso = `${view.y}-${String(view.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const active = sel === iso;
                  const disabled = isFuture(d);
                  return (
                    <button key={i} disabled={disabled} onClick={() => pick(d)}
                      className="num" style={{
                        aspectRatio: '1', borderRadius: '50%', border: 'none', cursor: disabled ? 'default' : 'pointer',
                        background: active ? 'var(--app-accent)' : 'transparent',
                        color: disabled ? 'var(--balsm-ink-200)' : active ? '#fff' : 'var(--fg1)',
                        fontWeight: active ? 700 : 500, fontSize: 'var(--pt-sm)',
                      }}>{d}</button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '12px 20px calc(env(safe-area-inset-bottom, 0px) + 20px)', flexShrink: 0, borderTop: '1px solid var(--balsm-ink-50)' }}>
          <button className={cx('btn primary lg block', !sel && 'is-disabled')}
            onClick={() => { if (sel) { onPick(sel); onClose(); } }}>
            {sel ? (lang === 'ar' ? 'تأكيد' : 'Confirm') : (lang === 'ar' ? 'اختر تاريخاً' : 'Select a date')}
          </button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { MoodFace, WelcomeScreen, PhoneScreen, OtpScreen, ProfileSetupScreen, UsernameField, useUsername, AppleIcon, GoogleIcon, TAKEN_HANDLES, DobPicker, fmtDob });
