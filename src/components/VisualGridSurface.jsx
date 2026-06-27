export default function VisualGridSurface({
  children = null,
  className = '',
  surfaceClassName = '',
  hidden = true,
}) {
  const sectionClassName = ['content-section', 'visual-grid-section', className]
    .filter(Boolean)
    .join(' ');
  const innerClassName = ['visual-grid-surface', surfaceClassName]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={sectionClassName} aria-hidden={hidden}>
      <div className={innerClassName}>{children}</div>
    </section>
  );
}
