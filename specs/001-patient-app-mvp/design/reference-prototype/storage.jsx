/* storage.jsx — single cloud provider model: one active backup at a time */

/* ── Visual config per provider ──────────────────────────── */
const STORAGE_CFG = {
  local:  { icon: 'smartphone',  label: { en: 'This device',   ar: 'هذا الجهاز'  }, color: 'var(--balsm-ink-600)', bg: 'var(--balsm-ink-50)',  border: 'var(--balsm-ink-200)' },
  icloud: { icon: 'cloud',       label: { en: 'iCloud',        ar: 'آي كلاود'    }, color: '#1783FF',              bg: '#EAF2FF',               border: '#C0D8FF'              },
  gdrive: { icon: 'folder-open', label: { en: 'Google Drive',  ar: 'جوجل درايف'  }, color: '#1E8E3E',              bg: '#E6F4EA',               border: '#B3DFBB'              },
};

/* ── Small inline badge ───────────────────────────────────── */
function StorageBadge({ storage, size = 'sm' }) {
  const cfg = STORAGE_CFG[storage] || STORAGE_CFG.local;
  const isXs = size === 'xs';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: isXs ? 3 : 4,
      padding: isXs ? '2px 6px' : '3px 8px',
      borderRadius: 'var(--radius-pill)',
      border: `1px solid ${cfg.border}`,
      background: cfg.bg, color: cfg.color,
      fontSize: isXs ? '10px' : 'var(--pt-2xs)',
      fontWeight: 600, flexShrink: 0,
      fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
    }}>
      <Icon name={cfg.icon} size={isXs ? 10 : 12} stroke={2} />
      {cfg.label.en}
    </span>
  );
}

