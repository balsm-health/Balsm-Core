/* quicklog.jsx — FAB quick-log bottom sheet + per-metric mini-flows
   Each flow: primary input → note + photo → save                     */

const QL_METRICS = [
  { id: 'bp',       icon: 'activity',    color: 'var(--hue-violet)',   bg: 'var(--hue-violet-50)',  labelKey: 'm_bp'      },
  { id: 'glucose',  icon: 'droplet',     color: 'var(--hue-mint-600)', bg: 'var(--hue-mint-50)',    labelKey: 'm_glucose' },
  { id: 'mood',     icon: 'smile',       color: 'var(--hue-aqua)',     bg: 'var(--hue-aqua-50)',    labelKey: 'm_mood'    },
  { id: 'pain',     icon: 'zap',         color: 'var(--balsm-danger)',   bg: 'var(--balsm-danger-bg)',  labelKey: 'm_pain'    },
  { id: 'weight',   icon: 'scale',       color: 'var(--hue-blue)',     bg: 'var(--hue-blue-50)',    labelKey: 'm_weight'  },
  { id: 'symptoms', icon: 'stethoscope', color: '#9A6E00',               bg: '#FDF5DC',                 labelKey: 'symptoms'  },
];

const QUICK_SYMPTOMS = [
  { id:'s_headache', icon:'brain'       }, { id:'s_dizzy',   icon:'rotate-3d'   },
  { id:'s_fatigue',  icon:'battery-low' }, { id:'s_blurred', icon:'eye'         },
  { id:'s_swelling', icon:'droplet', loc:true }, { id:'s_chest',   icon:'heart-pulse' },
  { id:'s_tingling', icon:'zap',     loc:true }, { id:'s_itching', icon:'hand', loc:true },
  { id:'s_nausea',   icon:'frown'       }, { id:'s_thirst',  icon:'cup-soda'    },
];

const PAIN_COLORS = ['#55D77F','#7AD455','#9CC92E','#C5C424','#E5B428','#E89428','#E07228','#D85030','#CF3C38','#C43040','#B82040'];

/* ── Note + photo block ────────────────────────────────── */
function NoteAttach({ note, setNote, photo, setPhoto }) {
  const { t } = useApp();
  const fileRef = useRef(null);
  return (
    <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--balsm-ink-100)' }}>
      <label style={{ fontSize: 'var(--pt-sm)', fontWeight: 600, color: 'var(--fg3)', display: 'block', marginBottom: 8 }}>
        {t('note_lbl')}
      </label>
      <textarea className="textarea" style={{ minHeight: 72, fontSize: 'var(--pt-md)' }}
        placeholder={t('note_ph')} value={note} onChange={e => setNote(e.target.value)} />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files[0]; if (f) setPhoto(URL.createObjectURL(f)); e.target.value = ''; }} />
      {photo ? (
        <div style={{ position: 'relative', marginTop: 10 }}>
          <img src={photo} alt="attachment" style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 'var(--radius-md)', display: 'block', border: '1px solid var(--balsm-border)' }} />
          <button onClick={() => setPhoto(null)} style={{
            position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 999,
            background: 'rgba(26,26,23,0.55)', border: 'none', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name="x" size={14} /></button>
        </div>
      ) : (
        <div className="photo-add" onClick={() => fileRef.current?.click()} style={{ marginTop: 10 }}>
          <Icon name="camera" size={20} /><span className="body-sm">{t('add_photo')}</span>
        </div>
      )}
    </div>
  );
}

/* ── Sheet wrapper ─────────────────────────────────────── */
function Sheet({ children, onClose, onBack, title }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(43,43,37,0.38)', backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 41,
        background: '#fff', borderRadius: '20px 20px 0 0',
        maxHeight: '90%', display: 'flex', flexDirection: 'column',
        animation: 'qlSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
      }}>
        <style>{`@keyframes qlSlideUp { from { transform: translateY(110%) } to { transform: none } }`}</style>
        <div style={{ padding: '10px 16px 0', flexShrink: 0 }}>
          {!onBack && <div style={{ width: 38, height: 4, borderRadius: 999, background: 'var(--balsm-ink-200)', margin: '0 auto 10px' }} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid var(--balsm-ink-100)' }}>
            {onBack && <button className="round-btn ghost" onClick={onBack} style={{ flexShrink: 0 }}><Icon name="arrow-left" size={18} /></button>}
            {title
              ? <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-lg)', color: 'var(--fg1)' }}>{title}</div>
              : <div style={{ flex: 1 }} />}
            <button className="round-btn ghost" onClick={onClose} style={{ flexShrink: 0 }}><Icon name="x" size={18} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 38px' }}>{children}</div>
      </div>
    </>
  );
}

