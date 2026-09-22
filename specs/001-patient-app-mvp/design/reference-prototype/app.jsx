/* app.jsx — shell: router, tab bar, context, scaling, Tweaks */

const ACCENTS = {
  blue:    { main: '#1283FF', d: '#0F6BCC', bg: '#E4F0FF', sh: 'rgba(18,131,255,.26)' },
  aqua:    { main: '#02BBB5', d: '#029E99', bg: '#E2F8F6', sh: 'rgba(2,187,181,.26)'  },
  emerald: { main: '#01C4A2', d: '#019A7F', bg: '#E1F8F1', sh: 'rgba(1,196,162,.26)'  },
  violet:  { main: '#724DD0', d: '#5C3AB0', bg: '#ECE6FA', sh: 'rgba(114,77,208,.26)' },
  mint:    { main: '#3FC366', d: '#2FA552', bg: '#E8F9EE', sh: 'rgba(85,215,127,.30)' },
};
const hexToKey = (hex) => Object.keys(ACCENTS).find(k => ACCENTS[k].main.toLowerCase() === hex.toLowerCase()) || 'blue';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "lang": "en",
  "accent": "blue",
  "fontScale": 1
}/*EDITMODE-END*/;

function useFit(w, h, pad = 40) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerWidth - pad) / w, (window.innerHeight - pad) / h));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [w, h, pad]);
  return scale;
}

/* ── Shake detector ──────────────────────────────────────── */
function useShake(cbRef, threshold = 15) {
  const last = useRef(0);
  useEffect(() => {
    const handler = (e) => {
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (!a) return;
      const mag = Math.sqrt((a.x||0)**2 + (a.y||0)**2 + (a.z||0)**2);
      if (mag > threshold && Date.now() - last.current > 1500) {
        last.current = Date.now();
        cbRef.current?.();
      }
    };
    window.addEventListener('devicemotion', handler, true);
    return () => window.removeEventListener('devicemotion', handler, true);
  }, [threshold]);
}

/* ── Tab bar ─────────────────────────────────────────────── */
function TabBar() {
  const { t, lang, tab, setTab, openQuickLog } = useApp();

  const Tab = ({ id, icon, label }) => (
    <button className={cx('tab', tab === id && 'active')} onClick={() => setTab(id)}>
      <Icon name={icon} size={24} stroke={tab === id ? 2.1 : 1.9} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="tabbar">
      <Tab id="home"    icon="home"        label={t('tab_home')}    />
      <Tab id="map"     icon="map-pin"     label={t('tab_map')}     />
      <div className="tab tab-fab">
        <div className="fab" onClick={openQuickLog}>
          <Icon name="plus" size={26} stroke={2.4} />
        </div>
      </div>
      <Tab id="meds"    icon="pill"        label={t('tab_meds')}    />
      <Tab id="profile" icon="user"        label={t('tab_profile')} />
    </div>
  );
}

/* ── Main app (post-auth) ────────────────────────────────── */
function MainApp() {
  const { tab, setTab, flowOpen, openFlow, closeFlow, finishFlow, quickLogOpen, openQuickLog, closeQuickLog, navHidden } = useApp();
  const [navLoading, setNavLoading] = useState(false);
  const firstTab = useRef(true);
  useEffect(() => {
    if (firstTab.current) { firstTab.current = false; return; }
    setNavLoading(true);
    const t = setTimeout(() => setNavLoading(false), 520);
    return () => clearTimeout(t);
  }, [tab]);

  /* 'trends', 'records', 'appts' are sub-screens (not in the tab bar) reached from Home/Profile */
  const Screen = {
    home:    HomeScreen,
    trends:  TrendsScreen,
    map:     MapScreen,
    meds:    MedsScreen,
    profile: ProfileScreen,
    records: () => <RecordsScreen onBack={() => setTab('home')} />,
    appts:   () => <AppointmentsScreen onBack={() => setTab('home')} />,
  }[tab] || HomeScreen;

  /* Hide tab bar on full-screen sub-screens */
  const hideTabBar = tab === 'trends' || tab === 'records' || tab === 'appts' || navHidden;

  return (
    <div className="screen">
      <DSTopLoadingBar loading={navLoading} variant="accent" />
      <Screen />
      {!hideTabBar && <TabBar />}
      {quickLogOpen && !flowOpen && (
        <QuickLogSheet
          onClose={closeQuickLog}
          onFullCheckin={() => { closeQuickLog(); openFlow(); }}
        />
      )}
      {flowOpen && <ReportFlow onClose={closeFlow} onDone={finishFlow} />}
    </div>
  );
}

