// Balsm DS — AnimatedLogo (the Balsm mark, animated)
// Redrawn 2026-08 to the "five ribbons joined in a ring" mark: five
// gradient-filled ring wedges (clipped as a group for rounded cusps) plus
// a small gradient dot at each ribbon's tip. Each ribbon is one ring path
// + its dot, sharing --i so they move together. Reveal is picked with
// `variant`; motion lives in components.css (.b-logomark*) — unchanged
// from the previous mark, since the DOM shape (5 animated units) is the
// same, just each unit now has two children instead of one.
//
// variant: 'bloom' | 'cascade' | 'pop' | 'wave' | 'unwind'   (ribbon-staggered)
//        | 'fade' | 'spin-in' | 'iris'                        (whole-mark)
//        | 'liquid' | 'heartbeat' | 'orbit' | 'fold'           (creative)
//        | 'develop' | 'magnetic' | 'draw'                     (creative)

// ── generated from brand/icon.svg — do not edit by hand ──
// Re-run: python3 scripts/brand/build-brand-assets.py components
const B_LOGO_RING_CLIP = 'M577.618 188.012C557.997 158.993 527.883 136.680 493.532 128.783C479.521 125.562 464.884 124.891 450.776 127.980C434.357 131.575 421.266 140.456 406.004 146.658C395.450 150.947 384.177 153.332 372.750 152.747C359.914 152.090 347.874 147.808 336.387 142.279C327.657 138.077 319.135 133.397 309.972 130.166C291.124 123.520 270.874 124.083 251.822 129.569C218.160 139.262 187.634 161.007 169.508 191.236C162.115 203.566 156.954 217.280 155.532 231.652C153.877 248.378 158.278 263.573 159.461 280.004C160.278 291.367 159.063 302.825 154.976 313.512C150.384 325.517 142.591 335.645 133.783 344.861C127.089 351.865 120.005 358.524 114.100 366.240C101.955 382.112 96.233 401.544 95.563 421.359C94.380 456.369 105.627 492.121 128.776 518.701C138.218 529.542 149.665 538.688 162.894 544.482C178.291 551.224 194.102 551.734 210.094 555.687C221.154 558.421 231.676 563.117 240.576 570.307C250.575 578.384 257.798 588.925 263.842 600.150C268.435 608.680 272.578 617.476 278.092 625.476C289.434 641.931 306.148 653.378 324.786 660.138C357.716 672.082 395.194 672.433 427.626 658.631C440.854 653.002 453.090 644.941 462.688 634.149C473.859 621.590 479.229 606.711 487.931 592.722C493.948 583.049 501.667 574.493 511.255 568.250C522.026 561.237 534.283 557.624 546.826 555.345C556.359 553.613 566.004 552.390 575.316 549.618C594.471 543.917 610.523 531.558 622.712 515.922C644.247 488.294 656.162 452.759 653.058 417.649C651.791 403.328 647.906 389.200 640.609 376.737C632.116 362.233 619.625 352.527 609.010 339.928C601.669 331.216 595.918 321.232 592.943 310.184C589.601 297.773 589.953 284.999 591.662 272.366C592.960 262.764 594.778 253.213 595.019 243.500C595.516 223.521 588.723 204.436 577.618 188.012ZM240.141 220.338C252.798 209.967 271.894 209.174 287.050 213.373C300.471 217.091 312.460 224.481 324.756 230.808C337.680 237.458 351.179 243.121 365.484 246.059C394.382 251.995 424.073 245.073 449.488 230.795C463.111 223.142 474.772 213.522 487.682 204.952C501.456 213.784 508.111 231.701 508.801 247.412C509.413 261.326 506.089 275.011 503.871 288.661C501.541 303.007 500.326 317.595 501.953 332.108C505.237 361.426 520.995 387.525 542.428 407.284C553.916 417.875 566.669 425.992 578.809 435.622C574.665 451.452 559.682 463.318 544.953 468.829C531.910 473.710 517.867 474.778 504.200 476.887C489.835 479.104 475.586 482.457 462.286 488.488C435.418 500.672 415.466 523.724 403.297 550.213C396.774 564.412 392.995 579.049 387.588 593.571C371.253 594.521 355.338 583.938 345.544 571.633C336.872 560.736 331.516 547.711 325.288 535.365C318.741 522.388 311.148 509.872 301.302 499.087C281.412 477.299 253.323 465.447 224.370 462.060C208.850 460.244 193.762 461.173 178.280 460.518C172.328 445.275 177.475 426.869 186.152 413.752C193.835 402.137 204.568 393.018 214.385 383.279C224.703 373.043 234.261 361.955 241.475 349.258C256.051 323.608 258.643 293.231 252.917 264.648C249.848 249.327 244.302 235.264 240.141 220.338Z';

