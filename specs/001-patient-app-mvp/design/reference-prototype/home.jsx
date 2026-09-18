/* home.jsx — main app screens: Home, Trends, Meds, Profile */

function LineChart({ series, rtl, yPad = 8, height = 96 }) {
  const W = 320, H = height;
  const all = series.flatMap(s => s.data);
  const min = Math.min(...all), max = Math.max(...all);
  const range = max - min || 1;
  const n = series[0].data.length;
  const x = (i) => { const r = n === 1 ? 0.5 : i / (n - 1); return (rtl ? 1 - r : r) * (W - 16) + 8; };
  const y = (v) => yPad + (1 - (v - min) / range) * (H - yPad * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      {[0.5].map(g => <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="var(--balsm-ink-100)" strokeWidth="1" />)}
      {series.map((s, si) => {
        const pts = s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
        return (
          <g key={si}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {s.data.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={i === (rtl ? 0 : n - 1) ? 4 : 2.5} fill="#fff" stroke={s.color} strokeWidth="2" />)}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Account switcher sheet ─────────────────────────────── */
function AccountSwitcherSheet({ onClose }) {
  const { t, lang, account, switchAccount } = useApp();

  const handleSwitch = (id) => { switchAccount(id); onClose(); };

  return (
    <>
      <style>{`@keyframes qlSlideUp{from{transform:translateY(110%)}to{transform:none}}`}</style>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(43,43,37,0.36)', backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 41,
        background: '#fff', borderRadius: '20px 20px 0 0',
        animation: 'qlSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
        paddingBottom: 38,
      }}>
        {/* Handle + title */}
        <div style={{ padding: '10px 20px 0' }}>
          <div style={{ width: 38, height: 4, borderRadius: 999, background: 'var(--balsm-ink-200)', margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--balsm-ink-100)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-lg)', color: 'var(--fg1)' }}>
              {t('your_accounts')}
            </div>
            <button className="round-btn ghost" onClick={onClose}><Icon name="x" size={17} /></button>
          </div>
        </div>

        {/* Accounts list */}
        <div style={{ padding: '4px 20px' }}>
          {FAMILY_ACCOUNTS.map((acc, idx) => {
            const isActive = acc.id === account.id;
            return (
              <div key={acc.id} onClick={() => handleSwitch(acc.id)} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0',
                borderBottom: idx < FAMILY_ACCOUNTS.length - 1 ? '1px solid var(--balsm-ink-50)' : 'none',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 9999,
                  background: acc.color, color: '#fff', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
                  boxShadow: isActive ? `0 0 0 3px ${acc.color}33` : 'none',
                  transition: 'box-shadow 0.2s',
                }}>{acc.initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--pt-md)', color: 'var(--fg1)' }}>{acc.name[lang]}</div>
                  <div style={{ fontSize: 'var(--pt-sm)', color: 'var(--fg3)', marginTop: 3 }}>
                    {acc.relation[lang]} · {acc.age} {lang === 'ar' ? 'سنة' : 'yrs'}
                    {acc.conditions.length > 0 && <> · {acc.conditions[0][lang]}</>}
                  </div>
                </div>
                {isActive && <Icon name="check-circle-2" size={22} style={{ color: 'var(--app-accent)', flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>

        {/* Add family member */}
        <div style={{ padding: '12px 20px 0' }}>
          <button className="btn secondary block" style={{ height: 48 }}>
            <Icon name="user-plus" size={18} />{t('add_member')}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Home screen ─────────────────────────────────────────── */
function HomeScreen() {
  const { t, lang, openFlow, setTab, today, account, country } = useApp();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const checkedIn = !!today;
  const cur = today || { bp: HISTORY[0].bp, glu: HISTORY[0].glu, mood: HISTORY[0].mood, pain: HISTORY[0].pain };
  const moodLbl = cur.mood ? t('mood_' + cur.mood) : '—';

  const metrics = [
    { icon: 'activity',    lab: t('m_bp'),      val: cur.bp || '—',       unit: t('unit_bp'),  foot: t('bp_normal'), tone: 'down' },
    { icon: 'droplet',     lab: t('m_glucose'),  val: cur.glu || '—',      unit: t('unit_glu'), foot: t('bp_high'),   tone: 'up'   },
    { icon: 'smile',       lab: t('m_mood'),     val: moodLbl,             unit: '',            foot: '',             tone: ''     },
    { icon: 'thermometer', lab: t('m_pain'),     val: (cur.pain ?? 0) + '/10', unit: '',        foot: '',             tone: ''     },
  ];

  const nextAppt = APPOINTMENTS.find(a => a.status === 'upcoming');
  const apptDoc  = nextAppt ? DOCTORS.find(d => d.id === nextAppt.doctorId) : null;

  return (
    <React.Fragment>
      <div className="screen-scroll fade-in">
        <div className="pad-top" />

        {/* App bar */}
        <div className="appbar">
          <button
            className="avatar"
            style={{ background: account.color, border: 'none', cursor: 'pointer', position: 'relative' }}
            onClick={() => setSwitcherOpen(true)}
            aria-label={t('switch_account')}
          >
            {account.initials}
            {/* Multi-account indicator dot */}
            {FAMILY_ACCOUNTS.length > 1 && (
              <div style={{
                position: 'absolute', bottom: -1, right: -1,
                width: 14, height: 14, borderRadius: 99,
                background: '#fff', border: '1.5px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--app-accent)' }} />
              </div>
            )}
          </button>
          <div className="grow">
            <div className="meta">{t('greet')}</div>
            <h1 style={{ fontSize: 'var(--pt-xl)' }}>{account.name[lang].split(' ')[0]}</h1>
          </div>
          <button className="round-btn" aria-label="Reminders"><Icon name="bell" /></button>
        </div>

        {/* Travel banner */}
        {country && !country.home && (
          <div style={{
            margin: '0 20px 14px', padding: '12px 16px', borderRadius: 'var(--radius-lg)',
            background: 'var(--balsm-sun-500)', color: '#3A2E05',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Icon name="plane" size={20} style={{ flexShrink: 0 }} />
            <div className="grow" style={{ lineHeight: 1.35 }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--pt-sm)' }}>{t('away_banner')} · {country.name[lang]}</div>
              <div style={{ fontSize: 'var(--pt-xs)', opacity: 0.85 }}>{t('emergency')} <b className="num">{country.emergency}</b></div>
            </div>
            <button className="round-btn" onClick={() => setTab('profile')} style={{ background: 'rgba(58,46,5,0.12)', flexShrink: 0 }} aria-label={t('p_country')}>
              <Icon name="chevron-right" size={18} style={{ color: '#3A2E05', transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
            </button>
          </div>
        )}

        {/* Hero check-in */}
        {!checkedIn ? (
          <div className="hero-card">
            <img className="mark-wm" src="assets/logo-vertical.svg" alt="" />
            <div className="label">{t('today_lbl')}</div>
            <div className="h" style={{ textWrap: 'balance' }}>{t('hero_q')}</div>
            <div className="cta" onClick={openFlow} style={{ whiteSpace: 'nowrap' }}>
              <Icon name="plus-circle" size={20} />{t('hero_cta')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 'var(--pt-sm)', opacity: 0.9 }}>
              <Icon name="clock" size={15} />{t('hero_time')}
            </div>
          </div>
        ) : (
          <div className="hero-card done">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="confirm-mark" style={{ width: 52, height: 52, margin: 0 }}><Icon name="check" size={28} /></div>
              <div className="grow">
                <div className="label">{t('done_lbl')}</div>
                <div className="subhead" style={{ marginTop: 2 }}>{t('done_q')}</div>
              </div>
              <button className="round-btn" onClick={() => setTab('trends')}>
                <Icon name="chevron-right" style={{ transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
              </button>
            </div>
          </div>
        )}

        {/* Upcoming appointment strip */}
        {nextAppt && apptDoc && (
          <div className="card" style={{ margin: '14px 20px 0', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}
            onClick={() => setTab('appts')}>
            <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--app-accent-50)', color: 'var(--app-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="calendar" size={19} />
            </div>
            <div className="grow">
              <div style={{ fontSize: 'var(--pt-2xs)', fontWeight: 700, color: 'var(--app-accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>{t('upcoming_appt')}</div>
              <div style={{ fontSize: 'var(--pt-sm)', fontWeight: 600, color: 'var(--fg1)' }}>
                {apptDoc.name[lang]} · {nextAppt.date[lang]} {nextAppt.time}
              </div>
            </div>
            <Icon name="chevron-right" size={18} style={{ color: 'var(--fg4)', flexShrink: 0, transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
          </div>
        )}

        {/* Streak */}
        <div className="card" style={{ margin: '14px 20px 0', padding: 16 }}>
          <div className="streak">
            <div className="ring">
              <svg width="56" height="56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="var(--balsm-ink-100)" strokeWidth="6" />
                <circle cx="28" cy="28" r="24" fill="none" stroke="var(--app-accent)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 * (1 - 6 / 7)} />
              </svg>
              <div className="rtxt">6</div>
            </div>
            <div className="grow">
              <div className="subhead" style={{ fontSize: 'var(--pt-md)' }}><b className="num">6</b> {t('streak')}</div>
              <div className="meta" style={{ marginTop: 2 }}>{t('streak_help')}</div>
            </div>
            <Icon name="flame" size={24} style={{ color: 'var(--balsm-sun-500)' }} />
          </div>
        </div>

        {/* Nearby care shortcut */}
        <div className="card" style={{ margin: '14px 20px 0', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}
          onClick={() => setTab('map')}>
          <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--hue-blue-50)', color: 'var(--hue-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="map-pin" size={19} />
          </div>
          <div className="grow">
            <div style={{ fontSize: 'var(--pt-md)', fontWeight: 600, color: 'var(--fg1)' }}>{t('map_nearby')}</div>
            <div style={{ fontSize: 'var(--pt-sm)', color: 'var(--fg3)', marginTop: 1 }}>{HEALTH_ENTITIES.length} {lang === 'ar' ? 'مكان بالقرب منك' : 'places mapped nearby'}</div>
          </div>
          <Icon name="chevron-right" size={18} style={{ color: 'var(--fg4)', flexShrink: 0, transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
        </div>

        {/* Health records shortcut */}
        <div className="card" style={{ margin: '14px 20px 0', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}
          onClick={() => setTab('records')}>
          <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--hue-violet-50)', color: 'var(--hue-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="folder-heart" size={19} />
          </div>
          <div className="grow">
            <div style={{ fontSize: 'var(--pt-md)', fontWeight: 600, color: 'var(--fg1)' }}>{t('records')}</div>
            <div style={{ fontSize: 'var(--pt-sm)', color: 'var(--fg3)', marginTop: 1 }}>{HEALTH_RECORDS.length} {lang === 'ar' ? 'مستند' : 'documents'}</div>
          </div>
          <Icon name="chevron-right" size={18} style={{ color: 'var(--fg4)', flexShrink: 0, transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
        </div>

        {/* Latest readings */}
        <div className="row-head"><h2>{t('latest')}</h2></div>
        <div className="metric-grid">
          {metrics.map((m, i) => (
            <div key={i} className="metric">
              <div className="mlab"><Icon name={m.icon} size={15} />{m.lab}</div>
              <div className="mval" dir={/[0-9]/.test(String(m.val)) ? 'ltr' : undefined}
                style={{ textAlign: lang === 'ar' && /[0-9]/.test(String(m.val)) ? 'right' : undefined }}>
                {m.val}{m.unit && <span className="unit">{m.unit}</span>}
              </div>
              {m.foot && (
                <div className={cx('mfoot', m.tone)}>
                  {m.tone && <Icon name={m.tone === 'up' ? 'arrow-up-right' : 'arrow-down-right'} size={14} />}{m.foot}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Today's meds */}
        <div className="row-head"><h2>{t('meds_today')}</h2><a onClick={() => setTab('meds')}>{t('see_all')}</a></div>
        <div className="card" style={{ margin: '0 20px' }}>
          {MEDS.map((m, i) => {
            const bg = { info:'var(--hue-blue-50)', violet:'var(--hue-violet-50)', success:'var(--hue-mint-50)' }[m.tone];
            const fg = { info:'var(--hue-blue)',    violet:'var(--hue-violet)',    success:'var(--hue-mint-600)' }[m.tone];
            const done = checkedIn || i === 0;
            return (
              <div key={m.id} className="med-row">
                <div className="med-ico" style={{ background: bg, color: fg }}><Icon name={m.icon} /></div>
                <div className="grow">
                  <div className="mname">{m.name[lang]}</div>
                  <div className="mdose">{m.dose[lang]}</div>
                </div>
                {done
                  ? <span className="pill success"><span className="dot" />{t('taken')}</span>
                  : <button className="btn soft" style={{ height: 40, padding: '0 18px' }}>{t('take')}</button>}
              </div>
            );
          })}
        </div>

        {/* Recent reports */}
        <div className="row-head"><h2>{t('recent')}</h2><a onClick={() => setTab('trends')}>{t('see_all')}</a></div>
        <div className="card" style={{ margin: '0 20px' }}>
          {HISTORY.slice(0, 3).map((h, i) => <HistoryRow key={i} h={h} onClick={() => setTab('trends')} />)}
        </div>

        <div style={{ height: 24 }} />
      </div>

      {switcherOpen && <AccountSwitcherSheet onClose={() => setSwitcherOpen(false)} />}
    </React.Fragment>
  );
}

function HistoryRow({ h, onClick }) {
  const { t, lang } = useApp();
  const pinfo = h.pain === 0 ? 'success' : h.pain <= 3 ? 'success' : h.pain <= 6 ? 'warn' : 'danger';
  return (
    <div className="history-row" onClick={onClick}>
      <div className="h-date">
        <div className="d num">{h.d}</div>
        <div className="m">{h.m[lang]}</div>
      </div>
      <div className="grow">
        <div className="hsummary">
          <Icon name="activity" size={14} style={{ color: 'var(--hue-violet)' }} /><span className="num" dir="ltr">{h.bp}</span>
          <span style={{ color: 'var(--balsm-ink-300)' }}>·</span>
          <Icon name="droplet" size={14} style={{ color: 'var(--hue-mint-600)' }} /><span className="num">{h.glu}</span>
        </div>
      </div>
      <MoodFace level={h.mood} size={26} color={MOOD_COLORS[h.mood - 1]} />
      <span className={cx('pill', pinfo)} style={{ padding: '3px 8px' }}><span className="num">{h.pain}</span></span>
    </div>
  );
}

/* ── Trends ──────────────────────────────────────────────── */
function TrendsScreen() {
  const { t, lang, setTab } = useApp();
  const [range, setRange] = useState('range_w');
  const rtl = lang === 'ar';
  return (
    <div className="screen-scroll fade-in">
      <div className="pad-top" />
      <div className="appbar">
        <button className="round-btn" onClick={() => setTab('home')} aria-label="Back">
          <Icon name="arrow-left" style={{ transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
        </button>
        <h1 className="grow">{t('trends')}</h1>
        <div className="range-tabs">
          {['range_w','range_m','range_3m'].map(r => <button key={r} className={cx(range===r&&'on')} onClick={() => setRange(r)}>{t(r)}</button>)}
        </div>
      </div>
      <div className="card chart-card">
        <div className="chart-head">
          <span className="ctitle">{t('m_bp')}</span>
          <span className="cval">{t('avg')} <b className="num" style={{ color: 'var(--fg1)' }}>131/84</b> {t('unit_bp')}</span>
        </div>
        <LineChart rtl={rtl} series={[{ data: TREND_BP_SYS, color: 'var(--hue-violet)' }, { data: TREND_BP_DIA, color: 'var(--hue-blue)' }]} />
        <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
          <span className="meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--hue-violet)', display: 'inline-block' }} />{t('sys')}</span>
          <span className="meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--hue-blue)', display: 'inline-block' }} />{t('dia')}</span>
        </div>
      </div>
      <div className="card chart-card" style={{ marginTop: 14 }}>
        <div className="chart-head">
          <span className="ctitle">{t('m_glucose')}</span>
          <span className="cval">{t('avg')} <b className="num" style={{ color: 'var(--fg1)' }}>144</b> {t('unit_glu')}</span>
        </div>
        <LineChart rtl={rtl} series={[{ data: TREND_GLU, color: 'var(--hue-mint-600)' }]} />
      </div>
      <div className="row-head"><h2>{t('reports')}</h2></div>
      <div className="card" style={{ margin: '0 20px' }}>
        {HISTORY.map((h, i) => <HistoryRow key={i} h={h} onClick={() => {}} />)}
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

/* ── Meds ────────────────────────────────────────────────── */
function MedsScreen() {
  const { t, lang } = useApp();
  const [rxOpen, setRxOpen] = useState(false);
  if (rxOpen) return <PrescriptionsScreen onBack={() => setRxOpen(false)} />;

  const groups = [
    { key: 'morning', icon: 'sunrise', meds: MEDS.filter(m => m.when === 'morning') },
    { key: 'evening', icon: 'moon',    meds: MEDS.filter(m => m.when === 'evening') },
  ];
  const activeRxCount = PRESCRIPTIONS.filter(r => r.status === 'active').length;

  return (
    <div className="screen-scroll fade-in">
      <div className="pad-top" />
      <div className="appbar"><h1 className="grow">{t('medications')}</h1></div>

      <div className="card list-card">
        <div className="list-row" onClick={() => setRxOpen(true)}>
          <div className="lico" style={{ background: 'var(--hue-violet-50)', color: 'var(--hue-violet)' }}><Icon name="file-text" /></div>
          <div className="grow">{t('prescriptions')}</div>
          <span className="pill success" style={{ marginRight: 8 }}><span className="dot" />{activeRxCount} {t('rx_active').toLowerCase()}</span>
          <span className="rchev"><Icon name="chevron-right" /></span>
        </div>
      </div>

      <div className="card" style={{ margin: '0 20px 8px', padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="ring">
          <svg width="56" height="56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--balsm-ink-100)" strokeWidth="6" />
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--hue-mint)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 * (1 - 0.92)} />
          </svg>
          <div className="rtxt num" style={{ fontSize: 'var(--pt-sm)' }}>92%</div>
        </div>
        <div className="grow">
          <div className="subhead" style={{ fontSize: 'var(--pt-md)' }}><b className="num">92%</b> · {t('adherence')}</div>
          <span className="pill success" style={{ marginTop: 6 }}><span className="dot" />{t('on_track')}</span>
        </div>
      </div>

      {groups.map(g => (
        <div key={g.key}>
          <div className="row-head" style={{ margin: '18px 0 10px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--pt-md)' }}>
              <Icon name={g.icon} size={18} style={{ color: 'var(--fg3)' }} />{t(g.key)}
            </h2>
          </div>
          <div className="card" style={{ margin: '0 20px' }}>
            {g.meds.map(m => {
              const bg = { info:'var(--hue-blue-50)', violet:'var(--hue-violet-50)', success:'var(--hue-mint-50)' }[m.tone];
              const fg = { info:'var(--hue-blue)',    violet:'var(--hue-violet)',    success:'var(--hue-mint-600)' }[m.tone];
              return (
                <div key={m.id} className="med-row">
                  <div className="med-ico" style={{ background: bg, color: fg }}><Icon name={m.icon} /></div>
                  <div className="grow">
                    <div className="mname">{m.name[lang]}</div>
                    <div className="mdose">{m.dose[lang]}</div>
                  </div>
                  {m.id === 'metformin'
                    ? <span className="pill success"><span className="dot" />{t('taken')}</span>
                    : <span className="pill neutral"><span className="dot" />{t('due')}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div style={{ height: 24 }} />
    </div>
  );
}


/* ── Personal details screen ──────────────────────────────── */
function PersonalDetailsScreen({ onBack }) {
  const { t, lang, setNavHidden } = useApp();
  const [saved, setSaved]         = useState(false);
  const [qrOpen, setQrOpen]       = useState(false);
  useEffect(() => { setNavHidden(true); return () => setNavHidden(false); }, []);
  const [firstName, setFirstName] = useState(PATIENT.firstName[lang] || PATIENT.firstName.en);
  const [lastName,  setLastName]  = useState(PATIENT.lastName[lang]  || PATIENT.lastName.en);
  const [dob,       setDob]       = useState('1967-03-14');
  const [gender,    setGender]    = useState(PATIENT.gender);
  const [phone,     setPhone]     = useState(PATIENT.phone);
  const [nid,       setNid]       = useState(PATIENT.nid);
  const [nat,       setNat]       = useState(PATIENT.nationality ? (PATIENT.nationality[lang] || PATIENT.nationality.en) : (lang === 'ar' ? 'مصرية' : 'Egyptian'));
  const [blood,     setBlood]     = useState(PATIENT.bloodType);
  const [weight,    setWeight]    = useState(String(PATIENT.weight));
  const [height,    setHeight]    = useState(String(PATIENT.height));
  const [emName,    setEmName]    = useState(PATIENT.emergency.name);
  const [emRel,     setEmRel]     = useState(PATIENT.emergency.relation[lang] || PATIENT.emergency.relation.en);
  const [emPhone,   setEmPhone]   = useState(PATIENT.emergency.phone);

  /* username */
  const [handle, setHandle, unStatus] = useUsername('layla_hassan58');

  /* connected accounts */
  const [connApple,  setConnApple]  = useState(false);
  const [connGoogle, setConnGoogle] = useState(false);

  const [saving, setSaving] = useState(false);
  const save = () => { if (saving) return; setSaving(true); setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }, 850); };

  const Field = ({ label, children, half }) => (
    <div className="field" style={half ? { flex: 1 } : {}}>{label && <label style={{ fontSize: 'var(--pt-xs)', fontWeight: 700, color: 'var(--fg3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</label>}{children}</div>
  );
  const SectionHead = ({ icon, title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 10px', color: 'var(--fg2)', fontWeight: 700, fontSize: 'var(--pt-sm)' }}>
      <Icon name={icon} size={16} style={{ color: 'var(--app-accent)' }} />{title}
    </div>
  );

  return (
    <div className="screen fade-in">
      <div className="pad-top" />
      <div className="appbar">
        <button className="round-btn" onClick={onBack} aria-label="Back">
          <Icon name="arrow-left" style={{ transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
        </button>
        <h1 style={{ flex: 1, margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-xl)', letterSpacing: '-0.01em', color: 'var(--fg1)' }}>
          {t('p_personal')}
        </h1>
        {saved && <span className="pill success"><span className="dot" />{t('pd_saved')}</span>}
        <button className="round-btn" onClick={() => setQrOpen(true)} aria-label={lang === 'ar' ? 'رمز QR' : 'QR code'}>
          <Icon name="qr-code" />
        </button>
      </div>

      <div className="screen-scroll" style={{ padding: '0 20px 28px' }}>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '14px 0 20px' }}>
          <div style={{ width: 72, height: 72, borderRadius: 9999, background: 'var(--hue-aqua)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26 }}>
            {(firstName[0] || '') + (lastName[0] || '')}
          </div>
          <button className="btn ghost" style={{ fontSize: 'var(--pt-sm)', color: 'var(--app-accent)', fontWeight: 600 }}>
            <Icon name="camera" size={15} />{lang === 'ar' ? 'تغيير الصورة' : 'Change photo'}
          </button>
        </div>

        {/* Account section */}
        <SectionHead icon="at-sign" title={lang === 'ar' ? 'الحساب' : 'Account'} />
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 4 }}>
          <UsernameField handle={handle} setHandle={setHandle} status={unStatus} t={t} lang={lang} />
          <div style={{ fontSize: 'var(--pt-xs)', color: 'var(--fg3)', marginTop: -8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="info" size={12} />
            <span dir="ltr" style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg3)' }}>balsm.health/@{handle || '…'}</span>
          </div>
          <button onClick={() => setQrOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px',
            background: 'var(--app-accent-50)', border: '1px solid var(--app-accent-100, var(--balsm-ink-100))',
            borderRadius: 'var(--radius-lg)', cursor: 'pointer', textAlign: 'start',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(43,43,37,0.08)' }}>
              <Icon name="qr-code" size={22} style={{ color: 'var(--app-accent)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--pt-md)', color: 'var(--fg1)' }}>{lang === 'ar' ? 'مشاركة رمز QR' : 'Share my QR code'}</div>
              <div style={{ fontSize: 'var(--pt-xs)', color: 'var(--fg3)', marginTop: 1 }}>{lang === 'ar' ? 'شارك ملفك بأمان عبر رمز' : 'Let others scan to connect'}</div>
            </div>
            <Icon name={lang === 'ar' ? 'chevron-left' : 'chevron-right'} size={18} style={{ color: 'var(--fg3)', flexShrink: 0 }} />
          </button>
        </div>

        {/* Connected accounts */}
        <SectionHead icon="link" title={t('conn_accounts')} />
        <div className="card" style={{ padding: '0', marginBottom: 4, overflow: 'hidden' }}>
          {[
            { key: 'apple',  Icon: () => <AppleIcon />,  label: t('conn_apple'),  connected: connApple,  toggle: () => setConnApple(v => !v)  },
            { key: 'google', Icon: () => <GoogleIcon />, label: t('conn_google'), connected: connGoogle, toggle: () => setConnGoogle(v => !v) },
          ].map(({ key, Icon: Ico, label, connected, toggle }, i, arr) => (
            <div key={key} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: i < arr.length - 1 ? '1px solid var(--balsm-ink-100)' : 'none' }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: key === 'apple' ? '#1A1A17' : '#fff', border: key === 'google' ? '1px solid var(--balsm-ink-100)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ico />
              </div>
              <div className="grow">
                <div style={{ fontWeight: 600, fontSize: 'var(--pt-md)', color: 'var(--fg1)' }}>{label}</div>
                {connected && <div style={{ fontSize: 'var(--pt-xs)', color: 'var(--hue-mint-600)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="check-circle" size={12} />{t('conn_primary')}</div>}
              </div>
              <button onClick={toggle} className={connected ? 'btn secondary' : 'btn soft'} style={{ height: 36, padding: '0 14px', fontSize: 'var(--pt-sm)', flexShrink: 0 }}>
                {connected ? t('conn_remove') : t('conn_connect')}
              </button>
            </div>
          ))}
        </div>

        {/* Basic info */}
        <SectionHead icon="user" title={lang === 'ar' ? 'المعلومات الأساسية' : 'Basic info'} />
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 4 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Field label={t('pd_fname')} half><input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} /></Field>
            <Field label={t('pd_lname')} half><input className="input" value={lastName}  onChange={e => setLastName(e.target.value)} /></Field>
          </div>
          <Field label={t('pd_dob')}>
            <input className="input" type="date" value={dob} onChange={e => setDob(e.target.value)} />
          </Field>
          <Field label={t('pd_gender')}>
            <div className="segmented" style={{ width: '100%' }}>
              <button className={cx(gender === 'female' && 'active')} onClick={() => setGender('female')}>{t('pd_female')}</button>
              <button className={cx(gender === 'male'   && 'active')} onClick={() => setGender('male')}>{t('pd_male')}</button>
            </div>
          </Field>
        </div>

        {/* Contact */}
        <SectionHead icon="phone" title={lang === 'ar' ? 'معلومات الاتصال' : 'Contact'} />
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 4 }}>
          <Field label={t('pd_phone')}>
            <input className="input num" dir="ltr" value={phone} onChange={e => setPhone(e.target.value)} />
          </Field>
          <Field label={t('pd_nid')}>
            <input className="input num" dir="ltr" value={nid} onChange={e => setNid(e.target.value)} maxLength={18} placeholder="2 9912 22 12345 6" />
          </Field>
          <Field label={lang === 'ar' ? 'الجنسية' : 'Nationality'}>
            <div style={{ position: 'relative' }}>
              <select className="input" value={nat} onChange={e => setNat(e.target.value)}
                style={{ appearance: 'none', WebkitAppearance: 'none', paddingInlineEnd: 38, cursor: 'pointer' }}>
                {(lang === 'ar'
                  ? ['مصرية','سعودية','إماراتية','أردنية','لبنانية','سورية','عراقية','فلسطينية','كويتية','قطرية','بحرينية','عمانية','يمنية','سودانية','ليبية','تونسية','جزائرية','مغربية','أخرى']
                  : ['Egyptian','Saudi','Emirati','Jordanian','Lebanese','Syrian','Iraqi','Palestinian','Kuwaiti','Qatari','Bahraini','Omani','Yemeni','Sudanese','Libyan','Tunisian','Algerian','Moroccan','Other']
                ).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <Icon name="chevron-down" size={16} style={{ position: 'absolute', insetInlineEnd: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg3)', pointerEvents: 'none' }} />
            </div>
          </Field>
        </div>

        {/* Emergency contact */}
        <SectionHead icon="phone-call" title={t('pd_emergency')} />
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
          <Field label={t('pd_em_name')}>
            <input className="input" value={emName} onChange={e => setEmName(e.target.value)} />
          </Field>
          <div style={{ display: 'flex', gap: 12 }}>
            <Field label={t('pd_em_rel')} half>
              <input className="input" value={emRel} onChange={e => setEmRel(e.target.value)} />
            </Field>
            <Field label={t('pd_em_phone')} half>
              <input className="input num" dir="ltr" value={emPhone} onChange={e => setEmPhone(e.target.value)} />
            </Field>
          </div>
        </div>

        <DSProgressButton block loading={saving} onClick={save}>
          {!saving && <Icon name={saved ? 'check' : 'save'} size={18} />}
          {saving ? (lang === 'ar' ? 'جارٍ الحفظ…' : 'Saving…') : (saved ? t('pd_saved') : t('pd_save'))}
        </DSProgressButton>
      </div>
      {qrOpen && (
        <QRShareSheet handle={handle} name={`${firstName} ${lastName}`.trim()} onClose={() => setQrOpen(false)} />
      )}
    </div>
  );
}

/* ── Profile ─────────────────────────────────────────────── */
/* Care team & Privacy: shared little toggle */
function PSwitch({ on, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-checked={on} role="switch" style={{
      width: 46, height: 28, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
      position: 'relative', padding: 0,
      background: on ? 'var(--app-accent)' : 'var(--balsm-ink-200)',
      transition: 'background var(--dur-base) var(--ease-out)',
    }}>
      <span style={{ position: 'absolute', top: 3, insetInlineStart: on ? 21 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'inset-inline-start var(--dur-base) var(--ease-out)' }} />
    </button>
  );
}

/* Care team screen */
function CareTeamScreen({ onBack }) {
  const { t, lang, setTab, setNavHidden } = useApp();
  useEffect(() => { setNavHidden(true); return () => setNavHidden(false); }, []);
  return (
    <div className="screen fade-in">
      <div className="pad-top" />
      <div className="appbar">
        <button className="round-btn" onClick={onBack} aria-label="Back">
          <Icon name="arrow-left" style={{ transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
        </button>
        <h1 style={{ flex: 1, margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-xl)', letterSpacing: '-0.01em', color: 'var(--fg1)' }}>{t('p_care')}</h1>
      </div>
      <div className="screen-scroll" style={{ padding: '0 20px 28px' }}>
        <p className="body" style={{ margin: '4px 0 18px', color: 'var(--fg3)', fontSize: 'var(--pt-sm)' }}>
          {lang === 'ar' ? 'الأطباء الذين يتابعون حالتك ويرون تقاريرك.' : 'The doctors following your condition and who can see your reports.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {DOCTORS.map((d, i) => (
            <div key={d.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 9999, background: d.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{d.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--pt-md)', color: 'var(--fg1)' }}>{d.name[lang]}</span>
                    {i === 0 && <span className="pill" style={{ background: 'var(--app-accent-50)', color: 'var(--app-accent-600)', fontSize: '10px', fontWeight: 700 }}>{lang === 'ar' ? 'الطبيب الأساسي' : 'Primary'}</span>}
                  </div>
                  <div style={{ fontSize: 'var(--pt-sm)', color: 'var(--fg3)', marginTop: 2 }}>{d.specialty[lang]}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 'var(--pt-xs)', color: 'var(--fg3)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="star" size={12} style={{ color: 'var(--balsm-sun-500)' }} /><span className="num">{d.rating}</span></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="briefcase" size={12} />{d.experience[lang]}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn secondary" style={{ flex: 1, height: 40, gap: 7, fontSize: 'var(--pt-sm)' }}><Icon name="message-circle" size={15} />{lang === 'ar' ? 'رسالة' : 'Message'}</button>
                <button className="btn primary" style={{ flex: 1, height: 40, gap: 7, fontSize: 'var(--pt-sm)' }} onClick={() => setTab('appts')}><Icon name="calendar" size={15} />{lang === 'ar' ? 'حجز' : 'Book'}</button>
              </div>
            </div>
          ))}
        </div>
        <button className="btn secondary block" style={{ marginTop: 16, gap: 8, borderStyle: 'dashed' }} onClick={() => setTab('map')}>
          <Icon name="user-plus" size={17} />{lang === 'ar' ? 'ابحث عن طبيب جديد' : 'Find a new doctor'}
        </button>
      </div>
    </div>
  );
}

/* Privacy & data screen */
function PrivacyDataScreen({ onBack }) {
  const { t, lang, setNavHidden } = useApp();
  useEffect(() => { setNavHidden(true); return () => setNavHidden(false); }, []);
  const [shareTeam, setShareTeam]   = useState(true);
  const [analytics, setAnalytics]   = useState(false);
  const [research,  setResearch]    = useState(false);
  const [bioLock,   setBioLock]     = useState(true);
  const [pinOpen,   setPinOpen]     = useState(false);

  const PvSection = ({ icon, title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 10px', color: 'var(--fg2)', fontWeight: 700, fontSize: 'var(--pt-sm)' }}>
      <Icon name={icon} size={16} style={{ color: 'var(--app-accent)' }} />{title}
    </div>
  );
  const ToggleRow = ({ title, desc, on, set, last }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: last ? 'none' : '1px solid var(--balsm-ink-100)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 'var(--pt-md)', color: 'var(--fg1)' }}>{title}</div>
        {desc && <div style={{ fontSize: 'var(--pt-xs)', color: 'var(--fg3)', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>}
      </div>
      <PSwitch on={on} onClick={() => set(v => !v)} />
    </div>
  );
  const ActionRow = ({ icon, title, desc, danger, last, onClick }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer', borderBottom: last ? 'none' : '1px solid var(--balsm-ink-100)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: danger ? '#FBEBE7' : 'var(--balsm-ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={18} style={{ color: danger ? 'var(--balsm-danger)' : 'var(--fg2)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 'var(--pt-md)', color: danger ? 'var(--balsm-danger)' : 'var(--fg1)' }}>{title}</div>
        {desc && <div style={{ fontSize: 'var(--pt-xs)', color: 'var(--fg3)', marginTop: 2 }}>{desc}</div>}
      </div>
      <Icon name={lang === 'ar' ? 'chevron-left' : 'chevron-right'} size={18} style={{ color: 'var(--fg3)', flexShrink: 0 }} />
    </div>
  );

  return (
    <div className="screen fade-in">
      <div className="pad-top" />
      <div className="appbar">
        <button className="round-btn" onClick={onBack} aria-label="Back">
          <Icon name="arrow-left" style={{ transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
        </button>
        <h1 style={{ flex: 1, margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-xl)', letterSpacing: '-0.01em', color: 'var(--fg1)' }}>{t('p_privacy')}</h1>
      </div>
      <div className="screen-scroll" style={{ padding: '0 20px 28px' }}>

        <PvSection icon="share-2" title={lang === 'ar' ? 'مشاركة البيانات' : 'Data sharing'} />
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <ToggleRow on={shareTeam} set={setShareTeam}
            title={lang === 'ar' ? 'مشاركة التقارير مع فريق الرعاية' : 'Share reports with care team'}
            desc={lang === 'ar' ? 'يرى أطباؤك قراءاتك وتقاريرك اليومية' : 'Your doctors can see your daily readings'} />
          <ToggleRow on={analytics} set={setAnalytics}
            title={lang === 'ar' ? 'تحليلات مجهولة' : 'Anonymous analytics'}
            desc={lang === 'ar' ? 'ساعدنا على تحسين التطبيق' : 'Help us improve the app'} />
          <ToggleRow on={research} set={setResearch} last
            title={lang === 'ar' ? 'المساهمة في الأبحاث' : 'Research contributions'}
            desc={lang === 'ar' ? 'بيانات مجهولة للأبحاث الطبية' : 'De-identified data for medical studies'} />
        </div>

        <PvSection icon="lock" title={lang === 'ar' ? 'الأمان' : 'Security'} />
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <ToggleRow on={bioLock} set={setBioLock}
            title={lang === 'ar' ? 'قفل بالبصمة / الوجه' : 'Biometric app lock'}
            desc={lang === 'ar' ? 'افتح التطبيق ببصمتك' : 'Unlock the app with Face ID / fingerprint'} />
          <ToggleRow on={pinOpen} set={setPinOpen} last
            title={lang === 'ar' ? 'طلب رمز PIN عند الفتح' : 'Require PIN on open'}
            desc={lang === 'ar' ? 'طبقة حماية إضافية' : 'An extra layer of protection'} />
        </div>

        <PvSection icon="database" title={lang === 'ar' ? 'بياناتك' : 'Your data'} />
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <ActionRow icon="download" title={lang === 'ar' ? 'تصدير بياناتي' : 'Export my data'} desc={lang === 'ar' ? 'ملف PDF أو CSV' : 'As a PDF or CSV file'} />
          <ActionRow icon="folder-heart" title={lang === 'ar' ? 'تحميل السجلات الصحية' : 'Download health records'} desc={lang === 'ar' ? 'جميع التحاليل والأشعة' : 'All labs and scans'} />
          <ActionRow icon="app-window" last title={lang === 'ar' ? 'التطبيقات المتصلة' : 'Connected apps'} desc={lang === 'ar' ? 'إدارة الوصول للطرف الثالث' : 'Manage third-party access'} />
        </div>

        <PvSection icon="alert-triangle" title={lang === 'ar' ? 'منطقة الخطر' : 'Danger zone'} />
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <ActionRow icon="trash-2" danger last title={lang === 'ar' ? 'حذف حسابي' : 'Delete my account'} desc={lang === 'ar' ? 'حذف دائم لكل بياناتك' : 'Permanently erase all your data'} />
        </div>

        <p className="meta" style={{ textAlign: 'center', margin: '18px 0 0', display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', color: 'var(--fg3)' }}>
          <Icon name="shield-check" size={14} />{lang === 'ar' ? 'بياناتك مشفّرة ومحمية' : 'Your data is encrypted and protected'}
        </p>
      </div>
    </div>
  );
}

/* Medical profile screen */
function MedicalProfileScreen({ onBack }) {
  const { t, lang, account, setNavHidden } = useApp();
  useEffect(() => { setNavHidden(true); return () => setNavHidden(false); }, []);
  const [saved, setSaved]   = useState(false);
  const [blood, setBlood]   = useState(PATIENT.bloodType);
  const [weight, setWeight] = useState(String(PATIENT.weight));
  const [height, setHeight] = useState(String(PATIENT.height));

  const bmi = (() => {
    const w = parseFloat(weight), h = parseFloat(height) / 100;
    if (!w || !h || w <= 0 || h <= 0) return null;
    const v = w / (h * h);
    if (!isFinite(v)) return null;
    const cat = v < 18.5
      ? { key: 'bmi_under',  color: 'var(--hue-blue)',           bg: 'var(--hue-blue-50)' }
      : v < 25  ? { key: 'bmi_normal', color: 'var(--hue-mint-600)',       bg: 'var(--hue-mint-50)' }
      : v < 30  ? { key: 'bmi_over',   color: 'var(--balsm-expiring,#D97A20)', bg: '#FBF0E2' }
      :           { key: 'bmi_obese',  color: 'var(--balsm-danger)',          bg: '#FBEBE7' };
    const pct = Math.max(2, Math.min(98, ((v - 15) / (35 - 15)) * 100));
    return { value: v.toFixed(1), pct, ...cat };
  })();
  const [conds, setConds]   = useState(() => account.conditions.map(c => c[lang] || c.en));
  const [allergies, setAllergies] = useState(lang === 'ar' ? ['البنسلين', 'حبوب اللقاح'] : ['Penicillin', 'Pollen']);
  const [condInput, setCondInput] = useState('');
  const [algInput, setAlgInput]   = useState('');

  const [saving, setSaving] = useState(false);
  const save = () => { if (saving) return; setSaving(true); setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }, 850); };

  const SectionHead = ({ icon, title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 10px', color: 'var(--fg2)', fontWeight: 700, fontSize: 'var(--pt-sm)' }}>
      <Icon name={icon} size={16} style={{ color: 'var(--app-accent)' }} />{title}
    </div>
  );
  const ChipEditor = ({ items, setItems, value, setValue, placeholder, tone }) => (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: items.length ? 12 : 0 }}>
        {items.map((c, i) => (
          <span key={i} className="pill" style={{ background: tone.bg, color: tone.fg, display: 'inline-flex', alignItems: 'center', gap: 6, paddingInlineEnd: 6 }}>
            {c}
            <button onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label="Remove"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', padding: 0, color: tone.fg, opacity: 0.7 }}>
              <Icon name="x" size={13} />
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="input" value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder}
          onKeyDown={e => { if (e.key === 'Enter' && value.trim()) { setItems([...items, value.trim()]); setValue(''); } }}
          style={{ flex: 1, height: 44 }} />
        <button className="btn secondary" style={{ width: 44, height: 44, padding: 0, flexShrink: 0 }}
          onClick={() => { if (value.trim()) { setItems([...items, value.trim()]); setValue(''); } }}>
          <Icon name="plus" size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="screen fade-in">
      <div className="pad-top" />
      <div className="appbar">
        <button className="round-btn" onClick={onBack} aria-label="Back">
          <Icon name="arrow-left" style={{ transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
        </button>
        <h1 style={{ flex: 1, margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-xl)', letterSpacing: '-0.01em', color: 'var(--fg1)' }}>{t('p_cond')}</h1>
        {saved && <span className="pill success"><span className="dot" />{t('pd_saved')}</span>}
      </div>
      <div className="screen-scroll" style={{ padding: '0 20px 28px' }}>

        <SectionHead icon="clipboard-list" title={lang === 'ar' ? 'الحالات المزمنة' : 'Chronic conditions'} />
        <ChipEditor items={conds} setItems={setConds} value={condInput} setValue={setCondInput}
          placeholder={lang === 'ar' ? 'أضف حالة…' : 'Add a condition…'}
          tone={{ bg: 'var(--app-accent-50)', fg: 'var(--app-accent-600)' }} />

        <SectionHead icon="alert-octagon" title={lang === 'ar' ? 'الحساسية' : 'Allergies'} />
        <ChipEditor items={allergies} setItems={setAllergies} value={algInput} setValue={setAlgInput}
          placeholder={lang === 'ar' ? 'أضف حساسية…' : 'Add an allergy…'}
          tone={{ bg: '#FBEBE7', fg: 'var(--balsm-danger)' }} />

        <SectionHead icon="droplet" title={lang === 'ar' ? 'فصيلة الدم' : 'Blood type'} />
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bt => (
              <button key={bt} onClick={() => setBlood(bt)} style={{
                height: 40, padding: '0 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                border: `1.5px solid ${blood === bt ? 'var(--app-accent)' : 'var(--balsm-border)'}`,
                background: blood === bt ? 'var(--app-accent-50)' : '#fff',
                color: blood === bt ? 'var(--app-accent-600)' : 'var(--fg2)',
                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--pt-sm)',
                transition: 'all var(--dur-fast) var(--ease-out)',
              }}>{bt}</button>
            ))}
          </div>
        </div>

        <SectionHead icon="ruler" title={lang === 'ar' ? 'القياسات' : 'Measurements'} />
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="field" style={{ flex: 1, margin: 0 }}>
              <label style={{ fontSize: 'var(--pt-xs)', fontWeight: 700, color: 'var(--fg3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{`${t('pd_weight')} (${t('pd_kg')})`}</label>
              <input className="input num" dir="ltr" type="number" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1, margin: 0 }}>
              <label style={{ fontSize: 'var(--pt-xs)', fontWeight: 700, color: 'var(--fg3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{`${t('pd_height')} (${t('pd_cm')})`}</label>
              <input className="input num" dir="ltr" type="number" value={height} onChange={e => setHeight(e.target.value)} />
            </div>
          </div>
          {bmi && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--balsm-ink-100)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: lang === 'ar' ? 'flex-end' : 'flex-start', flexShrink: 0 }}>
                <span style={{ fontSize: 'var(--pt-2xs)', fontWeight: 700, color: 'var(--fg3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t('bmi_label')}</span>
                <span className="num" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-2xl)', color: 'var(--fg1)', lineHeight: 1.1 }}>{bmi.value}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="pill" style={{ background: bmi.bg, color: bmi.color, fontWeight: 700, fontSize: '11px' }}>{t(bmi.key)}</span>
                <div style={{ position: 'relative', height: 6, borderRadius: 99, marginTop: 8, background: 'linear-gradient(90deg, var(--hue-blue) 0%, var(--hue-mint) 33%, var(--balsm-expiring,#D97A20) 66%, var(--balsm-danger) 100%)' }}>
                  <div style={{ position: 'absolute', top: '50%', insetInlineStart: `${bmi.pct}%`, width: 12, height: 12, borderRadius: 99, background: '#fff', border: '2.5px solid var(--fg1)', transform: 'translate(-50%, -50%)' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <DSProgressButton block loading={saving} onClick={save} style={{ marginTop: 22 }}>
          {!saving && <Icon name={saved ? 'check' : 'save'} size={18} />}
          {saving ? (lang === 'ar' ? 'جارٍ الحفظ…' : 'Saving…') : (saved ? t('pd_saved') : t('pd_save'))}
        </DSProgressButton>
      </div>
    </div>
  );
}

function EmergencyScreen({ onBack }) {
  const { t, lang, setNavHidden } = useApp();
  useEffect(() => { setNavHidden(true); return () => setNavHidden(false); }, []);
  const contacts = [
    { key: 'em_ambulance', icon: 'ambulance', num: '123', color: 'var(--balsm-danger)',          bg: '#FBEBE7' },
    { key: 'em_police',    icon: 'shield',    num: '122', color: 'var(--hue-blue)',            bg: 'var(--hue-blue-50)' },
    { key: 'em_fire',      icon: 'flame',     num: '180', color: 'var(--balsm-expiring, #D97A20)', bg: '#FBF0E2' },
    { key: 'em_tourist',   icon: 'compass',   num: '126', color: 'var(--hue-violet)',          bg: 'var(--hue-violet-50)' },
  ];
  return (
    <div className="screen fade-in">
      <div className="pad-top" />
      <div className="appbar">
        <button className="round-btn" onClick={onBack} aria-label="Back">
          <Icon name="arrow-left" style={{ transform: lang === 'ar' ? 'scaleX(-1)' : 'none' }} />
        </button>
        <h1 style={{ flex: 1, margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-xl)', letterSpacing: '-0.01em', color: 'var(--fg1)' }}>{t('p_emergency')}</h1>
        <span className="meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icon name="map-pin" size={12} />{t('em_eg')}
        </span>
      </div>
      <div className="screen-scroll" style={{ padding: '0 20px calc(env(safe-area-inset-bottom, 0px) + 40px)' }}>
        <p className="body-sm" style={{ margin: '2px 0 18px' }}>{t('em_intro')}</p>
        <div className="emergency-grid">
          {contacts.map(c => (
            <a key={c.key} href={`tel:${c.num}`} className="card emergency-tile">
              <div className="etile-ico" style={{ background: c.bg, color: c.color }}><Icon name={c.icon} /></div>
              <div className="etile-label">{t(c.key)}</div>
              <div className="etile-foot">
                <span className="etile-num num">{c.num}</span>
                <Icon name="phone" size={13} style={{ color: c.color }} />
              </div>
            </a>
          ))}
        </div>
        <div className="save-note" style={{ marginTop: 18 }}>
          <Icon name="phone-call" size={15} />{t('em_tap_call')}
        </div>
      </div>
    </div>
  );
}

function ProfileScreen() {
  const { t, lang, go, account, country } = useApp();
  const [langSheet, setLangSheet]       = useState(false);
  const [countrySheet, setCountrySheet] = useState(false);
  const curLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[1];
  const [storageSheet, setStorageSheet] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(false);
  const [careOpen, setCareOpen]         = useState(false);
  const [privacyOpen, setPrivacyOpen]   = useState(false);
  const [medicalOpen, setMedicalOpen]   = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  if (personalOpen) return <PersonalDetailsScreen onBack={() => setPersonalOpen(false)} />;
  if (careOpen)     return <CareTeamScreen onBack={() => setCareOpen(false)} />;
  if (privacyOpen)  return <PrivacyDataScreen onBack={() => setPrivacyOpen(false)} />;
  if (medicalOpen)  return <MedicalProfileScreen onBack={() => setMedicalOpen(false)} />;
  if (emergencyOpen) return <EmergencyScreen onBack={() => setEmergencyOpen(false)} />;
  const { storageProviders } = useApp();
  const primaryCfg = STORAGE_CFG[storageProviders.active] || STORAGE_CFG.local;
  const rows = [
    { icon: 'user',           key: 'p_personal', action: () => setPersonalOpen(true) },
    { icon: 'clipboard-list', key: 'p_cond',     action: () => setMedicalOpen(true) },
    { icon: 'calendar',       key: 'appts',      action: () => setTab('appts') },
    { icon: 'stethoscope',    key: 'p_care',     action: () => setCareOpen(true) },
    { icon: 'siren',          key: 'p_emergency',action: () => setEmergencyOpen(true), tone: 'danger' },
    { icon: 'bell',           key: 'p_notif'    },
    { icon: 'shield-check',   key: 'p_privacy',  action: () => setPrivacyOpen(true) },
    { icon: 'life-buoy',      key: 'p_help'     },
  ];
  return (
    <div className="screen-scroll fade-in">
      <div className="pad-top" />
      <div className="appbar"><h1 className="grow">{t('profile')}</h1></div>
      <div className="profile-head">
        <div className="avatar" style={{ background: account.color }}>{account.initials}</div>
        <div className="pname">{account.name[lang]}</div>
        <div className="pmeta">{t('since')} {account.since[lang]}</div>
        <div className="chip-wrap" style={{ justifyContent: 'center', marginTop: 12 }}>
          {account.conditions.map((c, i) => (
            <span key={i} className="pill" style={{ background: 'var(--balsm-ink-100)', color: 'var(--balsm-ink-700)' }}>{c[lang]}</span>
          ))}
        </div>
      </div>

      <div className="card list-card">
        <div className="list-row" onClick={() => setLangSheet(true)}>
          <div className="lico"><Icon name="languages" /></div>
          <div className="grow">{t('p_lang')}</div>
          <span style={{ fontSize: 'var(--pt-sm)', color: 'var(--fg3)', fontWeight: 600, fontFamily: curLang.rtl ? 'var(--font-arabic)' : 'var(--font-body)', marginInlineEnd: 8 }}>{curLang.native}</span>
          <span className="rchev"><Icon name="chevron-right" /></span>
        </div>
        <div className="list-row" onClick={() => setCountrySheet(true)}>
          <div className="lico" style={!country.home ? { background: 'var(--balsm-sun-500)', color: '#fff' } : undefined}><Icon name={country.home ? 'map-pin' : 'plane'} /></div>
          <div className="grow">{t('p_country')}</div>
          <span style={{ fontSize: 'var(--pt-sm)', color: 'var(--fg3)', fontWeight: 600, marginInlineEnd: 8 }}>{country.name[lang]}</span>
          <span className="rchev"><Icon name="chevron-right" /></span>
        </div>
      </div>

      {/* Storage & sync */}
      <div className="card list-card">
        <div className="list-row" onClick={() => setStorageSheet(true)}>
          <div className="lico" style={{ background: primaryCfg.bg, color: primaryCfg.color }}><Icon name={primaryCfg.icon} /></div>
          <div className="grow">{t('storage')}</div>
          <StorageBadge storage={storageProviders.active} size="xs" />
          <span className="rchev"><Icon name="chevron-right" /></span>
        </div>
      </div>

      <div className="card list-card">
        {rows.map(r => (
          <div key={r.key} className="list-row" onClick={r.action}>
            <div className="lico" style={r.tone === 'danger' ? { background: '#FBEBE7', color: 'var(--balsm-danger)' } : undefined}><Icon name={r.icon} /></div>
            <div className="grow">{t(r.key)}</div>
            <span className="rchev"><Icon name="chevron-right" /></span>
          </div>
        ))}
      </div>

      <div className="px-20" style={{ paddingBottom: 24 }}>
        <button className="btn secondary block" style={{ color: 'var(--balsm-danger)' }} onClick={() => go('welcome')}>
          <Icon name="log-out" size={18} />{t('p_signout')}
        </button>
      </div>

      {langSheet    && <LanguageSheet    onClose={() => setLangSheet(false)} />}
      {countrySheet  && <CountrySheet     onClose={() => setCountrySheet(false)} />}
      {storageSheet  && <StorageSyncSheet onClose={() => setStorageSheet(false)} />}
    </div>
  );
}

Object.assign(window, { HomeScreen, TrendsScreen, MedsScreen, ProfileScreen, PersonalDetailsScreen, CareTeamScreen, PrivacyDataScreen, MedicalProfileScreen, EmergencyScreen, LineChart, HistoryRow, AccountSwitcherSheet });

