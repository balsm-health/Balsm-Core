/* report.jsx — the daily self-report check-in flow + summary */

const SYMPTOMS = [
  { id: "s_headache", icon: "brain" }, { id: "s_dizzy", icon: "rotate-3d" },
  { id: "s_fatigue", icon: "battery-low" }, { id: "s_blurred", icon: "eye" },
  { id: "s_swelling", icon: "droplet", loc: true }, { id: "s_chest", icon: "heart-pulse" },
  { id: "s_tingling", icon: "zap", loc: true }, { id: "s_itching", icon: "hand", loc: true },
  { id: "s_nausea", icon: "frown" }, { id: "s_thirst", icon: "cup-soda" },
];

function painInfo(t, n) {
  if (n === 0) return { lbl: t('pain_0'), color: 'var(--hue-mint)' };
  if (n <= 3) return { lbl: t('pain_mild'), color: 'var(--hue-mint-600)' };
  if (n <= 6) return { lbl: t('pain_mod'), color: 'var(--balsm-sun-600)' };
  if (n <= 9) return { lbl: t('pain_sev'), color: 'var(--balsm-expiring)' };
  return { lbl: t('pain_worst'), color: 'var(--balsm-danger)' };
}

function NumPad({ onKey, onBack }) {
  const k = (d) => <button key={d} onClick={() => onKey(String(d))}>{d}</button>;
  return (
    <div className="keypad">
      {[1,2,3,4,5,6,7,8,9].map(k)}
      <button className="fn" style={{ visibility: 'hidden' }} />
      {k(0)}
      <button className="fn" onClick={onBack} aria-label="Delete"><Icon name="delete" /></button>
    </div>
  );
}

