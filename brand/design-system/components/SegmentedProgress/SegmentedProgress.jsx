// Balsm DS — SegmentedProgress (multi-part meter)
// A single proportional bar split into colored segments + legend.
// For composition breakdowns: storage, queue mix, inventory by status.
// segments: [{ label, value, color?, hex? }]
// color: aqua | blue | mint | violet | emerald | sun | danger | ink

const _METER_VAR = {
  aqua: 'var(--hue-aqua)', blue: 'var(--hue-blue)', mint: 'var(--hue-mint)',
  violet: 'var(--hue-violet)', emerald: 'var(--hue-emerald)',
  sun: 'var(--balsm-warning)', danger: 'var(--balsm-danger)', ink: 'var(--balsm-ink-300)',
};

export function SegmentedProgress({
  segments = [],
  total,                    // cap; defaults to the sum of segment values
  title,
  showTotal = false,
  showLegend = true,
  showValues = true,
  size = 'md',              // sm | md | lg
  gap = false,              // separate pills vs continuous bar
  format = (v) => v,
  totalLabel,
  className = '',
  ...rest
}) {
  const sum = segments.reduce((a, s) => a + (s.value || 0), 0);
  const max = total ?? sum;

  const cls = [
    'b-meter',
    size !== 'md' && `b-meter--${size}`,
    gap && 'b-meter--gap',
    className,
  ].filter(Boolean).join(' ');

  const swatch = (s) => s.hex || _METER_VAR[s.color] || 'var(--balsm-primary)';

  return (
    <div className={cls} {...rest}>
      {(title || showTotal) && (
        <div className="b-meter__head">
          {title && <span className="b-meter__title">{title}</span>}
          {showTotal && <span className="b-meter__total">{totalLabel ?? `${format(sum)} / ${format(max)}`}</span>}
        </div>
      )}
      <div className="b-meter__track" role="img" aria-label={typeof title === 'string' ? title : 'Breakdown'}>
        {segments.map((s, i) => {
          const w = max > 0 ? (s.value / max) * 100 : 0;
          const segCls = ['b-meter__seg', s.color && `b-meter__seg--${s.color}`].filter(Boolean).join(' ');
          return (
            <span
              key={i}
              className={segCls}
              style={{ width: `${w}%`, ...(s.hex ? { background: s.hex } : {}) }}
              title={`${s.label}: ${format(s.value)}`}
            />
          );
        })}
      </div>
      {showLegend && (
        <div className="b-meter__legend">
          {segments.map((s, i) => (
            <span className="b-meter__item" key={i}>
              <span className="b-meter__swatch" style={{ background: swatch(s) }} />
              {s.label}
              {showValues && s.value != null && <span className="b-meter__val">{format(s.value)}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
