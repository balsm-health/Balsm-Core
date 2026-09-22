/* records.jsx — health records vault: labs, scans, reports + add flow + detail */

const REC_FILTERS = ['all', 'lab', 'scan', 'report'];

/* ── Document preview placeholder ───────────────────────── */
function DocPreview({ type, photo, height = 200 }) {
  const conf = RECORD_TYPES[type];
  if (photo) {
    return <img src={photo} alt="document" style={{ width: '100%', height, objectFit: 'cover', display: 'block', borderRadius: 'var(--radius-lg)' }} />;
  }
  return (
    <div style={{
      height, borderRadius: 'var(--radius-lg)', background: 'var(--balsm-cream-100)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
      position: 'relative', overflow: 'hidden', border: '1px solid var(--balsm-ink-100)',
    }}>
      <img src="assets/logo-vertical.svg" alt="" style={{ position: 'absolute', right: -28, bottom: -28, width: 130, opacity: 0.07 }} />
      <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: conf.bg, color: conf.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={conf.icon} size={28} />
      </div>
      <span className="meta">Document preview</span>
    </div>
  );
}

/* ── Record detail ──────────────────────────────────────── */
function RecordDetail({ rec: recProp, onBack, onDelete, onStorageChange }) {
  const { t, lang, recordStorageMap, setRecordStorage } = useApp();
  // Merge global storage overrides (from migrations) into local state
  const [rec, setRec] = useState(() => ({
    ...recProp,
    storage: recordStorageMap[recProp.id] || recProp.storage,
  }));
  // Keep in sync if a migration runs while detail is open
  useEffect(() => {
    const override = recordStorageMap[rec.id];
    if (override && override !== rec.storage) setRec(r => ({ ...r, storage: override }));
  }, [recordStorageMap]);
  const [manageOpen, setManageOpen] = useState(false);
  const conf = RECORD_TYPES[rec.type];
  const doc  = rec.sourceId === 'self' ? null : DOCTORS.find(d => d.id === rec.sourceId);

  const handleAction = (action, target) => {
    if (action === 'backup' || action === 'move') {
      const u = { ...rec, storage: target };
      setRec(u);
      setRecordStorage(rec.id, target);
      onStorageChange && onStorageChange(rec.id, target);
    } else if (action === 'remove_cloud') {
      const u = { ...rec, storage: 'local' };
      setRec(u);
      setRecordStorage(rec.id, 'local');
      onStorageChange && onStorageChange(rec.id, 'local');
    } else if (action === 'remove_dev') {
      setRec(r => ({ ...r, removedFromDevice: true }));
    } else if (action === 'delete_all') {
      onDelete && onDelete(rec.id); onBack();
    }
    setManageOpen(false);
  };

  return (
    <div className="screen fade-in">
      <div className="pad-top" />
      <div className="appbar">
        <button className="round-btn" onClick={onBack} aria-label="Back">
          <Icon name="arrow-left" style={{ transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
        </button>
        <div style={{ flex: 1 }} />
        <span className="pill" style={{ background: conf.bg, color: conf.color }}>{t(conf.oneKey)}</span>
      </div>

      <div className="screen-scroll">
        <div style={{ padding: '0 20px' }}>
          <h1 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-xl)', color: 'var(--fg1)', lineHeight: 1.25, textWrap: 'balance' }}>{rec.title[lang]}</h1>
          <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon name="calendar" size={13} />{rec.date[lang]}
            <span style={{ color: 'var(--balsm-ink-300)' }}>·</span>
            <span className="num">{rec.fileType}</span>
            {rec.pages > 1 && <><span style={{ color: 'var(--balsm-ink-300)' }}>·</span><span>{rec.pages} {t('pages')}</span></>}
          </div>
        </div>

        <div style={{ padding: '16px 20px 0' }}>
          <DocPreview type={rec.type} photo={rec.photo} />
        </div>

        {/* Key result callout */}
        {rec.result && (
          <div className="card" style={{ margin: '16px 20px 0', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, borderLeft: `3px solid ${conf.color}` }}>
            <Icon name="sparkles" size={17} style={{ color: conf.color, flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--pt-md)', fontWeight: 600, color: 'var(--fg1)' }}>{rec.result[lang]}</span>
          </div>
        )}

        {/* Storage location — tappable */}
        <div style={{ padding: '16px 20px 0' }}>
          <div onClick={() => setManageOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 'var(--radius-lg)', background: STORAGE_CFG[rec.storage || 'local'].bg, border: `1.5px solid ${STORAGE_CFG[rec.storage || 'local'].border}`, cursor: 'pointer' }}>
            <Icon name={STORAGE_CFG[rec.storage || 'local'].icon} size={18} style={{ color: STORAGE_CFG[rec.storage || 'local'].color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--pt-sm)', fontWeight: 700, color: 'var(--fg1)' }}>
                {(rec.storage === 'local' || !rec.storage) ? t('store_local_only') : t('store_backed')}
                <span style={{ fontWeight: 400, color: 'var(--fg3)', marginInlineStart: 6 }}>· {STORAGE_CFG[rec.storage || 'local'].label[lang]}</span>
              </div>
              <div style={{ fontSize: 'var(--pt-xs)', color: 'var(--fg3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="settings-2" size={11} />{t('store_manage')}
              </div>
            </div>
            <StorageBadge storage={rec.storage || 'local'} />
          </div>
        </div>
        {manageOpen && <ManageStorageSheet rec={rec} onClose={() => setManageOpen(false)} onAction={handleAction} />}

        {/* Source */}
        <div className="row-head"><h2>{t('rec_source')}</h2></div>
        <div className="card" style={{ margin: '0 20px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 13 }}>
          {doc ? (
            <>
              <DoctorAvatar doctor={doc} size={42} />
              <div className="grow">
                <div style={{ fontWeight: 600, fontSize: 'var(--pt-md)', color: 'var(--fg1)' }}>{doc.name[lang]}</div>
                <div style={{ fontSize: 'var(--pt-sm)', color: 'var(--fg3)', marginTop: 2 }}>{doc.specialty[lang]}</div>
              </div>
            </>
          ) : (
            <>
              <div style={{ width: 42, height: 42, borderRadius: 9999, background: 'var(--balsm-ink-100)', color: 'var(--fg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="user" size={20} />
              </div>
              <div className="grow">
                <div style={{ fontWeight: 600, fontSize: 'var(--pt-md)', color: 'var(--fg1)' }}>{t('rec_self')}</div>
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn primary block lg"><Icon name="eye" size={19} />{t('rec_view')}</button>
          <button className="btn secondary block"><Icon name="share-2" size={17} />{t('rec_share')}</button>
        </div>
        <div style={{ height: 28 }} />
      </div>
    </div>
  );
}

/* ── Manage-storage action sheet (per record) ──────────── */
function ManageStorageSheet({ rec, onClose, onAction }) {
  const { t, lang, storageProviders } = useApp();
  const cfg = STORAGE_CFG[rec.storage || 'local'];
  const isCloud = rec.storage === 'icloud' || rec.storage === 'gdrive';
  const [confirm, setConfirm] = useState(null); // 'remove_dev' | 'delete_all'
  const [toast, setToast]     = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => { setToast(null); onClose(); }, 1600);
  };

  const connectedClouds = ['icloud', 'gdrive'].filter(p => storageProviders[p]);

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
          <button className="btn danger block lg" style={{ marginTop:4 }} onClick={() => { onAction(isDev ? 'remove_dev' : 'delete_all'); showToast(isDev ? t('store_removed_dev') : null); }}>
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
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, zIndex:41,
        background:'#fff', borderRadius:'20px 20px 0 0',
        animation:'msSlideUp 0.28s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        {/* Handle + title */}
        <div style={{ padding:'10px 20px 0', borderBottom:'1px solid var(--balsm-ink-100)' }}>
          <div style={{ width:38, height:4, borderRadius:999, background:'var(--balsm-ink-200)', margin:'0 auto 12px' }} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:12 }}>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'var(--pt-lg)', color:'var(--fg1)', display:'flex', alignItems:'center', gap:10 }}>
              <Icon name={cfg.icon} size={19} style={{ color: cfg.color }} />{t('store_manage')}
            </div>
            <button className="round-btn ghost" onClick={onClose}><Icon name="x" size={17} /></button>
          </div>
        </div>

        {/* Current location indicator */}
        <div style={{ padding:'14px 20px 4px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', borderRadius:'var(--radius-lg)', background:cfg.bg, border:`1px solid ${cfg.border}`, marginBottom:16 }}>
            <Icon name={cfg.icon} size={16} style={{ color:cfg.color, flexShrink:0 }} />
            <div style={{ flex:1, fontSize:'var(--pt-sm)', fontWeight:600, color:'var(--fg1)' }}>
              {isCloud ? t('store_backed') : t('store_local_only')}
              <span style={{ fontWeight:400, color:'var(--fg3)', marginInlineStart:6 }}>· {cfg.label[lang]}</span>
            </div>
            <StorageBadge storage={rec.storage || 'local'} size="xs" />
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding:'0 20px 36px', display:'flex', flexDirection:'column', gap:10 }}>

          {/* Back up to cloud (if local & clouds connected) */}
          {!isCloud && connectedClouds.map(p => (
            <button key={p} className="btn soft block" style={{ height:52, justifyContent:'flex-start', gap:14, paddingInlineStart:16 }}
              onClick={() => { onAction('backup', p); showToast(t('store_backed_up')); }}>
              <div style={{ width:34, height:34, borderRadius:'var(--radius-md)', background:STORAGE_CFG[p].bg, color:STORAGE_CFG[p].color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name={STORAGE_CFG[p].icon} size={18} />
              </div>
              <span style={{ flex:1, textAlign:'start', fontWeight:600, fontSize:'var(--pt-md)' }}>
                {t('store_backup_to')} {STORAGE_CFG[p].label[lang]}
              </span>
              <Icon name="chevron-right" size={16} style={{ color:'var(--fg4)', transform: lang==='ar' ? 'scaleX(-1)' : 'none' }} />
            </button>
          ))}

          {/* No clouds connected hint */}
          {!isCloud && connectedClouds.length === 0 && (
            <div style={{ padding:'12px 14px', borderRadius:'var(--radius-lg)', background:'var(--balsm-ink-50)', display:'flex', alignItems:'center', gap:10 }}>
              <Icon name="info" size={16} style={{ color:'var(--fg3)', flexShrink:0 }} />
              <span className="meta" style={{ lineHeight:1.4 }}>Connect iCloud or Google Drive in Profile → Storage to enable cloud backup.</span>
            </div>
          )}

          {/* Move to other cloud (if already in one cloud) */}
          {isCloud && connectedClouds.filter(p => p !== rec.storage).map(p => (
            <button key={p} className="btn soft block" style={{ height:52, justifyContent:'flex-start', gap:14, paddingInlineStart:16 }}
              onClick={() => { onAction('move', p); showToast(t('store_backed_up')); }}>
              <div style={{ width:34, height:34, borderRadius:'var(--radius-md)', background:STORAGE_CFG[p].bg, color:STORAGE_CFG[p].color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon name={STORAGE_CFG[p].icon} size={18} />
              </div>
              <span style={{ flex:1, textAlign:'start', fontWeight:600, fontSize:'var(--pt-md)' }}>
                {t('store_move_to')} {STORAGE_CFG[p].label[lang]}
              </span>
              <Icon name="chevron-right" size={16} style={{ color:'var(--fg4)', transform: lang==='ar' ? 'scaleX(-1)' : 'none' }} />
            </button>
          ))}

          {/* Remove from cloud (keep local) */}
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

          {/* Remove from device (keep cloud) */}
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

          {/* Delete everywhere / Delete record */}
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

        {/* Toast */}
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
function AddRecordSheet({ onClose, onAdd }) {
  const { t, lang } = useApp();
  const [step, setStep]   = useState('type');   // type | form | done
  const [type, setType]   = useState(null);
  const [title, setTitle] = useState('');
  const [photo, setPhoto] = useState(null);
  const fileRef = useRef(null);

  const save = () => {
    onAdd({
      id: 'r' + Date.now(),
      type,
      title: { en: title || t(RECORD_TYPES[type].oneKey), ar: title || t(RECORD_TYPES[type].oneKey) },
      date: { en: 'Today', ar: 'اليوم' },
      sourceId: 'self',
      fileType: photo ? 'Image' : 'PDF',
      pages: 1,
      result: null,
      photo,
    });
    setStep('done');
    setTimeout(onClose, 1600);
  };

  return (
    <>
      <style>{`@keyframes arSlideUp{from{transform:translateY(110%)}to{transform:none}}`}</style>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(43,43,37,0.36)', backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 41,
        background: '#fff', borderRadius: '20px 20px 0 0',
        maxHeight: '90%', display: 'flex', flexDirection: 'column',
        animation: 'arSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        <div style={{ padding: '10px 16px 0', flexShrink: 0 }}>
          {step === 'type' && <div style={{ width: 38, height: 4, borderRadius: 999, background: 'var(--balsm-ink-200)', margin: '0 auto 10px' }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid var(--balsm-ink-100)' }}>
            {step === 'form' && <button className="round-btn ghost" onClick={() => setStep('type')}><Icon name="arrow-left" size={18} /></button>}
            <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-lg)', color: 'var(--fg1)' }}>
              {step === 'done' ? '' : step === 'type' ? t('rec_pick_type') : t(RECORD_TYPES[type].oneKey)}
            </div>
            <button className="round-btn ghost" onClick={onClose}><Icon name="x" size={18} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 36px' }}>
          {/* Step: pick type */}
          {step === 'type' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(RECORD_TYPES).map(([key, conf]) => (
                <div key={key} onClick={() => { setType(key); setStep('form'); }} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px 16px',
                  border: '1.5px solid var(--balsm-border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                }}>
                  <div style={{ width: 46, height: 46, borderRadius: 'var(--radius-md)', background: conf.bg, color: conf.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={conf.icon} size={23} />
                  </div>
                  <div style={{ flex: 1, fontWeight: 700, fontSize: 'var(--pt-md)', color: 'var(--fg1)' }}>{t(conf.oneKey)}</div>
                  <Icon name="chevron-right" size={18} style={{ color: 'var(--fg4)', transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
                </div>
              ))}
            </div>
          )}

          {/* Step: form */}
          {step === 'form' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="field">
                <label>{t('rec_title')}</label>
                <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('rec_title_ph')} />
              </div>

              <div>
                <label style={{ fontSize: 'var(--pt-sm)', fontWeight: 600, color: 'var(--fg2)', display: 'block', marginBottom: 8 }}>{t('rec_attach')}</label>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files[0]; if (f && f.type.startsWith('image/')) setPhoto(URL.createObjectURL(f)); else if (f) setPhoto(null); e.target.value = ''; }} />
                {photo ? (
                  <div style={{ position: 'relative' }}>
                    <img src={photo} alt="attachment" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--balsm-border)' }} />
                    <button onClick={() => setPhoto(null)} style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 999, background: 'rgba(26,26,23,0.55)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="x" size={15} /></button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '26px 16px', border: '1.5px dashed var(--balsm-border-strong)', borderRadius: 'var(--radius-md)', background: 'var(--balsm-cream-50)' }}>
                    <Icon name="upload-cloud" size={30} style={{ color: 'var(--fg3)' }} />
                    <p className="meta" style={{ margin: 0, textAlign: 'center', lineHeight: 1.5 }}>{t('rec_attach_h')}</p>
                    <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                      <button className="btn soft" style={{ height: 42, fontSize: 'var(--pt-sm)' }} onClick={() => fileRef.current?.click()}><Icon name="camera" size={16} />{t('rec_take_photo')}</button>
                      <button className="btn secondary" style={{ height: 42, fontSize: 'var(--pt-sm)' }} onClick={() => fileRef.current?.click()}><Icon name="folder" size={16} />{t('rec_from_files')}</button>
                    </div>
                  </div>
                )}
              </div>

              <button className="btn primary lg block" onClick={save}>{t('add_record')}</button>
            </div>
          )}

          {/* Step: done */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0 12px' }}>
              <div className="confirm-mark" style={{ width: 72, height: 72, margin: '0 auto 14px' }}><Icon name="check" size={36} /></div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-xl)', color: 'var(--fg1)', marginBottom: 8 }}>{t('rec_added')}</div>
              <p className="meta" style={{ margin: 0 }}>{t('rec_added_h')}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Records screen ─────────────────────────────────────── */
function RecordsScreen({ onBack }) {
  const { t, lang, recordStorageMap } = useApp();
  const [records, setRecords] = useState(HEALTH_RECORDS);
  const [filter, setFilter]   = useState('all');
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen]   = useState(false);
  const [loading, setLoading]   = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 700); return () => clearTimeout(t); }, []);

  if (selected) return (
    <RecordDetail
      rec={selected}
      onBack={() => setSelected(null)}
      onDelete={(id) => { setRecords(prev => prev.filter(r => r.id !== id)); setSelected(null); }}
      onStorageChange={(id, st) => setRecords(prev => prev.map(r => r.id === id ? { ...r, storage: st } : r))}
    />
  );

  const shown = filter === 'all' ? records : records.filter(r => r.type === filter);

  return (
    <div className="screen fade-in">
      <div className="pad-top" />
      <div className="appbar">
        <button className="round-btn" onClick={onBack} aria-label="Back">
          <Icon name="arrow-left" style={{ transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
        </button>
        <h1 style={{ flex: 1, margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-xl)', letterSpacing: '-0.01em', color: 'var(--fg1)' }}>{t('records')}</h1>
        <button className="btn soft" style={{ height: 40, padding: '0 14px', fontSize: 'var(--pt-sm)' }} onClick={() => setAddOpen(true)}>
          <Icon name="plus" size={16} />{t('add_record')}
        </button>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '0 20px 14px', overflowX: 'auto' }}>
        {REC_FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flexShrink: 0, height: 36, padding: '0 16px', borderRadius: 'var(--radius-pill)', cursor: 'pointer',
            border: `1.5px solid ${filter === f ? 'var(--app-accent)' : 'var(--balsm-border)'}`,
            background: filter === f ? 'var(--app-accent-50)' : '#fff',
            color: filter === f ? 'var(--app-accent-600)' : 'var(--fg2)',
            fontFamily: lang === 'ar' ? 'var(--font-arabic)' : 'var(--font-body)', fontSize: 'var(--pt-sm)', fontWeight: 600,
          }}>{f === 'all' ? t('all_records') : t(RECORD_TYPES[f].labelKey)}</button>
        ))}
      </div>

      <div className="screen-scroll" style={{ paddingTop: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px' }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 13 }}>
                <DSSkeleton variant="rect" width={46} height={46} radius="var(--radius-md)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <DSSkeleton variant="title" width={`${64 - i * 6}%`} />
                  <div style={{ height: 6 }} />
                  <DSSkeleton variant="text" width="42%" />
                </div>
              </div>
            ))}
          </div>
        ) : shown.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px' }}>
            {shown.map(rec => {
              const conf = RECORD_TYPES[rec.type];
              const doc = rec.sourceId === 'self' ? null : DOCTORS.find(d => d.id === rec.sourceId);
              return (
                <div key={rec.id} className="card" onClick={() => setSelected(rec)} style={{ padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 'var(--radius-md)', background: conf.bg, color: conf.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={conf.icon} size={22} />
                  </div>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--pt-md)', color: 'var(--fg1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.title[lang]}</div>
                    <div style={{ fontSize: 'var(--pt-sm)', color: 'var(--fg3)', marginTop: 2 }}>
                      {rec.date[lang]} · {doc ? doc.name[lang] : t('rec_self')}
                    </div>
                  </div>
                  <StorageBadge storage={recordStorageMap[rec.id] || rec.storage || 'local'} size="xs" />
                  <Icon name="chevron-right" size={17} style={{ color: 'var(--fg4)', flexShrink: 0, transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ margin: '0 20px', padding: '36px 26px', textAlign: 'center' }}>
            <Icon name="folder-open" size={36} style={{ color: 'var(--fg4)', display: 'block', margin: '0 auto 14px' }} />
            <div style={{ fontWeight: 700, fontSize: 'var(--pt-md)', color: 'var(--fg2)', marginBottom: 8 }}>{t('rec_empty')}</div>
            <p className="meta" style={{ margin: '0 0 16px', lineHeight: 1.5 }}>{t('rec_empty_h')}</p>
            <button className="btn primary" style={{ height: 44 }} onClick={() => setAddOpen(true)}><Icon name="plus" size={17} />{t('add_record')}</button>
          </div>
        )}
        <div style={{ height: 24 }} />
      </div>

      {addOpen && <AddRecordSheet onClose={() => setAddOpen(false)} onAdd={(r) => setRecords(prev => [r, ...prev])} />}
    </div>
  );
}

Object.assign(window, { RecordsScreen, RecordDetail, AddRecordSheet, ManageStorageSheet });