/* ── Saved flash ───────────────────────────────────────── */
function SavedFlash({ value, note }) {
  return (
    <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
      <div className="confirm-mark" style={{ width: 72, height: 72, margin: '0 auto 14px' }}><Icon name="check" size={36} /></div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-xl)', color: 'var(--fg1)', marginBottom: 6 }}>Saved</div>
      {value && <div style={{ fontSize: 'var(--pt-md)', color: 'var(--fg2)', fontWeight: 500 }}>{value}</div>}
      {note && (
        <div style={{ margin: '12px 0 0', padding: '10px 14px', background: 'var(--balsm-ink-50)', borderRadius: 'var(--radius-md)', fontSize: 'var(--pt-sm)', color: 'var(--fg3)', textAlign: 'left', lineHeight: 1.5 }}>
          <Icon name="file-text" size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--fg4)' }} />{note}
        </div>
      )}
    </div>
  );
}

/* ── BP ─────────────────────────────────────────────────── */
function QuickBP({ onSave }) {
  const { t } = useApp();
  const [sys, setSys] = useState(''); const [dia, setDia] = useState('');
  const [field, setField] = useState('sys');
  const [note, setNote] = useState(''); const [photo, setPhoto] = useState(null);
  const ok = sys.length >= 2 && dia.length >= 2;

  const onKey = (d) => {
    if (field === 'sys') { if (sys.length < 3) { const n = sys + d; setSys(n); if (n.length === 3) setField('dia'); } }
    else { if (dia.length < 3) setDia(dia + d); }
  };
  const onBack = () => {
    if (field === 'dia' && dia.length === 0) setField('sys');
    else if (field === 'dia') setDia(dia.slice(0, -1));
    else setSys(sys.slice(0, -1));
  };

  return (<>
    <div className="vital-pair">
      <div className="vital-num" onClick={() => setField('sys')} style={{ borderColor: field==='sys'?'var(--app-accent)':'transparent', background: field==='sys'?'var(--app-accent-50)':'transparent' }}>{sys||'—'}</div>
      <span className="vital-sep">/</span>
      <div className="vital-num" onClick={() => setField('dia')} style={{ borderColor: field==='dia'?'var(--app-accent)':'transparent', background: field==='dia'?'var(--app-accent-50)':'transparent' }}>{dia||'—'}</div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 60, marginTop: 4 }}>
      <span className="meta" style={{ color: field==='sys'?'var(--app-accent)':'var(--fg3)', fontWeight: 600 }}>{t('sys')}</span>
      <span className="meta" style={{ color: field==='dia'?'var(--app-accent)':'var(--fg3)', fontWeight: 600 }}>{t('dia')}</span>
    </div>
    <div className="vital-unit" style={{ textAlign: 'center', marginBottom: 4 }}>{t('unit_bp')}</div>
    <NumPad onKey={onKey} onBack={onBack} />
    <NoteAttach note={note} setNote={setNote} photo={photo} setPhoto={setPhoto} />
    <button className={cx('btn primary lg block', !ok && 'is-disabled')} style={{ marginTop: 16 }}
      onClick={() => onSave(`${sys}/${dia} ${t('unit_bp')}`, note)}>Save</button>
  </>);
}

/* ── Glucose ────────────────────────────────────────────── */
function QuickGlucose({ onSave }) {
  const { t } = useApp();
  const [glu, setGlu] = useState(''); const [ctx, setCtx] = useState('glu_fast');
  const [note, setNote] = useState(''); const [photo, setPhoto] = useState(null);
  const ok = glu.length >= 2;
  return (<>
    <div className="chip-wrap" style={{ marginBottom: 14, justifyContent: 'center' }}>
      {['glu_fast','glu_meal','glu_random'].map(c => <div key={c} className={cx('chip', ctx===c&&'sel')} onClick={() => setCtx(c)}>{t(c)}</div>)}
    </div>
    <div className="vital-display" style={{ padding: '8px 0 4px' }}>
      <span className="vital-num active" style={{ display: 'inline-block', minWidth: 120, textAlign: 'center' }}>{glu||'—'}</span>
      <div className="vital-unit">{t('unit_glu')}</div>
    </div>
    <NumPad onKey={d => glu.length < 3 && setGlu(glu + d)} onBack={() => setGlu(glu.slice(0,-1))} />
    <NoteAttach note={note} setNote={setNote} photo={photo} setPhoto={setPhoto} />
    <button className={cx('btn primary lg block', !ok && 'is-disabled')} style={{ marginTop: 16 }}
      onClick={() => onSave(`${glu} ${t('unit_glu')} · ${t(ctx)}`, note)}>Save</button>
  </>);
}