function ReportFlow({ onClose, onDone }) {
  const { t, lang } = useApp();
  const STEPS = ['mood', 'bp', 'glucose', 'meds', 'symptoms'];
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [mood, setMood] = useState(0);
  const [bpSys, setBpSys] = useState(''); const [bpDia, setBpDia] = useState('');
  const [bpField, setBpField] = useState('sys'); const [bpSkip, setBpSkip] = useState(false);
  const [glu, setGlu] = useState(''); const [gluCtx, setGluCtx] = useState('glu_fast'); const [gluSkip, setGluSkip] = useState(false);
  const [meds, setMeds] = useState(() => Object.fromEntries(MEDS.map(m => [m.id, null])));
  const [pain, setPain] = useState(0);
  const [syms, setSyms]       = useState(new Set());
  const [painLocs, setPainLocs] = useState(new Set());
  const [note, setNote]         = useState('');
  const trackRef = useRef(null);

  const pct = ((step + 1) / STEPS.length) * 100;
  const cur = STEPS[step];

  const canNext = {
    mood: mood > 0,
    bp: bpSkip || (bpSys.length >= 2 && bpDia.length >= 2),
    glucose: gluSkip || glu.length >= 2,
    meds: true,
    symptoms: true,
  }[cur];

  const next = () => { if (step < STEPS.length - 1) setStep(s => s + 1); else setSubmitted(true); };
  const back = () => { if (step > 0) setStep(s => s - 1); else onClose(); };

  const bpKey = (d) => {
    if (bpField === 'sys') { if (bpSys.length < 3) setBpSys(bpSys + d); }
    else { if (bpDia.length < 3) setBpDia(bpDia + d); }
  };
  const bpBack = () => { if (bpField === 'sys') setBpSys(bpSys.slice(0, -1)); else setBpDia(bpDia.slice(0, -1)); };

  const togglePainLoc = (id) => setPainLocs(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleSym = (id) => setSyms(prev => {
    const n = new Set(prev);
    if (id === 's_none') return new Set(n.has('s_none') ? [] : ['s_none']);
    n.delete('s_none');
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const setPainFromEvent = (e) => {
    const el = trackRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    let ratio = (e.clientX - r.left) / r.width;
    if (lang === 'ar') ratio = 1 - ratio;
    ratio = Math.max(0, Math.min(1, ratio));
    setPain(Math.round(ratio * 10));
  };

  if (submitted) return <Summary {...{ mood, bpSys, bpDia, bpSkip, glu, gluCtx, gluSkip, meds, pain, syms, onClose, onDone }} />;

  const pinfo = painInfo(t, pain);
  const knobPos = `${pain * 10}%`;

  return (
    <div className="flow">
      <div className="pad-top" />
      <div className="flow-top">
        <button className="round-btn ghost" onClick={back} aria-label="Back">
          <Icon name={step === 0 ? 'x' : 'arrow-left'} />
        </button>
        <div className="progress"><div className="bar" style={{ width: pct + '%' }} /></div>
        <span className="meta num" style={{ minWidth: 38, textAlign: 'center' }}>{step + 1} {t('step_of')} {STEPS.length}</span>
      </div>

      <div className="flow-body" key={cur}>
        <div className="fade-in">
          {/* MOOD */}
          {cur === 'mood' && <>
            <h2 className="q-title">{t('q_mood_t')}</h2>
            <p className="q-help">{t('q_mood_h')}</p>
            <div className="mood-grid">
              {[1,2,3,4,5].map(lv => (
                <div key={lv} className={cx('mood', mood === lv && 'sel')} onClick={() => setMood(lv)}>
                  <MoodFace level={lv} color={mood === lv ? MOOD_COLORS[lv-1] : 'var(--balsm-ink-400)'} />
                  <span className="mlbl">{t('mood_' + lv)}</span>
                </div>
              ))}
            </div>
          </>}

          {/* BLOOD PRESSURE */}
          {cur === 'bp' && <>
            <h2 className="q-title">{t('q_bp_t')}</h2>
            <p className="q-help">{t('q_bp_h')}</p>
            <div className={cx('card card-pad', bpSkip && 'is-disabled')} style={{ opacity: bpSkip ? 0.4 : 1 }}>
              <div className="vital-pair">
                <input className="vital-num" inputMode="numeric" pattern="[0-9]*" maxLength={3}
                  value={bpSys} placeholder="—" autoFocus disabled={bpSkip}
                  onFocus={() => setBpField('sys')}
                  onChange={e => setBpSys(e.target.value.replace(/\D/g, '').slice(0, 3))} />
                <span className="vital-sep">/</span>
                <input className="vital-num" inputMode="numeric" pattern="[0-9]*" maxLength={3}
                  value={bpDia} placeholder="—" disabled={bpSkip}
                  onFocus={() => setBpField('dia')}
                  onChange={e => setBpDia(e.target.value.replace(/\D/g, '').slice(0, 3))} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 60, marginTop: 4 }}>
                <span className="meta" style={{ color: bpField==='sys'?'var(--app-accent)':'var(--fg3)', fontWeight: 600 }}>{t('sys')}</span>
                <span className="meta" style={{ color: bpField==='dia'?'var(--app-accent)':'var(--fg3)', fontWeight: 600 }}>{t('dia')}</span>
              </div>
              <div className="vital-unit" style={{ textAlign: 'center' }}>{t('unit_bp')}</div>
            </div>
            <SkipRow on={bpSkip} set={setBpSkip} t={t} />
          </>}

          {/* GLUCOSE */}
          {cur === 'glucose' && <>
            <h2 className="q-title">{t('q_glu_t')}</h2>
            <p className="q-help">{t('q_glu_h')}</p>
            <div className="chip-wrap" style={{ marginBottom: 16 }}>
              {['glu_fast','glu_meal','glu_random'].map(c => (
                <div key={c} className={cx('chip', gluCtx === c && 'sel')} onClick={() => setGluCtx(c)}>{t(c)}</div>
              ))}
            </div>
            <div className="card card-pad" style={{ opacity: gluSkip ? 0.4 : 1 }}>
              <div className="vital-display" style={{ padding: '12px 0 4px' }}>
                <input className="vital-num active" inputMode="numeric" pattern="[0-9]*" maxLength={3}
                  value={glu} placeholder="—" autoFocus disabled={gluSkip} style={{ minWidth: 150 }}
                  onChange={e => setGlu(e.target.value.replace(/\D/g, '').slice(0, 3))} />
                <div className="vital-unit">{t('unit_glu')}</div>
              </div>
            </div>
            <SkipRow on={gluSkip} set={setGluSkip} t={t} />
          </>}

          {/* MEDS */}
          {cur === 'meds' && <>
            <h2 className="q-title">{t('q_med_t')}</h2>
            <p className="q-help">{t('q_med_h')}</p>
            {MEDS.map(m => {
              const st = meds[m.id];
              return (
                <div key={m.id} className={cx('check-row', st === 'taken' && 'taken', st === 'skipped' && 'skipped')}
                  onClick={() => setMeds(p => ({ ...p, [m.id]: p[m.id] === 'taken' ? null : 'taken' }))}>
                  <div className="check-box">{st === 'taken' && <Icon name="check" />}</div>
                  <div className="grow">
                    <div className="cname">{m.name[lang]}</div>
                    <div className="cdose">{m.dose[lang]}</div>
                  </div>
                  {st === 'skipped'
                    ? <span className="pill neutral">{t('skipped')}</span>
                    : <span className="skip-link" onClick={(e) => { e.stopPropagation(); setMeds(p => ({ ...p, [m.id]: 'skipped' })); }}>{t('mark_skip')}</span>}
                </div>
              );
            })}
          </>}

          {/* SYMPTOMS + PAIN + NOTE */}
          {cur === 'symptoms' && <>
            <h2 className="q-title">{t('q_sym_t')}</h2>
            <p className="q-help">{t('q_sym_h')}</p>
            <div className="pain-val">
              <div className="pain-n" style={{ color: pinfo.color }}>{pain}</div>
              <div className="pain-lbl">{pinfo.lbl}</div>
            </div>
            <div className="pain-track" ref={trackRef}
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setPainFromEvent(e); }}
              onPointerMove={(e) => { if (e.buttons) setPainFromEvent(e); }}>
              <div className="pain-rail" />
              <div className="pain-knob" style={{ color: pinfo.color, [lang==='ar'?'right':'left']: knobPos }} />
            </div>
            <div className="pain-ticks"><span>0</span><span>5</span><span>10</span></div>

            {(pain > 0 || [...syms].some(id => SYMPTOMS.find(s => s.id === id)?.loc)) && (
              <div style={{ margin: '20px 0 0' }}>
                <div style={{ fontSize: 'var(--pt-sm)', fontWeight: 600, color: 'var(--fg3)', marginBottom: 8 }}>{t('body_location')}</div>
                <BodyMap selected={painLocs} onToggle={togglePainLoc} initialGender={PATIENT.gender} />
              </div>
            )}
            <div className="chip-wrap" style={{ marginTop: 24 }}>
              {SYMPTOMS.map(s => (
                <div key={s.id} className={cx('chip', syms.has(s.id) && 'sel')} onClick={() => toggleSym(s.id)}>
                  <Icon name={s.icon} size={16} />{t(s.id)}
                </div>
              ))}
              <div className={cx('chip', syms.has('s_none') && 'sel')} onClick={() => toggleSym('s_none')}>
                <Icon name="check-circle-2" size={16} />{t('s_none')}
              </div>
            </div>

            <label className="body-sm" style={{ fontWeight: 600, color: 'var(--fg2)', display: 'block', margin: '24px 0 10px' }}>{t('note_lbl')}</label>
            <textarea className="textarea" placeholder={t('note_ph')} value={note} onChange={e => setNote(e.target.value)} />
            <div className="photo-add"><Icon name="camera" /><span className="body-sm">{t('add_photo')}</span></div>
          </>}
        </div>
      </div>

      <div className="flow-foot">
        <button className={cx('btn primary lg block', !canNext && 'is-disabled')} onClick={next}>
          {step === STEPS.length - 1 ? t('finish') : t('continue')}
        </button>
      </div>
    </div>
  );
}

