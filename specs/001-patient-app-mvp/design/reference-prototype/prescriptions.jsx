/* prescriptions.jsx — Prescriptions list + detail with QR code */

/* Decorative QR code drawn as SVG — visually correct, not scannable */
function QRCode({ size = 152 }) {
  const cell = size / 21;
  const p = [
    [1,1,1,1,1,1,1,0,1,0,1,0,0,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,0,1,1,0,0,1,1,1,0,1,0,1,0,0,1,0],
    [0,1,0,0,1,0,0,0,1,0,1,0,0,1,0,1,0,1,1,0,1],
    [1,1,0,1,0,1,1,0,0,1,0,1,1,0,1,0,1,0,1,0,0],
    [0,0,1,0,1,0,0,1,1,0,1,0,0,1,0,1,0,1,0,1,0],
    [1,0,0,1,0,1,1,0,1,0,0,1,1,0,1,1,0,0,1,0,1],
    [0,0,0,0,0,0,0,0,0,1,1,0,0,1,0,1,0,1,0,1,0],
    [1,1,1,1,1,1,1,0,1,0,0,1,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,0,1,0,1,0,1,0,0,0],
    [1,0,1,1,1,0,1,0,1,0,1,1,1,0,1,0,0,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,0,0,1,0,1,1,0,0,1,0],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,0,1,0,0,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,0,0,1,1,0,1,0,0],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,0,0,1,0,1,1],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <rect width={size} height={size} fill="#fff" rx="4" />
      {p.map((row, ri) =>
        row.map((v, ci) =>
          v ? (
            <rect key={`${ri}-${ci}`}
              x={ci * cell + 0.5} y={ri * cell + 0.5}
              width={cell - 0.5} height={cell - 0.5}
              fill="#1A1A17"
            />
          ) : null
        )
      )}
    </svg>
  );
}

function PrescriptionDetail({ rx, onBack }) {
  const { t, lang } = useApp();
  const doctor   = DOCTORS.find(d => d.id === rx.doctorId);
  const isActive = rx.status === 'active';

  return (
    <div className="screen fade-in">
      <div className="pad-top" />
      <div className="appbar">
        <button className="round-btn" onClick={onBack} aria-label="Back"><Icon name="arrow-left" /></button>
        <div style={{ flex: 1 }} />
        <span className={cx('pill', isActive ? 'success' : 'neutral')}>
          <span className="dot" />{t(isActive ? 'rx_active' : 'rx_expired')}
        </span>
      </div>

      <div className="screen-scroll">
        {/* Doctor header */}
        <div style={{ padding: '4px 20px 18px' }}>
          {doctor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <DoctorAvatar doctor={doctor} size={50} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--pt-md)', color: 'var(--fg1)' }}>{doctor.name[lang]}</div>
                <div style={{ fontSize: 'var(--pt-sm)', color: 'var(--fg3)', marginTop: 2 }}>{doctor.specialty[lang]}</div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 'var(--pt-2xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg4)', marginBottom: 3 }}>Issued</div>
              <div style={{ fontSize: 'var(--pt-sm)', fontWeight: 600, color: 'var(--fg1)' }}>{rx.date[lang]}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--pt-2xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--fg4)', marginBottom: 3 }}>{t('rx_valid_until')}</div>
              <div style={{ fontSize: 'var(--pt-sm)', fontWeight: 600, color: isActive ? 'var(--fg1)' : 'var(--balsm-danger)' }}>{rx.validUntil[lang]}</div>
            </div>
          </div>
        </div>

        {/* QR code block */}
        {isActive && (
          <div style={{
            margin: '0 20px 20px', padding: '24px 20px',
            background: 'var(--balsm-cream-100)', borderRadius: 'var(--radius-xl)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
          }}>
            <div style={{ fontSize: 'var(--pt-2xs)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg3)' }}>
              {t('rx_scan')}
            </div>
            <div style={{ padding: 14, background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
              <QRCode size={148} />
            </div>
            <div className="num" style={{ fontSize: 'var(--pt-sm)', color: 'var(--fg3)', letterSpacing: '0.06em' }}>{rx.ref}</div>
          </div>
        )}

        {/* Medications list */}
        <div className="row-head" style={{ marginTop: isActive ? 4 : 0 }}><h2>Medications</h2></div>
        <div className="card" style={{ margin: '0 20px' }}>
          {rx.meds.map((m, i) => (
            <div key={i} className="med-row">
              <div className="med-ico" style={{ background: 'var(--hue-blue-50)', color: 'var(--hue-blue)' }}>
                <Icon name="pill" size={20} />
              </div>
              <div className="grow">
                <div className="mname">{m.name[lang]}</div>
                <div className="mdose">{m.dose[lang]}</div>
              </div>
            </div>
          ))}
        </div>

        {isActive && (
          <div style={{ padding: '20px 20px 0' }}>
            <button className="btn primary block lg">
              <Icon name="qr-code" size={20} />{t('rx_show')}
            </button>
          </div>
        )}

        <div style={{ height: 28 }} />
      </div>
    </div>
  );
}