/* ── Mood ───────────────────────────────────────────────── */
function QuickMood({ onSave }) {
  const { t } = useApp();
  const [mood, setMood] = useState(0);
  const [note, setNote] = useState(''); const [photo, setPhoto] = useState(null);
  return (<>
    <div className="mood-grid" style={{ marginBottom: 8 }}>
      {[1,2,3,4,5].map(lv => (
        <div key={lv} className={cx('mood', mood===lv&&'sel')} onClick={() => setMood(lv)}>
          <MoodFace level={lv} color={mood===lv ? MOOD_COLORS[lv-1] : 'var(--balsm-ink-400)'} />
          <span className="mlbl">{t('mood_'+lv)}</span>
        </div>
      ))}
    </div>
    <NoteAttach note={note} setNote={setNote} photo={photo} setPhoto={setPhoto} />
    <button className={cx('btn primary lg block', !mood && 'is-disabled')} style={{ marginTop: 16 }}
      onClick={() => onSave(t('mood_'+mood), note)}>Save</button>
  </>);
}

/* ── Pain (slider + body map) ───────────────────────────── */
function QuickPain({ onSave }) {
  const { t } = useApp();
  const [intensity, setIntensity] = useState(0);
  const [locations, setLocations] = useState(new Set());
  const [note, setNote] = useState(''); const [photo, setPhoto] = useState(null);
  const pColor = PAIN_COLORS[Math.min(intensity, 10)];
  const ok = intensity > 0 || locations.size > 0;

  const toggleLoc = (id) => setLocations(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (<>
    {/* Big number */}
    <div style={{ textAlign: 'center', lineHeight: 1, marginBottom: 8 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 72, color: pColor, transition: 'color 0.2s' }}>{intensity}</span>
      <span style={{ fontSize: 'var(--pt-md)', color: 'var(--fg3)', marginLeft: 4 }}>/10</span>
    </div>
    {/* Slider */}
    <input type="range" min={0} max={10} value={intensity}
      onChange={e => setIntensity(Number(e.target.value))}
      style={{ width: '100%', accentColor: pColor, cursor: 'pointer', marginBottom: 4 }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--pt-xs)', color: 'var(--fg4)', marginBottom: 20 }}>
      <span>{t('pain_0')}</span><span>{t('pain_worst')}</span>
    </div>
    {/* Body map */}
    <div style={{ fontSize: 'var(--pt-sm)', fontWeight: 600, color: 'var(--fg3)', marginBottom: 10 }}>{t('body_location')}</div>
    <BodyMap selected={locations} onToggle={toggleLoc} initialGender={PATIENT.gender} />
    <NoteAttach note={note} setNote={setNote} photo={photo} setPhoto={setPhoto} />
    <button className={cx('btn primary lg block', !ok && 'is-disabled')} style={{ marginTop: 16 }}
      onClick={() => {
        const locStr = [...locations].map(id => HOTSPOTS.find(h => h.id === id)?.label?.en || id).join(', ');
        onSave(`${intensity}/10${locStr ? ' · ' + locStr : ''}`, note);
      }}>Save</button>
  </>);
}

/* ── Weight ─────────────────────────────────────────────── */
function QuickWeight({ onSave }) {
  const [kg, setKg] = useState(''); const [dec, setDec] = useState(''); const [dot, setDot] = useState(false);
  const [note, setNote] = useState(''); const [photo, setPhoto] = useState(null);
  const ok = kg.length >= 2;
  const display = kg ? (dot ? `${kg}.${dec}` : kg) : '—';
  const onKey = (d) => { if (dot) { if (dec.length < 1) setDec(dec+d); } else { if (kg.length < 3) setKg(kg+d); } };
  const onBack = () => { if (dot && dec.length > 0) setDec(''); else if (dot) setDot(false); else setKg(kg.slice(0,-1)); };
  return (<>
    <div className="vital-display" style={{ padding: '8px 0 4px' }}>
      <span className="vital-num active" style={{ display: 'inline-block', minWidth: 130, textAlign: 'center' }}>{display}</span>
      <div className="vital-unit">kg</div>
    </div>
    <div className="keypad">
      {[1,2,3,4,5,6,7,8,9].map(d => <button key={d} onClick={() => onKey(String(d))}>{d}</button>)}
      <button className="fn" onClick={() => !dot && kg.length > 0 && setDot(true)} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--pt-xl)' }}>.</button>
      <button onClick={() => onKey('0')}>0</button>
      <button className="fn" onClick={onBack}><Icon name="delete" /></button>
    </div>
    <NoteAttach note={note} setNote={setNote} photo={photo} setPhoto={setPhoto} />
    <button className={cx('btn primary lg block', !ok && 'is-disabled')} style={{ marginTop: 16 }}
      onClick={() => onSave(`${display} kg`, note)}>Save</button>
  </>);
}

