// Balsm DS — LoadingOverlay
// Full-screen (or container) loading state: the Balsm mark over a
// calm surface, an optional message, and optional progress.
// variant: cream (warm surface) | scrim (translucent ink) | brand (watercolor)
// Self-contained markup — no cross-component imports.

function _OverlayPetals({ size = 'lg' }) {
  const sizeCls = typeof size === 'string' ? `b-petal-spinner--${size}` : '';
  const sizeStyle = typeof size === 'number' ? { width: size, height: size } : undefined;
  return (
    <span className={['b-petal-spinner', sizeCls].filter(Boolean).join(' ')} style={sizeStyle} aria-hidden="true">
      <span className="b-petal-spinner__petal" />
      <span className="b-petal-spinner__petal" />
      <span className="b-petal-spinner__petal" />
      <span className="b-petal-spinner__petal" />
      <span className="b-petal-spinner__petal" />
    </span>
  );
}

function _OverlayRing() {
  return <span className="b-ring-spinner" style={{ width: 40, height: 40, '--ring-w': '4px' }} aria-hidden="true" />;
}

export function LoadingOverlay({
  open = true,
  variant = 'cream',          // 'cream' | 'scrim' | 'brand'
  message,
  submessage,
  progress,                   // 0–100 → shows a progress bar
  indeterminate = false,      // shows an indeterminate bar
  spinner = 'petal',          // 'petal' | 'ring'
  contained = false,          // absolute (positioned parent) vs fixed (viewport)
  backgroundImage,            // for variant="brand" — the watercolor pattern
  className = '',
  style,
  ...rest
}) {
  if (!open) return null;

  const cls = [
    'b-overlay',
    `b-overlay--${variant}`,
    contained && 'b-overlay--contained',
    className,
  ].filter(Boolean).join(' ');

  const st = { ...style };
  if (backgroundImage) st['--overlay-bg'] = `url(${backgroundImage})`;

  const showBar = progress != null || indeterminate;

  return (
    <div className={cls} style={st} role="status" aria-live="polite" {...rest}>
      <div className="b-overlay__inner">
        {spinner === 'ring' ? <_OverlayRing /> : <_OverlayPetals size="lg" />}
        {message && <div className="b-overlay__msg">{message}</div>}
        {submessage && <div className="b-overlay__sub">{submessage}</div>}
        {showBar && (
          <div className="b-overlay__progress">
            <div className={['b-progress', 'b-progress--primary', indeterminate && 'b-progress--indeterminate'].filter(Boolean).join(' ')}>
              {progress != null && !indeterminate && (
                <div className="b-progress__head">
                  <span className="b-progress__value">{Math.round(progress)}%</span>
                </div>
              )}
              <div className="b-progress__track">
                <span className="b-progress__fill" style={indeterminate ? undefined : { width: `${Math.max(0, Math.min(100, progress || 0))}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
