// Balsm DS — ProSidebar
// The shared left navigation chrome for every Balsm-Pro module
// (Pharmacy POS, Inventory, Clinic, Roles, Workspace, Reports…).
// One sidebar, configured per module via `groups` + `active`.
//
// Sections: brand mark · workspace switcher · grouped nav (scrolls) ·
//           account / profile footer.
// RTL-aware (pass dir="rtl"); icons are Lucide names (kebab or Pascal)
// or any React node. Self-contained: inline Balsm mark fallback,
// token vars with hard-coded fallbacks, no stylesheet dependency.

// Clockwise from the top: teal, blue, mint, violet, emerald — matches brand/icon.svg.
const _MARK_HUES = ['#00C8D2', '#0083FA', '#00D69E', '#8350DE', '#5FD470'];

// Inline Balsm mark — five figures joined in a ring, simplified to a head
// and a body arc each so it survives being drawn at 28px. Always on-brand,
// no asset path needed.
const _RING_R = 10.0;
const _RING_C = 2 * Math.PI * _RING_R;
const _ARC = _RING_C / 5;

function _BalsmMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ display: 'block' }}>
      <g fill="none" strokeWidth="5" strokeLinecap="round">
        {_MARK_HUES.map((c, i) => (
          <circle key={i} cx="20" cy="20" r={_RING_R} stroke={c}
            strokeDasharray={`${_ARC - 2} ${_RING_C - _ARC + 2}`}
            transform={`rotate(${i * 72 - 126} 20 20)`} />
        ))}
      </g>
      {_MARK_HUES.map((c, i) => {
        const a = ((i * 72 - 90) * Math.PI) / 180;
        return (
          <circle key={i} cx={(20 + 15.8 * Math.cos(a)).toFixed(2)}
            cy={(20 + 15.8 * Math.sin(a)).toFixed(2)} r="3.6" fill={c} />
        );
      })}
    </svg>
  );
}

function _toPascal(name) {
  return String(name).replace(/(^|-|_|\s)([a-z])/g, (_, __, c) => c.toUpperCase());
}

// Lucide icon → inline SVG (React-owned, re-render safe). Falls back to a
// neutral dot until lucide loads, then re-renders itself.
function _Icon({ name, size = 18, stroke = 1.75 }) {
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.lucide && window.lucide.icons) return;
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      if ((window.lucide && window.lucide.icons) || n > 40) { clearInterval(t); force(); }
    }, 80);
    return () => clearInterval(t);
  }, []);

  if (React.isValidElement(name)) return name;
  const L = typeof window !== 'undefined' && window.lucide;
  const dot = <span style={{ width: size * 0.5, height: size * 0.5, borderRadius: 999, background: 'currentColor', opacity: 0.45, display: 'block' }} />;
  if (!L || !L.icons || !name) return dot;

  let node = L.icons[_toPascal(name)] || L.icons[name];
  if (!node) return dot;
  let kids = node;
  if (Array.isArray(node) && node[0] === 'svg') kids = node[2] || [];
  const map = { 'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule', 'fill-opacity': 'fillOpacity' };
  const els = (kids || []).map((c, i) => {
    const a = {}; const src = c[1] || {};
    for (const k in src) a[map[k] || k] = src[k];
    a.key = i;
    return React.createElement(c[0], a);
  });
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', style: { display: 'block' },
  }, els);
}