function SkipRow({ on, set, t }) {
  return (
    <div style={{ textAlign: 'center', marginTop: 14 }}>
      <button className="btn ghost" onClick={() => set(!on)} style={{ height: 44 }}>
        <Icon name={on ? 'check-circle-2' : 'circle'} size={18} />{t('skip_q')}
      </button>
    </div>
  );
}

function Summary({ mood, bpSys, bpDia, bpSkip, glu, gluCtx, gluSkip, meds, pain, syms, onClose, onDone }) {
  const { t, lang, completeCheckin } = useApp();
  const takenCount = MEDS.filter(m => meds[m.id] === 'taken').length;
  const symList = [...syms].filter(s => s !== 's_none').map(s => t(s));
  const report = {
    mood, pain, takenCount,
    bp: bpSkip ? null : `${bpSys}/${bpDia}`,
    glu: gluSkip ? null : glu, gluCtx,
    symKeys: [...syms].filter(s => s !== 's_none'),
  };
  const finishTo = (tab) => { completeCheckin && completeCheckin(report); onDone(tab); };
  const pinfo = painInfo(t, pain);
  const items = [
    { icon: 'smile', tone: 'info', lab: t('m_mood'), val: mood ? t('mood_' + mood) : '—' },
    !bpSkip && { icon: 'activity', tone: 'violet', lab: t('m_bp'), val: `${bpSys}/${bpDia} ${t('unit_bp')}` },
    !gluSkip && { icon: 'droplet', tone: 'success', lab: `${t('m_glucose')} · ${t(gluCtx)}`, val: `${glu} ${t('unit_glu')}` },
    { icon: 'pill', tone: 'info', lab: t('meds_today'), val: `${takenCount}/${MEDS.length} ${t('meds_taken')}` },
    { icon: 'thermometer', tone: 'warn', lab: t('m_pain'), val: `${pain}/10 · ${pinfo.lbl}` },
    symList.length > 0 && { icon: 'stethoscope', tone: 'neutral', lab: t('q_sym_t'), val: symList.join(lang === 'ar' ? '، ' : ', ') },
  ].filter(Boolean);

  const toneBg = { info: 'var(--hue-blue-50)', violet: 'var(--hue-violet-50)', success: 'var(--hue-mint-50)', warn: '#FDF5DC', neutral: 'var(--balsm-ink-100)' };
  const toneFg = { info: 'var(--hue-blue)', violet: 'var(--hue-violet)', success: 'var(--hue-mint-600)', warn: 'var(--balsm-sun-600)', neutral: 'var(--balsm-ink-600)' };

  return (
    <div className="flow" style={{ background: '#fff' }}>
      <div className="pad-top" />
      <div className="screen-scroll">
        <div className="confirm-hero fade-in">
          <div className="confirm-mark"><Icon name="check" /></div>
          <h1 className="title" style={{ margin: 0 }}>{t('saved_t')}</h1>
          <div className="save-note"><Icon name="cloud-off" />{t('saved_local')}</div>
        </div>
        <div className="summary-list">
          {items.map((it, i) => (
            <div key={i} className="summary-item">
              <div className="sico" style={{ background: toneBg[it.tone], color: toneFg[it.tone] }}><Icon name={it.icon} /></div>
              <div className="grow">
                <div className="slab">{it.lab}</div>
                <div className="sval" dir={lang==='ar' && /[A-Za-z0-9]/.test(it.val) ? 'ltr' : undefined} style={{ display: 'inline-block' }}>{it.val}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="meta px-20" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 18 }}>
          <Icon name="send" size={15} />{t('to_doctor')}
        </p>
      </div>
      <div className="flow-foot" style={{ background: '#fff', gap: 12 }}>
        <button className="btn secondary lg" style={{ flex: 1 }} onClick={() => finishTo('trends')}>{t('view_trends')}</button>
        <button className="btn primary lg" style={{ flex: 1 }} onClick={() => finishTo('home')}>{t('to_home')}</button>
      </div>
    </div>
  );
}

Object.assign(window, { ReportFlow, NumPad });