/* ── Usage bar ────────────────────────────────────────────── */
function UsageBar({ used, total, color }) {
  const pct = Math.min(100, (used / total) * 100);
  return (
    <div style={{ height: 5, borderRadius: 999, background: 'var(--balsm-ink-100)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: pct + '%', borderRadius: 999, background: color, transition: 'width 0.5s var(--ease-out)' }} />
    </div>
  );
}

/* ── Storage & sync sheet ─────────────────────────────────── */
const MIGRATE_STEPS = [
  { en: 'Preparing…',             ar: 'جارٍ التحضير…'           },
  { en: 'Transferring check-ins…', ar: 'نقل المتابعات…'          },
  { en: 'Transferring records…',   ar: 'نقل السجلات…'            },
  { en: 'Transferring prescriptions…', ar: 'نقل الوصفات…'        },
  { en: 'Verifying & finishing…',  ar: 'التحقق والإنهاء…'        },
];

function StorageSyncSheet({ onClose }) {
  const { t, lang, storageProviders, switchCloudProvider } = useApp();
  const active = storageProviders.active;

  /* sheet state: idle | connecting | migrating | done | confirm_disconnect */
  const [phase, setPhase]         = useState('idle');
  const [target, setTarget]       = useState(null);
  const [progress, setProgress]   = useState(0);

  const activeCfg = STORAGE_CFG[active] || STORAGE_CFG.local;
  const targetCfg = target ? STORAGE_CFG[target] : null;
  const pct = Math.round((progress / MIGRATE_STEPS.length) * 100);

  const runPhase = (to, mode) => {
    setTarget(to);
    setPhase(mode);
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p++;
      setProgress(p);
      if (p >= (mode === 'connecting' ? 1 : MIGRATE_STEPS.length)) {
        clearInterval(interval);
        switchCloudProvider(to);
        setTimeout(() => setPhase('done'), 250);
      }
    }, mode === 'connecting' ? 900 : 550);
  };

  const handleSelect = (to) => {
    if (to === active) return;
    if (to === 'local') {
      // disconnect cloud → confirm
      setTarget('local');
      setPhase('confirm_disconnect');
    } else if (active === 'local') {
      // local → cloud: just connect
      runPhase(to, 'connecting');
    } else {
      // cloud → cloud: migrate
      runPhase(to, 'migrating');
    }
  };

  const breakdown = [
    { key: 'store_checkins', used: 12.4,  icon: 'activity',  color: 'var(--hue-aqua)'    },
    { key: 'store_records',  used: 38.7,  icon: 'folder',    color: 'var(--hue-blue)'    },
    { key: 'store_rx',       used:  4.1,  icon: 'file-text', color: 'var(--hue-violet)'  },
  ];
  const totalUsed = breakdown.reduce((s, b) => s + b.used, 0);

  const providers = ['local', 'icloud', 'gdrive'];

  return (
    <>
      <style>{`
        @keyframes stSlideUp3{from{transform:translateY(110%)}to{transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>
      <div onClick={phase === 'idle' || phase === 'done' ? onClose : undefined}
        style={{ position:'absolute', inset:0, zIndex:40, background:'rgba(43,43,37,0.36)', backdropFilter:'blur(2px)' }} />

      <div style={{
        position:'absolute', bottom:0, left:0, right:0, zIndex:41,
        background:'#fff', borderRadius:'20px 20px 0 0',
        maxHeight:'92%', display:'flex', flexDirection:'column',
        animation:'stSlideUp3 0.3s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* Header */}
        <div style={{ padding:'10px 20px 0', flexShrink:0 }}>
          <div style={{ width:38, height:4, borderRadius:999, background:'var(--balsm-ink-200)', margin:'0 auto 12px' }} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:12, borderBottom:'1px solid var(--balsm-ink-100)' }}>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'var(--pt-lg)', color:'var(--fg1)', display:'flex', alignItems:'center', gap:10 }}>
              <Icon name="hard-drive" size={20} style={{ color:'var(--fg3)' }} />{t('storage')}
            </div>
            {(phase === 'idle' || phase === 'done' || phase === 'confirm_disconnect') &&
              <button className="round-btn ghost" onClick={onClose}><Icon name="x" size={17} /></button>}
          </div>
        </div>

        <div style={{ flex:1, overflowY: phase === 'idle' ? 'auto' : 'hidden', padding:'0 20px 36px' }}>

          {/* ── IDLE: provider selector ── */}
          {phase === 'idle' && (<>
            <p className="meta" style={{ margin:'12px 0 16px', lineHeight:1.5 }}>{t('store_help')}</p>

            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
              {providers.map(p => {
                const cfg = STORAGE_CFG[p];
                const isActive = active === p;
                const isLocal = p === 'local';
                return (
                  <div key={p} onClick={() => handleSelect(p)} style={{
                    padding:'16px', borderRadius:'var(--radius-xl)', cursor: isActive ? 'default' : 'pointer',
                    border: `1.5px solid ${isActive ? cfg.color : 'var(--balsm-border)'}`,
                    background: isActive ? cfg.bg : '#fff',
                    transition:'all var(--dur-base) var(--ease-out)',
                    display:'flex', alignItems:'center', gap:14,
                  }}>
                    <div style={{ width:46, height:46, borderRadius:'var(--radius-md)', flexShrink:0, background: isActive ? cfg.color : 'var(--balsm-ink-100)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Icon name={cfg.icon} size={22} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:'var(--pt-md)', color:'var(--fg1)', display:'flex', alignItems:'center', gap:8 }}>
                        {cfg.label[lang]}
                        {isLocal && <span className="pill neutral" style={{ fontSize:'var(--pt-2xs)', padding:'1px 7px' }}>Always on</span>}
                      </div>
                      <div style={{ fontSize:'var(--pt-xs)', color: isActive ? cfg.color : 'var(--fg4)', marginTop:3, fontWeight: isActive ? 600 : 400, display:'flex', alignItems:'center', gap:5 }}>
                        {isActive
                          ? <><Icon name="check-circle" size={12} />{isLocal ? t('store_local_only') : t('store_backed')}</>
                          : isLocal ? t('store_never') : t('store_connect')}
                      </div>
                    </div>
                    {isActive
                      ? <Icon name="check-circle-2" size={22} style={{ color:cfg.color, flexShrink:0 }} />
                      : <Icon name="chevron-right" size={18} style={{ color:'var(--fg4)', flexShrink:0, transform: lang==='ar' ? 'scaleX(-1)' : 'none' }} />}
                  </div>
                );
              })}
            </div>

            {/* Breakdown */}
            <div style={{ fontWeight:700, fontSize:'var(--pt-sm)', color:'var(--fg2)', marginBottom:12 }}>{t('store_breakdown')}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {breakdown.map(b => (
                <div key={b.key}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:'var(--pt-sm)', color:'var(--fg2)', fontWeight:500 }}>
                      <Icon name={b.icon} size={14} style={{ color:b.color }} />{t(b.key)}
                    </div>
                    <span className="num" style={{ fontSize:'var(--pt-sm)', color:'var(--fg3)' }}>{b.used.toFixed(1)} MB</span>
                  </div>
                  <UsageBar used={b.used} total={5120} color={b.color} />
                </div>
              ))}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:10, borderTop:'1px solid var(--balsm-ink-100)' }}>
                <span style={{ fontSize:'var(--pt-sm)', fontWeight:700, color:'var(--fg1)' }}>{t('store_usage')}</span>
                <span className="num" style={{ fontSize:'var(--pt-sm)', color:'var(--fg2)' }}>{totalUsed.toFixed(1)} MB {t('store_of')} 5 GB</span>
              </div>
            </div>
          </>)}

          {/* ── CONNECTING ── */}
          {phase === 'connecting' && targetCfg && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:18, padding:'32px 0 8px', animation:'fadeIn 0.2s' }}>
              <div style={{ width:72, height:72, borderRadius:'var(--radius-xl)', background:targetCfg.bg, color:targetCfg.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="loader" size={34} style={{ animation:'spin 0.9s linear infinite' }} />
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'var(--pt-xl)', color:'var(--fg1)', marginBottom:6 }}>
                  {lang==='ar' ? `جارٍ الربط بـ ${targetCfg.label.ar}…` : `Connecting to ${targetCfg.label.en}…`}
                </div>
                <p className="meta" style={{ margin:0 }}>{lang==='ar' ? 'سيبدأ النسخ الاحتياطي تلقائياً.' : 'Backup will start automatically.'}</p>
              </div>
            </div>
          )}

          {/* ── MIGRATING ── */}
          {phase === 'migrating' && targetCfg && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:20, padding:'24px 0 8px', animation:'fadeIn 0.2s' }}>
              {/* From → To */}
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderRadius:'var(--radius-xl)', background:'var(--balsm-ink-50)', alignSelf:'stretch' }}>
                <div style={{ width:40, height:40, borderRadius:'var(--radius-md)', background:activeCfg.bg, color:activeCfg.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon name={activeCfg.icon} size={20} />
                </div>
                <Icon name="arrow-right" size={18} style={{ color:'var(--fg3)', flexShrink:0 }} />
                <div style={{ width:40, height:40, borderRadius:'var(--radius-md)', background:targetCfg.bg, color:targetCfg.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon name={targetCfg.icon} size={20} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:'var(--pt-sm)', color:'var(--fg1)' }}>{lang==='ar' ? 'جارٍ النقل' : 'Migrating'}</div>
                  <div style={{ fontSize:'var(--pt-xs)', color:'var(--fg3)', marginTop:2 }}>{activeCfg.label[lang]} → {targetCfg.label[lang]}</div>
                </div>
                <span className="num" style={{ fontWeight:700, fontSize:'var(--pt-md)', color:targetCfg.color }}>{pct}%</span>
              </div>

              {/* Ring */}
              <div style={{ position:'relative', width:80, height:80 }}>
                <svg width={80} height={80} style={{ transform:'rotate(-90deg)' }}>
                  <circle cx={40} cy={40} r={33} fill="none" stroke="var(--balsm-ink-100)" strokeWidth={6} />
                  <circle cx={40} cy={40} r={33} fill="none" stroke={targetCfg.color} strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 33}
                    strokeDashoffset={2 * Math.PI * 33 * (1 - pct / 100)}
                    style={{ transition:'stroke-dashoffset 0.45s var(--ease-out)' }}
                  />
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'var(--pt-md)', color:'var(--fg1)' }}>{pct}%</div>
              </div>

              {/* Steps */}
              <div style={{ alignSelf:'stretch', display:'flex', flexDirection:'column', gap:6 }}>
                {MIGRATE_STEPS.map((s, i) => {
                  const done  = i < progress;
                  const act   = i === progress - 1 && !done;
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:'var(--radius-md)', background: act ? targetCfg.bg : 'transparent', transition:'background 0.3s' }}>
                      {done
                        ? <Icon name="check-circle-2" size={17} style={{ color:'var(--hue-mint-600)', flexShrink:0 }} />
                        : act
                          ? <Icon name="loader" size={17} style={{ color:targetCfg.color, flexShrink:0, animation:'spin 0.9s linear infinite' }} />
                          : <Icon name="circle" size={17} style={{ color:'var(--balsm-ink-200)', flexShrink:0 }} />}
                      <span style={{ fontSize:'var(--pt-sm)', fontWeight: act ? 600 : 400, color: done ? 'var(--fg4)' : act ? 'var(--fg1)' : 'var(--fg4)' }}>{s[lang]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {phase === 'done' && targetCfg && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, padding:'28px 0 8px', textAlign:'center', animation:'fadeIn 0.25s' }}>
              <div className="confirm-mark" style={{ width:68, height:68, margin:'0 auto' }}><Icon name="check" size={32} /></div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'var(--pt-xl)', color:'var(--fg1)' }}>
                {target === 'local'
                  ? (lang==='ar' ? 'تم إيقاف النسخ الاحتياطي' : 'Cloud backup removed')
                  : (lang==='ar' ? 'تمت المزامنة بنجاح' : 'All synced')}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 20px', borderRadius:'var(--radius-lg)', background:targetCfg.bg, border:`1px solid ${targetCfg.border}` }}>
                <Icon name={targetCfg.icon} size={18} style={{ color:targetCfg.color }} />
                <span style={{ fontSize:'var(--pt-sm)', fontWeight:600, color:'var(--fg1)' }}>
                  {target === 'local'
                    ? (lang==='ar' ? 'محفوظ على هذا الجهاز فقط' : 'Saved on this device only')
                    : (lang==='ar' ? `مزامن مع ${targetCfg.label.ar}` : `Synced with ${targetCfg.label.en}`)}
                </span>
              </div>
              <button className="btn primary block lg" style={{ marginTop:8 }} onClick={onClose}>
                {lang==='ar' ? 'تم' : 'Done'}
              </button>
            </div>
          )}

          {/* ── CONFIRM DISCONNECT ── */}
          {phase === 'confirm_disconnect' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14, padding:'20px 0 4px', animation:'fadeIn 0.2s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px', borderRadius:'var(--radius-xl)', background:'#FEF3F2', border:'1px solid #FECDCA' }}>
                <Icon name="cloud-off" size={22} style={{ color:'var(--balsm-danger)', flexShrink:0 }} />
                <div>
                  <div style={{ fontWeight:700, fontSize:'var(--pt-md)', color:'var(--fg1)', marginBottom:4 }}>{lang==='ar' ? 'إيقاف النسخ الاحتياطي؟' : 'Remove cloud backup?'}</div>
                  <p className="meta" style={{ margin:0, lineHeight:1.5 }}>
                    {lang==='ar' ? `ستُحذف بياناتك من ${activeCfg.label.ar} وتبقى على جهازك فقط.` : `Your data will be removed from ${activeCfg.label.en} and kept on this device only.`}
                  </p>
                </div>
              </div>
              <button className="btn danger block lg" onClick={() => runPhase('local', 'connecting')}>
                {lang==='ar' ? 'إيقاف النسخ الاحتياطي' : 'Remove cloud backup'}
              </button>
              <button className="btn secondary block" onClick={() => { setPhase('idle'); setTarget(null); }}>
                {lang==='ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Manage-storage action sheet (per record) ─────────────── */
function ManageStorageSheet({ rec, onClose, onAction }) {
  const { t, lang, storageProviders } = useApp();
  const cfg    = STORAGE_CFG[rec.storage || 'local'];
  const active = storageProviders.active;
  const isCloud = rec.storage === 'icloud' || rec.storage === 'gdrive';
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast]     = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => { setToast(null); onClose(); }, 1600); };

  if (confirm) {
    const isDev = confirm === 'remove_dev';
    return (
      <>
        <div onClick={() => setConfirm(null)} style={{ position:'absolute', inset:0, zIndex:52, background:'rgba(43,43,37,0.44)' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:53, background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px 36px', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'var(--pt-lg)', color:'var(--fg1)' }}>
            {isDev ? t('store_remove_dev') : t('store_delete_all')}
          </div>
          <p className="meta" style={{ margin:0, lineHeight:1.5 }}>
            {isDev ? t('store_remove_dev_h') : t('store_delete_all_h')}
          </p>
          <button className="btn danger block lg" style={{ marginTop:4 }}
            onClick={() => { onAction(isDev ? 'remove_dev' : 'delete_all'); showToast(isDev ? t('store_removed_dev') : null); }}>
            {isDev ? t('store_remove_dev') : t('store_delete_all')}
          </button>
          <button className="btn secondary block" onClick={() => setConfirm(null)}>{t('cancel')}</button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`@keyframes msSlideUp{from{transform:translateY(110%)}to{transform:none}}`}</style>
      <div onClick={onClose} style={{ position:'absolute', inset:0, zIndex:40, background:'rgba(43,43,37,0.36)', backdropFilter:'blur(2px)' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:41, background:'#fff', borderRadius:'20px 20px 0 0', animation:'msSlideUp 0.28s cubic-bezier(0.16,1,0.3,1) both' }}>
        <div style={{ padding:'10px 20px 0', borderBottom:'1px solid var(--balsm-ink-100)' }}>
          <div style={{ width:38, height:4, borderRadius:999, background:'var(--balsm-ink-200)', margin:'0 auto 12px' }} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:12 }}>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'var(--pt-lg)', color:'var(--fg1)', display:'flex', alignItems:'center', gap:10 }}>
              <Icon name={cfg.icon} size={19} style={{ color:cfg.color }} />{t('store_manage')}
            </div>
            <button className="round-btn ghost" onClick={onClose}><Icon name="x" size={17} /></button>
          </div>
        </div>

        <div style={{ padding:'14px 20px 36px', display:'flex', flexDirection:'column', gap:10 }}>
          {/* Current location */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:'var(--radius-lg)', background:cfg.bg, border:`1px solid ${cfg.border}`, marginBottom:6 }}>
            <Icon name={cfg.icon} size={16} style={{ color:cfg.color, flexShrink:0 }} />
            <div style={{ flex:1, fontSize:'var(--pt-sm)', fontWeight:600, color:'var(--fg1)' }}>
              {isCloud ? t('store_backed') : t('store_local_only')}
              <span style={{ fontWeight:400, color:'var(--fg3)', marginInlineStart:6 }}>· {cfg.label[lang]}</span>
            </div>
            <StorageBadge storage={rec.storage || 'local'} size="xs" />
          </div>

          {/* Back up to active cloud (if record is local and active cloud exists) */}
          {!isCloud && active !== 'local' && (
            <button className="btn soft block" style={{ height:52, justifyContent:'flex-start', gap:14, paddingInlineStart:16 }}
              onClick={() => { onAction('backup', active); showToast(t('store_backed_up')); }}>
              <div style={{ width:34, height:34, borderRadius:'var(--radius-md)', background:STORAGE_CFG[active].bg, color:STORAGE_CFG[active].color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name={STORAGE_CFG[active].icon} size={18} />
              </div>
              <span style={{ flex:1, textAlign:'start', fontWeight:600, fontSize:'var(--pt-md)' }}>
                {t('store_backup_to')} {STORAGE_CFG[active].label[lang]}
              </span>
            </button>
          )}

          {/* No cloud connected hint */}
          {!isCloud && active === 'local' && (
            <div style={{ padding:'12px 14px', borderRadius:'var(--radius-lg)', background:'var(--balsm-ink-50)', display:'flex', alignItems:'center', gap:10 }}>
              <Icon name="info" size={16} style={{ color:'var(--fg3)', flexShrink:0 }} />
              <span className="meta" style={{ lineHeight:1.4 }}>Connect iCloud or Google Drive in Profile → Storage to enable backup.</span>
            </div>
          )}

          {/* Remove from cloud */}
          {isCloud && (
            <button className="btn secondary block" style={{ height:52, justifyContent:'flex-start', gap:14, paddingInlineStart:16 }}
              onClick={() => { onAction('remove_cloud'); showToast(t('store_removed_cloud')); }}>
              <div style={{ width:34, height:34, borderRadius:'var(--radius-md)', background:'var(--balsm-ink-50)', color:'var(--fg2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name="cloud-off" size={18} />
              </div>
              <span style={{ flex:1, textAlign:'start', fontWeight:600, fontSize:'var(--pt-md)', color:'var(--fg1)' }}>
                {t('store_remove_cloud')} <span style={{ fontWeight:400, color:'var(--fg3)', fontSize:'var(--pt-sm)' }}>· keep on device</span>
              </span>
            </button>
          )}

          {/* Remove from device */}
          {isCloud && (
            <button className="btn secondary block" style={{ height:52, justifyContent:'flex-start', gap:14, paddingInlineStart:16 }}
              onClick={() => setConfirm('remove_dev')}>
              <div style={{ width:34, height:34, borderRadius:'var(--radius-md)', background:'var(--balsm-ink-50)', color:'var(--fg2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name="smartphone" size={18} />
              </div>
              <span style={{ flex:1, textAlign:'start', fontWeight:600, fontSize:'var(--pt-md)', color:'var(--fg1)' }}>
                {t('store_remove_dev')} <span style={{ fontWeight:400, color:'var(--fg3)', fontSize:'var(--pt-sm)' }}>· keep in cloud</span>
              </span>
            </button>
          )}

          {/* Delete */}
          <button className="btn" style={{ height:52, justifyContent:'flex-start', gap:14, paddingInlineStart:16, background:'var(--balsm-danger-bg)', color:'var(--balsm-danger)', border:'none' }}
            onClick={() => setConfirm('delete_all')}>
            <div style={{ width:34, height:34, borderRadius:'var(--radius-md)', background:'rgba(212,74,60,0.12)', color:'var(--balsm-danger)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name="trash-2" size={18} />
            </div>
            <span style={{ flex:1, textAlign:'start', fontWeight:600, fontSize:'var(--pt-md)' }}>
              {isCloud ? t('store_delete_all') : t('store_delete_rec')}
            </span>
          </button>
        </div>

        {toast && (
          <div style={{ position:'absolute', bottom:36, left:20, right:20, background:'var(--balsm-ink-900)', color:'#fff', borderRadius:'var(--radius-lg)', padding:'12px 16px', display:'flex', alignItems:'center', gap:10, zIndex:60, animation:'msSlideUp 0.2s var(--ease-out) both' }}>
            <Icon name="check-circle" size={18} style={{ color:'var(--hue-mint)', flexShrink:0 }} />
            <span style={{ fontSize:'var(--pt-sm)', fontWeight:600 }}>{toast}</span>
          </div>
        )}
      </div>
    </>
  );
}

Object.assign(window, { StorageSyncSheet, StorageBadge, STORAGE_CFG, ManageStorageSheet });
