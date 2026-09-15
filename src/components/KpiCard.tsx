import { type ReactNode } from 'react';
import { colors } from '../theme';

type Props = {
  label: string;
  value: string;
  accent?: string;
  sub?: string;
  icon?: ReactNode;
  delay?: number;
};

export default function KpiCard({
  label,
  value,
  accent = colors.primary,
  sub,
  icon,
  delay = 0,
}: Props) {
  return (
    <div
      className="kpi-card"
      style={{
        '--accent': accent,
        animationDelay: `${delay}ms`,
      } as React.CSSProperties}
    >
      <div className="kpi-card-inner">
        {icon && (
          <div className="kpi-icon" style={{ '--icon-color': accent } as React.CSSProperties}>
            {icon}
          </div>
        )}
        <div className="kpi-body">
          <span className="kpi-label">{label}</span>
          <span className="kpi-value" style={{ color: accent }}>
            {value}
          </span>
          {sub && <span className="kpi-sub">{sub}</span>}
        </div>
      </div>
    </div>
  );
}