function PrescriptionsScreen({ onBack }) {
  const { t, lang } = useApp();
  const [selected, setSelected] = useState(null);

  if (selected) {
    return <PrescriptionDetail rx={selected} onBack={() => setSelected(null)} />;
  }

  const active  = PRESCRIPTIONS.filter(r => r.status === 'active');
  const expired = PRESCRIPTIONS.filter(r => r.status === 'expired');

  const RxCard = ({ rx, dim }) => {
    const doc = DOCTORS.find(d => d.id === rx.doctorId);
    const isActive = rx.status === 'active';
    return (
      <div className="card" onClick={() => setSelected(rx)} style={{
        padding: 16, cursor: 'pointer', opacity: dim ? 0.7 : 1,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        {doc && <DoctorAvatar doctor={doc} size={44} />}
        <div className="grow">
          <div style={{ fontWeight: 600, fontSize: 'var(--pt-md)', color: 'var(--fg1)' }}>{doc?.name[lang]}</div>
          <div style={{ fontSize: 'var(--pt-sm)', color: 'var(--fg3)', marginTop: 2 }}>
            {rx.meds.length} {rx.meds.length === 1 ? 'medication' : 'medications'} · {rx.date[lang]}
          </div>
        </div>
        <span className={cx('pill', isActive ? 'success' : 'neutral')} style={{ flexShrink: 0 }}>
          <span className="dot" />{t(isActive ? 'rx_active' : 'rx_expired')}
        </span>
        <Icon name="chevron-right" size={17} style={{ color: 'var(--fg4)', flexShrink: 0 }} />
      </div>
    );
  };

  return (
    <div className="screen fade-in">
      <div className="pad-top" />
      <div className="appbar">
        <button className="round-btn" onClick={onBack} aria-label="Back"><Icon name="arrow-left" /></button>
        <h1 style={{ flex: 1, margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--pt-xl)', letterSpacing: '-0.01em', color: 'var(--fg1)' }}>
          {t('prescriptions')}
        </h1>
      </div>

      <div className="screen-scroll">
        {active.length > 0 && <>
          <div className="row-head"><h2>{t('rx_active')}</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px' }}>
            {active.map(rx => <RxCard key={rx.id} rx={rx} dim={false} />)}
          </div>
        </>}

        {expired.length > 0 && <>
          <div className="row-head"><h2>{t('rx_expired')}</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px' }}>
            {expired.map(rx => <RxCard key={rx.id} rx={rx} dim={true} />)}
          </div>
        </>}

        <div style={{ height: 28 }} />
      </div>
    </div>
  );
}

Object.assign(window, { PrescriptionsScreen, PrescriptionDetail, QRCode });
