type Props = {
  from: string;
  to: string;
  className?: string;
  children?: React.ReactNode;
};

export default function LinearGradient({ from, to, className, children }: Props) {
  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {children}
    </div>
  );
}