/* ── Symptoms (chips + body map) ────────────────────────── */
function QuickSymptoms({ onSave }) {
  const { t } = useApp();
  const [syms, setSyms]         = useState(null);
  const [locations, setLocations] = useState(new Set());
  const [note, setNote]         = useState(''); const [photo, setPhoto] = useState(null);

  const select = (id) => setSyms(prev => prev === id ? null : id);
  const toggleLoc = (id) => setLocations(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const showMap = syms != null && (QUICK_SYMPTOMS.find(s => s.id === syms)?.loc ?? false);

  return (<>
    <div className="chip-wrap" style={{ marginBottom: 12 }}>
      {QUICK_SYMPTOMS.map(s => (
        <div key={s.id} className={cx('chip', syms === s.id && 'sel')} onClick={() => select(s.id)}>
          <Icon name={s.icon} size={16} />{t(s.id)}
        </div>
      ))}
      <div className={cx('chip', syms === 's_none' && 'sel')} onClick={() => select('s_none')}>
        <Icon name="check-circle-2" size={16} />{t('s_none')}
      </div>
    </div>

    {showMap && (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 'var(--pt-sm)', fontWeight: 600, color: 'var(--fg3)', marginBottom: 8 }}>{t('body_location')}</div>
        <BodyMap selected={locations} onToggle={toggleLoc} initialGender={PATIENT.gender} />
      </div>
    )}

    <NoteAttach note={note} setNote={setNote} photo={photo} setPhoto={setPhoto} />
    <button className={cx('btn primary lg block', syms == null && 'is-disabled')} style={{ marginTop: 16 }}
      onClick={() => onSave(syms === 's_none' ? t('s_none') : t(syms), note)}>Save</button>
  </>);
}

/* ── Main QuickLog sheet ────────────────────────────────── */
function QuickLogSheet({ onClose, onFullCheckin }) {
  const { t } = useApp();
  const [active, setActive]         = useState(null);
  const [savedValue, setSavedValue] = useState(null);
  const [savedNote, setSavedNote]   = useState(null);

  const handleSave = (value, note) => { setSavedValue(value); setSavedNote(note || null); setTimeout(onClose, 1600); };

  const FlowMap = { bp: QuickBP, glucose: QuickGlucose, mood: QuickMood, pain: QuickPain, weight: QuickWeight, symptoms: QuickSymptoms };
  const MetricFlow = active ? FlowMap[active] : null;
  const metricInfo = QL_METRICS.find(m => m.id === active);

  if (savedValue !== null) return <Sheet onClose={onClose}><SavedFlash value={savedValue} note={savedNote} /></Sheet>;

  if (active && MetricFlow) {
    return (
      <Sheet onClose={onClose} onBack={() => setActive(null)} title={t(metricInfo.labelKey)}>
        <MetricFlow onSave={handleSave} />
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose}>
      {/* Full check-in CTA */}
      <div onClick={onFullCheckin} style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
        background: 'var(--app-accent)', borderRadius: 'var(--radius-lg)', color: '#fff',
        cursor: 'pointer', marginBottom: 16, boxShadow: 'var(--app-accent-shadow)',
      }}>
        <div style={{ width: 46, height: 46, borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="clipboard-list" size={23} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--pt-md)' }}>{t('full_checkin')}</div>
          <div style={{ fontSize: 'var(--pt-sm)', opacity: 0.85, marginTop: 1 }}>Mood · BP · glucose · meds · symptoms</div>
        </div>
        <Icon name="chevron-right" size={18} style={{ opacity: 0.75 }} />
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--balsm-ink-100)' }} />
        <span style={{ fontSize: 'var(--pt-xs)', color: 'var(--fg4)', fontWeight: 600, whiteSpace: 'nowrap' }}>{t('quick_log_or')}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--balsm-ink-100)' }} />
      </div>

      {QL_METRICS.map(m => (
        <div key={m.id} onClick={() => setActive(m.id)} style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '11px 12px',
          borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'background var(--dur-fast) var(--ease-out)',
        }}
        onPointerDown={e => e.currentTarget.style.background = 'var(--balsm-ink-50)'}
        onPointerUp={e => e.currentTarget.style.background = 'transparent'}
        onPointerLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: m.bg, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={m.icon} size={21} />
          </div>
          <div style={{ flex: 1, fontWeight: 600, fontSize: 'var(--pt-md)', color: 'var(--fg1)' }}>{t(m.labelKey)}</div>
          <Icon name="chevron-right" size={18} style={{ color: 'var(--fg4)' }} />
        </div>
      ))}
    </Sheet>
  );
}

Object.assign(window, { QuickLogSheet });
