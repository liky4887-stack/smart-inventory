import BarcodeScanner from '../components/BarcodeScanner';
import { t } from '../i18n';
import type { Item } from '../types';

type Props = {
  onScan: (item: Item) => void;
  onNew: (barcode: string) => void;
};

export default function ScannerScreen({ onScan, onNew }: Props) {
  return (
    <div className="scanner-screen">
      <header className="screen-header scanner-header">
        <h1 className="screen-title">{t.scanner}</h1>
      </header>
      <BarcodeScanner onScan={onScan} onNew={onNew} />
    </div>
  );
}