// DOM order clockwise from the top — top, right, lower-right, lower-left, left.
// Each d is #ribbon from icon.svg turned by rotate(72k); every dot is the
// one #head circle turned the same way, so all five are identical.
const B_LOGO_RIBBONS = [
  { name: 'top', grad: 'aqua', dot: [374.50, 70.08, 58.65], d: 'M251.822 129.569C225.217 146.988 232.086 191.440 240.141 220.338C252.798 209.967 271.894 209.174 287.050 213.373C300.471 217.091 312.460 224.481 324.756 230.808C337.680 237.458 351.179 243.121 365.484 246.059C394.382 251.995 424.073 245.073 449.488 230.795C463.111 223.142 474.772 213.522 487.682 204.952C512.676 188.361 552.830 168.092 577.618 188.012C557.997 158.993 527.883 136.680 493.532 128.783C479.521 125.562 464.884 124.891 450.776 127.980C434.357 131.575 421.266 140.456 406.004 146.658C395.450 150.947 384.177 153.332 372.750 152.747C359.914 152.090 347.874 147.808 336.387 142.279C327.657 138.077 319.135 133.397 309.972 130.166C291.124 123.520 270.874 124.083 251.822 129.569Z' },
  { name: 'right', grad: 'blue', dot: [672.10, 286.30, 58.65], d: 'M577.618 188.012C552.830 168.092 512.676 188.361 487.682 204.952C501.456 213.784 508.111 231.701 508.801 247.412C509.413 261.326 506.089 275.011 503.871 288.661C501.541 303.007 500.326 317.595 501.953 332.108C505.237 361.426 520.995 387.525 542.428 407.284C553.916 417.875 566.669 425.992 578.809 435.622C602.311 454.266 633.997 486.191 622.712 515.922C644.247 488.294 656.162 452.759 653.058 417.649C651.791 403.328 647.906 389.200 640.609 376.737C632.116 362.233 619.625 352.527 609.010 339.928C601.669 331.216 595.918 321.232 592.943 310.184C589.601 297.773 589.953 284.999 591.662 272.366C592.960 262.764 594.778 253.213 595.019 243.500C595.516 223.521 588.723 204.436 577.618 188.012Z' },
  { name: 'lower-right', grad: 'emerald', dot: [558.43, 636.16, 58.65], d: 'M622.712 515.922C633.997 486.191 602.311 454.266 578.809 435.622C574.665 451.452 559.682 463.318 544.953 468.829C531.910 473.710 517.867 474.778 504.200 476.887C489.835 479.104 475.586 482.457 462.286 488.488C435.418 500.672 415.466 523.724 403.297 550.213C396.774 564.412 392.995 579.049 387.588 593.571C377.119 621.684 356.548 661.684 324.786 660.138C357.716 672.082 395.194 672.433 427.626 658.631C440.854 653.002 453.090 644.941 462.688 634.149C473.859 621.590 479.229 606.711 487.931 592.722C493.948 583.049 501.667 574.493 511.255 568.250C522.026 561.237 534.283 557.624 546.826 555.345C556.359 553.613 566.004 552.390 575.316 549.618C594.471 543.917 610.523 531.558 622.712 515.922Z' },
  { name: 'lower-left', grad: 'violet', dot: [190.57, 636.16, 58.65], d: 'M324.786 660.138C356.548 661.684 377.119 621.684 387.588 593.571C371.253 594.521 355.338 583.938 345.544 571.633C336.872 560.736 331.516 547.711 325.288 535.365C318.741 522.388 311.148 509.872 301.302 499.087C281.412 477.299 253.323 465.447 224.370 462.060C208.850 460.244 193.762 461.173 178.280 460.518C148.307 459.248 103.908 452.045 95.563 421.359C94.380 456.369 105.627 492.121 128.776 518.701C138.218 529.542 149.665 538.688 162.894 544.482C178.291 551.224 194.102 551.734 210.094 555.687C221.154 558.421 231.676 563.117 240.576 570.307C250.575 578.384 257.798 588.925 263.842 600.150C268.435 608.680 272.578 617.476 278.092 625.476C289.434 641.931 306.148 653.378 324.786 660.138Z' },
  { name: 'left', grad: 'mint', dot: [76.90, 286.30, 58.65], d: 'M95.563 421.359C103.908 452.045 148.307 459.248 178.280 460.518C172.328 445.275 177.475 426.869 186.152 413.752C193.835 402.137 204.568 393.018 214.385 383.279C224.703 373.043 234.261 361.955 241.475 349.258C256.051 323.608 258.643 293.231 252.917 264.648C249.848 249.327 244.302 235.264 240.141 220.338C232.086 191.440 225.217 146.988 251.822 129.569C218.160 139.262 187.634 161.007 169.508 191.236C162.115 203.566 156.954 217.280 155.532 231.652C153.877 248.378 158.278 263.573 159.461 280.004C160.278 291.367 159.063 302.825 154.976 313.512C150.384 325.517 142.591 335.645 133.783 344.861C127.089 351.865 120.005 358.524 114.100 366.240C101.955 382.112 96.233 401.544 95.563 421.359Z' },
];

