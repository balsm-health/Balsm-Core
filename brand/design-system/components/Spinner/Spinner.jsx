// Balsm DS — Spinner
// Spinner      — conic ring, the inline loading workhorse.
// PetalSpinner — the five figures of the Balsm mark, slow 3.6s rotate, for
//                full-screen + brand loading moments. Five colors,
//                never one hue. (Mirrors brand/logo-vertical.svg.)
//
// variant: primary | accent | success | violet | ink

export function Spinner({
  size = 28,
  thickness,
  variant = 'primary',
  label,
  className = '',
  style,
  ...rest
}) {
  const w = thickness ?? Math.max(2, Math.round(size / 9));
  const cls = [
    'b-ring-spinner',
    variant !== 'primary' && `b-ring-spinner--${variant}`,
    className,
  ].filter(Boolean).join(' ');

  const ring = (
    <span
      className={cls}
      style={{ width: size, height: size, '--ring-w': `${w}px`, ...style }}
      role="status"
      aria-label={label || 'Loading'}
      {...rest}
    />
  );

  if (!label) return ring;
  return (
    <span className="b-spin-wrap">
      {ring}
      <span className="b-spin-wrap__label">{label}</span>
    </span>
  );
}

export function PetalSpinner({
  size = 'md',          // 'sm' | 'md' | 'lg' | number(px)
  label,
  className = '',
  style,
  ...rest
}) {
  const sizeCls = typeof size === 'string' ? `b-petal-spinner--${size}` : '';
  const sizeStyle = typeof size === 'number' ? { width: size, height: size } : undefined;

  const node = (
    <span
      className={['b-petal-spinner', sizeCls, className].filter(Boolean).join(' ')}
      style={{ ...sizeStyle, ...style }}
      role="status"
      aria-label={label || 'Loading'}
      {...rest}
    >
      <span className="b-petal-spinner__petal" />
      <span className="b-petal-spinner__petal" />
      <span className="b-petal-spinner__petal" />
      <span className="b-petal-spinner__petal" />
      <span className="b-petal-spinner__petal" />
    </span>
  );

  if (!label) return node;
  return (
    <span className="b-spin-wrap">
      {node}
      <span className="b-spin-wrap__label">{label}</span>
    </span>
  );
}