/* ── Root app ────────────────────────────────────────────── */
function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const lang   = tw.lang;
  const dir    = lang === 'ar' ? 'rtl' : 'ltr';
  const accentKey = tw.accent in ACCENTS ? tw.accent : 'blue';
  const A = ACCENTS[accentKey];

  const [route, setRoute]     = useState('welcome');
  const [tab, setTab]         = useState('home');
  const [booting, setBooting] = useState(() => !sessionStorage.getItem('balsm_booted'));
  useEffect(() => {
    if (!booting) return;
    const t = setTimeout(() => { setBooting(false); sessionStorage.setItem('balsm_booted', '1'); }, 1700);
    return () => clearTimeout(t);
  }, []);
  const [phone, setPhone]           = useState('+20 10 1234 5678');
  const [authEmail, setAuthEmail]   = useState('');
  const [authMethod, setAuthMethod] = useState('phone'); // 'phone' | 'email'
  const [today, setToday]               = useState(null);
  const [flowOpen, setFlowOpen]         = useState(false);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [activeAccountId, setActiveAccountId] = useState('layla');
  const account = FAMILY_ACCOUNTS.find(a => a.id === activeAccountId) || FAMILY_ACCOUNTS[0];
  const [countryCode, setCountryCode] = useState('EG');
  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  const [storageProviders, setStorageProviders] = useState({ active: 'local' });

  /* ── Dev config ──────────────────────────────────────── */
  const [devOpen, setDevOpen] = useState(false);
  const [devShot, setDevShot] = useState(null);
  const devCbRef = useRef(null);
  const captureAndOpen = useCallback(async () => {
    let shot = null;
    try {
      if (window.html2canvas) {
        const el = document.querySelector('.screen') ||
                   document.querySelector('.stage-full > div');
        if (el) {
          const canvas = await window.html2canvas(el, {
            scale: 0.6, useCORS: true, logging: false, allowTaint: true,
          });
          shot = canvas.toDataURL('image/jpeg', 0.82);
        }
      }
    } catch {}
    setDevShot(shot);
    setDevOpen(true);
  }, []);
  devCbRef.current = captureAndOpen;
  useShake(devCbRef);
  useEffect(() => {
    const kh = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        captureAndOpen();
      }
    };
    window.addEventListener('keydown', kh);
    window.openDevConfig = captureAndOpen;
    return () => {
      window.removeEventListener('keydown', kh);
      delete window.openDevConfig;
    };
  }, [captureAndOpen]);
  const switchCloudProvider = (to) => {
    setStorageProviders({ active: to });
    // Migrate all records that were on the old cloud to the new one
    const prev = storageProviders.active;
    if (prev !== 'local' && to !== 'local') {
      setRecordStorageMap(m => {
        const next = { ...m };
        HEALTH_RECORDS.forEach(r => { if ((m[r.id] || r.storage) === prev) next[r.id] = to; });
        return next;
      });
    }
  };

  /* Global record-storage overrides — updated by migrations & per-record manage actions */
  const [recordStorageMap, setRecordStorageMap] = useState({});
  const setRecordStorage = (id, loc) => setRecordStorageMap(m => ({ ...m, [id]: loc }));
  const migrateRecords   = (from, to) => {
    setRecordStorageMap(prev => {
      const next = { ...prev };
      HEALTH_RECORDS.forEach(r => { if ((prev[r.id] || r.storage) === from) next[r.id] = to; });
      return next;
    });
    setPrimaryStorage(to);
  };

  const t = useCallback((key) => (STR[key] && (STR[key][lang] ?? STR[key].en)) ?? key, [lang]);

  const go = (r) => {
    if (r === 'app')     { setTab('home'); setToday(null); }
    if (r === 'welcome') { setToday(null); }
    setRoute(r);
  };

  const ctx = {
    t, lang, dir, accent: accentKey,
    setLang: (l) => setTweak('lang', l),
    phone, setPhone,
    authEmail, setAuthEmail, authMethod, setAuthMethod,
    go, tab, setTab,
    today, completeCheckin: setToday,
    flowOpen,
    openFlow:  () => setFlowOpen(true),
    closeFlow: () => setFlowOpen(false),
    quickLogOpen,
    navHidden, setNavHidden,
    openQuickLog:  () => setQuickLogOpen(true),
    closeQuickLog: () => setQuickLogOpen(false),
    account, switchAccount: setActiveAccountId,
    country, setCountry: setCountryCode,
    storageProviders, switchCloudProvider,
    recordStorageMap, setRecordStorage, migrateRecords,
    finishFlow: (toTab) => { setFlowOpen(false); setTab(toTab); },
  };

  const scale = useFit(402, 874, 40);

  const AuthScreen = { welcome: WelcomeScreen, phone: PhoneScreen, otp: OtpScreen, profile: ProfileSetupScreen }[route];

  const accentVars = {
    '--app-accent':        A.main,
    '--app-accent-600':    A.d,
    '--app-accent-50':     A.bg,
    '--app-accent-shadow': `0 8px 22px ${A.sh}`,
    '--ui-scale': tw.fontScale,
  };

  return (
    <AppCtx.Provider value={ctx}>
      <div className="stage" style={accentVars}>
        {/* Tablet/desktop: iOS frame + companion panel */}
        <div className="stage-frame-wrap" style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
            <IOSDevice>
              <div dir={dir} style={{ height: '100%', position: 'absolute', inset: 0 }}>
                {route === 'app' ? <MainApp /> : <AuthScreen />}
                {devOpen && <DevConfigOverlay onClose={() => setDevOpen(false)} screenshot={devShot} />}
                <DSLoadingOverlay open={booting} variant="brand" spinner="mark"
                  backgroundImage="assets/balsm-background.png"
                  message={lang === 'ar' ? 'نُجهّز سجلّك الصحي' : 'Preparing your health record'}
                  submessage={lang === 'ar' ? 'على جهازك، بالتصميم.' : 'On your device, by design.'} />
              </div>
            </IOSDevice>
          </div>

          {/* Desktop companion panel — contextual to auth vs. signed-in app */}
          <div className="stage-companion">
            {route === 'app' ? (
              <>
                <div className="stage-companion-card">
                  <h3>{lang === 'ar' ? 'الحساب' : 'Patient'}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 9999, background: account.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{account.initials}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg1)' }}>{account.name[lang] ?? account.name.en}</div>
                      <div style={{ fontSize: 12, color: 'var(--fg3)', marginTop: 2 }}>{account.age} · {account.relation[lang] ?? account.relation.en}</div>
                    </div>
                  </div>
                </div>
                <div className="stage-companion-card">
                  <h3>{lang === 'ar' ? 'إجراءات سريعة' : 'Quick actions'}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      [lang === 'ar' ? 'تسجيل قراءة' : 'Log reading',  'activity', () => setQuickLogOpen(true)],
                      [lang === 'ar' ? 'عرض السجلات' : 'View records', 'folder',   () => setTab('records')],
                      [lang === 'ar' ? 'رعاية قريبة' : 'Nearby care',  'map-pin',  () => setTab('map')],
                    ].map(([label, icon, fn]) => (
                      <button key={label} className="btn secondary block" onClick={fn} style={{ height: 40, fontSize: 13, justifyContent: 'flex-start', paddingInlineStart: 12 }}>
                        <Icon name={icon} size={15} />{label}
                      </button>
                    ))}
                    <button className="btn block" onClick={captureAndOpen}
                      style={{ height: 40, fontSize: 12, justifyContent: 'flex-start', paddingInlineStart: 12,
                        background: '#1A1A17', color: '#A3FF6E', border: 'none',
                        fontFamily: 'var(--font-mono)', letterSpacing: '0.03em', gap: 8 }}>
                      <Icon name="terminal" size={14} stroke={2.2} style={{ color: '#A3FF6E' }} />
                      Dev config
                    </button>
                  </div>
                </div>
                <div className="stage-companion-card" style={{ fontSize: 12, color: 'var(--fg3)', lineHeight: 1.5, textAlign: 'center' }}>
                  <img src="assets/logo-vertical.svg" alt="Balsm" style={{ width: 48, display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
                  Balsm Patient App MVP
                </div>
              </>
            ) : (
              <div className="stage-companion-card" style={{ textAlign: 'center', padding: '28px 22px' }}>
                <img src="assets/logo-vertical.svg" alt="Balsm.health" style={{ width: 64, display: 'block', margin: '0 auto 14px' }} />
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19, color: 'var(--fg1)', letterSpacing: '-0.01em' }}>
                  Balsm<span style={{ fontWeight: 600, fontSize: 15, color: 'var(--fg3)' }}>.health</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--fg3)', lineHeight: 1.55, margin: '8px 0 20px', textWrap: 'pretty' }}>{t('w_sub')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'start' }}>
                  {[['smartphone', t('trust_device')], ['lock', t('trust_private')], ['cloud-off', t('trust_offline')]].map(([icon, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: 'var(--fg2)' }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--app-accent-50)', color: 'var(--app-accent-600)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name={icon} size={16} />
                      </span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: full-viewport without frame */}
        <div className="stage-full">
          <div dir={dir} style={{ position: 'absolute', inset: 0, background: 'var(--balsm-surface, #fff)' }}>
            {route === 'app' ? <MainApp /> : <AuthScreen />}
            {devOpen && <DevConfigOverlay onClose={() => setDevOpen(false)} screenshot={devShot} />}
            <DSLoadingOverlay open={booting} variant="brand" spinner="mark"
              backgroundImage="assets/balsm-background.png"
              message={lang === 'ar' ? 'نُجهّز سجلّك الصحي' : 'Preparing your health record'}
              submessage={lang === 'ar' ? 'على جهازك، بالتصميم.' : 'On your device, by design.'} />
          </div>
        </div>
      </div>

      {/* Floating DEV trigger — shake on mobile · Ctrl+Shift+D anywhere */}
      <button onClick={captureAndOpen}
        title="Dev Config (Ctrl+Shift+D)"
        style={{
          position: 'fixed', bottom: 20, left: 20, zIndex: 9990,
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#1A1A17', color: '#A3FF6E',
          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
          padding: '6px 11px', borderRadius: 8, border: 'none', cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(0,0,0,.28)', opacity: 0.72,
          transition: 'opacity 150ms',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '.72'}>
        <Icon name="terminal" size={12} stroke={2.2} style={{ color: '#A3FF6E' }} />
        DEV
      </button>

      <TweaksPanel>
        <TweakSection label={t('p_lang')} />
        <TweakRadio label="Language" value={lang === 'ar' ? 'العربية' : 'English'} options={['English', 'العربية']}
          onChange={(v) => setTweak('lang', v === 'العربية' ? 'ar' : 'en')} />
        <TweakSection label="Accent hue" />
        <TweakColor label="Accent" value={A.main}
          options={Object.values(ACCENTS).map(a => a.main)}
          onChange={(hex) => setTweak('accent', hexToKey(hex))} />
        <TweakSection label="Accessibility" />
        <TweakSlider label="Text size" value={tw.fontScale} min={0.9} max={1.3} step={0.05} unit="×"
          onChange={(v) => setTweak('fontScale', v)} />
      </TweaksPanel>
    </AppCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