// Ribbon fill: the hue's base stop, then mixed 30% and 78% toward white.
const B_LOGO_GRAD_STOPS = {
  aqua:    ['#02BBB5', '#4ECFCB', '#C7F0EF'],
  blue:    ['#1283FF', '#59A8FF', '#CBE4FF'],
  emerald: ['#01C4A2', '#4DD6BE', '#C7F2EB'],
  violet:  ['#724DD0', '#9C82DE', '#E0D8F5'],
  mint:    ['#55D77F', '#88E3A5', '#DAF6E3'],
};
// Dot fill: the head gradient's two ends, straight from icon.svg.
const B_LOGO_DOT_STOPS = {
  aqua:    ['#00CFC9', '#19B0AB'],
  blue:    ['#3D98FF', '#0076F6'],
  emerald: ['#00D9B3', '#19B899'],
  violet:  ['#8463D6', '#673FCC'],
  mint:    ['#75E598', '#3CCC6C'],
};
const B_LOGO_GLOW = ['#02BBB5', '#1283FF'];

// Hub = the mark's rotation centre. viewBox = its ink box padded 32
// units a side, so a ribbon flying in from off-mark is not clipped.
const B_LOGO_HUB = [374.5, 383];
const B_LOGO_VIEWBOX = '-13.76 -20.58 776.52 747.39';

// Each ribbon's outward unit-vector × 220, DOM order — used by the
// 'magnetic' reveal so every ribbon flies in from its own side.
const B_LOGO_DIRS = [
  [0, -220],   // top
  [209, -68],   // right
  [129, 178],   // lower-right
  [-129, 178],   // lower-left
  [-209, -68],   // left
];
// ── end generated ──

