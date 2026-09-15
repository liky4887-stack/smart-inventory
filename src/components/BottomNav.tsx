import { LayoutGrid, Package, ScanLine, Receipt, Trophy } from 'lucide-react';
import type { Screen } from '../types';
import { hapticSelection } from '../lib/haptics';

type Props = {
  current: Screen;
  onNavigate: (s: Screen) => void;
};

const items: Array<{ screen: Screen; label: string; icon: typeof LayoutGrid }> = [
  { screen: 'dashboard', label: 'الرئيسية', icon: LayoutGrid },
  { screen: 'inventory', label: 'المخزون', icon: Package },
  { screen: 'scanner', label: 'الماسح', icon: ScanLine },
  { screen: 'sales', label: 'المبيعات', icon: Receipt },
  { screen: 'highlights', label: 'الإنجاز', icon: Trophy },
];

export default function BottomNav({ current, onNavigate }: Props) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {items.map(({ screen, label, icon: Icon }) => {
          const active = current === screen;
          return (
            <button
              key={screen}
              className={`nav-item ${active ? 'nav-item-active' : ''}`}
              onClick={() => {
                if (!active) {
                  hapticSelection();
                  onNavigate(screen);
                }
              }}
              aria-label={label}
            >
              <div className="nav-icon-wrap">
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {active && <div className="nav-indicator" />}
              </div>
              <span className="nav-label">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