function _SwitchRow({ initials, name, sub, color, onClick, variant }) {
  const isTop = variant === 'workspace';
  return (
    <button type="button" onClick={onClick} className="b-prosb__switch"
      style={{
        all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        padding: isTop ? '8px 9px' : '10px 8px', borderRadius: isTop ? 12 : 10, width: '100%',
        background: isTop ? 'var(--balsm-ink-50, #F5F6F8)' : 'transparent',
        border: isTop ? '1px solid var(--balsm-ink-100, #E5E9ED)' : 'none',
        borderTop: isTop ? undefined : '1px solid var(--balsm-ink-100, #EBEDF0)',
        marginBottom: isTop ? 8 : 0, marginTop: isTop ? 0 : 'auto',
      }}>
      <span style={{
        width: isTop ? 34 : 36, height: isTop ? 34 : 36, flex: 'none',
        borderRadius: isTop ? 9 : 999, background: color || '#0083FA', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
        fontSize: 13, fontFamily: "'Montserrat',sans-serif",
      }}>{initials}</span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0, flex: 1, textAlign: 'start' }}>
        <span style={{ fontSize: isTop ? 13.5 : 13, fontWeight: isTop ? 700 : 600, color: 'var(--balsm-ink-900, #14202B)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
        <span style={{ fontSize: 11, color: 'var(--balsm-ink-600, #526174)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</span>
      </span>
      <span style={{ display: 'flex', width: 15, height: 15, color: isTop ? 'var(--balsm-ink-600, #526174)' : 'var(--balsm-ink-400, #9BA4AD)', flex: 'none' }}>
        <_Icon name="chevrons-up-down" size={15} stroke={1.9} />
      </span>
    </button>
  );
}

export function ProSidebar({
  dir = (typeof document !== 'undefined' && document.dir) || 'ltr',
  brand = 'Balsm',
  brandTld = '.health',
  logoSrc = null,
  workspace = null,        // { initials, name, branch, color, onClick }
  groups = [],             // [{ label, items: [{ id, label, icon, count }] }]
  active = null,
  onNavigate = () => {},
  account = null,          // { initials, name, role, color, onClick }
  width = 240,
  className = '',
  style,
  ...rest
}) {
  return (
    <aside dir={dir} className={['b-prosb', className].filter(Boolean).join(' ')}
      style={{
        flex: `0 0 ${width}px`, width, height: '100%', minHeight: 0,
        background: 'var(--balsm-surface, #FFFFFF)',
        borderInlineEnd: '1px solid var(--balsm-ink-200, #DBDFE3)',
        display: 'flex', flexDirection: 'column', padding: '18px 12px', gap: 2,
        overflow: 'hidden', fontFamily: "var(--font-body, 'IBM Plex Sans','Montserrat',sans-serif)",
        boxSizing: 'border-box', ...style,
      }} {...rest}>

      {/* brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 2px 6px' }}>
        <span style={{ width: 30, height: 30, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {logoSrc
            ? <img src={logoSrc} alt="" style={{ width: 30, height: 30, objectFit: 'contain' }} />
            : <_BalsmMark size={28} />}
        </span>
        <span style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', color: 'var(--balsm-ink-600, #526174)' }}>
          {brand}<span style={{ fontWeight: 500, color: 'var(--balsm-ink-500, #78838F)' }}>{brandTld}</span>
        </span>
      </div>

      {/* workspace switcher */}
      {workspace && (
        <_SwitchRow variant="workspace" initials={workspace.initials} name={workspace.name}
          sub={workspace.branch} color={workspace.color} onClick={workspace.onClick} />
      )}

      {/* nav */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {groups.map((grp, gi) => (
          <React.Fragment key={grp.label || gi}>
            <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--balsm-ink-600, #526174)', fontWeight: 600, padding: '14px 10px 6px' }}>{grp.label}</div>
            {(grp.items || []).map(item => {
              const on = item.id === active;
              return (
                <button type="button" key={item.id} onClick={() => { item.onClick ? item.onClick(item.id) : onNavigate(item.id); }}
                  style={{
                    all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 10, transition: 'background 160ms ease',
                    background: on ? 'var(--petal-blue-50, #E6F0F9)' : 'transparent',
                    color: on ? 'var(--balsm-primary, #0083FA)' : 'var(--balsm-ink-700, #384756)',
                  }}>
                  <span style={{ width: 18, height: 18, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: on ? 'var(--balsm-primary, #0083FA)' : 'var(--balsm-ink-600, #526174)' }}>
                    <_Icon name={item.icon} size={18} />
                  </span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: on ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'start' }}>{item.label}</span>
                  {item.count != null && item.count !== '' && (
                    <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", padding: '1px 7px', borderRadius: 999, whiteSpace: 'nowrap', background: on ? 'var(--balsm-primary, #0083FA)' : 'var(--balsm-ink-100, #EBEDF0)', color: on ? '#fff' : 'var(--balsm-ink-700, #384756)' }}>{item.count}</span>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* account footer */}
      {account && (
        <_SwitchRow variant="account" initials={account.initials} name={account.name}
          sub={account.role} color={account.color} onClick={account.onClick} />
      )}
    </aside>
  );
}
