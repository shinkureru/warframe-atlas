import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

// 用全寬按鈕開啟自訂選單，點擊空白處、按 Escape 或選項後關閉。
export default function CustomSelect({ value, onChange, options, label, icon: Icon }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, [open]);
  const selected = options.find((item) => item.value === value) || options[0];
  return <div className="custom-select" ref={root}>
    <button type="button" className="custom-select-trigger" aria-label={label} aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((previous) => !previous)}>
      {Icon && <Icon size={17} />}<span>{selected?.label}</span><ChevronDown size={16} className={open ? 'rotated' : ''} />
    </button>
    {open && <div className="custom-select-menu" role="listbox" aria-label={label}>
      {options.map((option) => <button role="option" aria-selected={option.value === value} className={option.value === value ? 'selected' : ''} type="button" key={option.value} onClick={() => { onChange(option.value); setOpen(false); }}>{option.label}</button>)}
    </div>}
  </div>;
}
