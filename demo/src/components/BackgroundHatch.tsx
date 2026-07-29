export const BackgroundHatch = ({ style, ...args }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...args}
    style={{
      backgroundImage:
        'repeating-linear-gradient(315deg, var(--hatch) 0, var(--hatch) 1px, transparent 0, transparent 50%)',
      backgroundSize: '10px 10px',
      backgroundAttachment: 'fixed',
      ...(style ?? {}),
    }}
  />
);