export function AnimatedLogo({
  size = 96,
  variant = 'bloom',         // reveal style — see list at top of file
  autoplay = true,
  idle = 'breathe',          // 'breathe' | 'rotate' | 'none'
  speed = 1,
  color,                     // set to render a single-color (mono) mark
  glow = false,              // soft halo that blooms with the mark
  replay,                    // change this value to replay the bloom
  title = 'Balsm',
  className = '',
  style,
  ...rest
}) {
  const svgRef = React.useRef(null);
  const gidRef = React.useRef('lg-' + Math.random().toString(36).slice(2, 8));
  const gid = gidRef.current;

  // Play the bloom by adding --playing with a forced-reflow restart, so it
  // always begins at frame zero. Crucially, only play while the document is
  // actually visible: in a hidden/off-screen iframe (e.g. a card thumbnail)
  // the animation clock never advances, so the bloom's opacity:0 first frame
  // would freeze the mark invisible. Gating on visibility means the static
  // fallback is the FINISHED mark; it blooms the moment it's really seen.
  // useLayoutEffect so --playing lands before first paint (no full-mark flash).
  React.useLayoutEffect(() => {
    if (!autoplay) return;
    const el = svgRef.current;
    if (!el) return;
    const play = () => {
      el.classList.remove('b-logomark--playing');
      void el.getBoundingClientRect();
      el.classList.add('b-logomark--playing');
    };
    if (document.visibilityState === 'visible') { play(); return; }
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        play();
        document.removeEventListener('visibilitychange', onVis);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [replay, autoplay]);

  // Note: --playing is NOT set here — it's added by the effect above only when
  // visible, so the no-JS / hidden fallback renders the finished mark.
  const cls = [
    'b-logomark',
    'b-logomark--v-' + variant,
    idle === 'breathe' && 'b-logomark--breathe',
    idle === 'rotate' && 'b-logomark--spin',
    className,
  ].filter(Boolean).join(' ');

  const px = typeof size === 'number' ? size + 'px' : size;
  const vars = {
    width: px,
    height: px,
    '--logo-speed': 1 / speed,   // one multiplier drives every reveal + idle
    ...style,
  };

  const [hx, hy] = B_LOGO_HUB;

  return (
    <svg
      ref={svgRef}
      className={cls}
      style={vars}
      viewBox={B_LOGO_VIEWBOX}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <clipPath id={gid + '-ring'} clipPathUnits="userSpaceOnUse">
          <path d={B_LOGO_RING_CLIP} />
        </clipPath>
        {/* iris reveal clip — the circle grows from the hub; r=470 at rest = full */}
        <clipPath id={gid + '-iris'} clipPathUnits="userSpaceOnUse">
          <circle className="b-logomark__iris" cx={hx} cy={hy} r="470" />
        </clipPath>
        {!color && B_LOGO_RIBBONS.map((p) => (
          <radialGradient key={'rg-' + p.name} id={gid + '-f-' + p.grad} gradientUnits="userSpaceOnUse" cx={p.dot[0]} cy={p.dot[1]} r="430">
            <stop offset="0.12" stopColor={B_LOGO_GRAD_STOPS[p.grad][0]} />
            <stop offset="0.55" stopColor={B_LOGO_GRAD_STOPS[p.grad][1]} />
            <stop offset="1" stopColor={B_LOGO_GRAD_STOPS[p.grad][2]} />
          </radialGradient>
        ))}
        {!color && B_LOGO_RIBBONS.map((p) => (
          <linearGradient key={'dg-' + p.name} id={gid + '-d-' + p.grad} gradientUnits="userSpaceOnUse" x1={p.dot[0] - 23} y1={p.dot[1] - 58} x2={p.dot[0] + 23} y2={p.dot[1] + 58}>
            <stop offset="0" stopColor={B_LOGO_DOT_STOPS[p.grad][0]} />
            <stop offset="1" stopColor={B_LOGO_DOT_STOPS[p.grad][1]} />
          </linearGradient>
        ))}
        {glow && (
          <radialGradient id={gid} cx={hx} cy={hy} r="380" gradientUnits="userSpaceOnUse">
            <stop offset="0"    stopColor={color || B_LOGO_GLOW[0]} stopOpacity="0.30" />
            <stop offset="0.55" stopColor={color || B_LOGO_GLOW[1]} stopOpacity="0.10" />
            <stop offset="1"    stopColor={color || B_LOGO_GLOW[1]} stopOpacity="0" />
          </radialGradient>
        )}
      </defs>
      <g className="b-logomark__spin">
        <g className="b-logomark__breath">
          <g className="b-logomark__reveal" clipPath={variant === 'iris' ? `url(#${gid}-iris)` : undefined}>
            {glow && <circle className="b-logomark__glow" cx={hx} cy={hy} r="380" fill={`url(#${gid})`} />}
            <g clipPath={`url(#${gid}-ring)`}>
              {B_LOGO_RIBBONS.map((p, i) => (
                <path
                  key={'r-' + i}
                  className="b-logomark__ribbon"
                  style={{ '--i': i, '--fx': B_LOGO_DIRS[i][0] + 'px', '--fy': B_LOGO_DIRS[i][1] + 'px' }}
                  d={p.d}
                  fill={color || `url(#${gid}-f-${p.grad})`}
                  stroke={color || `url(#${gid}-f-${p.grad})`}
                  strokeWidth="0"
                  pathLength="100"
                />
              ))}
            </g>
            {B_LOGO_RIBBONS.map((p, i) => (
              <circle
                key={'d-' + i}
                className="b-logomark__ribbon"
                style={{ '--i': i, '--fx': B_LOGO_DIRS[i][0] + 'px', '--fy': B_LOGO_DIRS[i][1] + 'px' }}
                cx={p.dot[0]}
                cy={p.dot[1]}
                r={p.dot[2]}
                fill={color || `url(#${gid}-d-${p.grad})`}
                pathLength="100"
              />
            ))}
          </g>
        </g>
      </g>
    </svg>
  );
}
