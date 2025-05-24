import '~/styles/components/theme-switch.css';
import { useStore } from '@nanostores/react';
import { memo, useEffect, useState } from 'react';
import { themeStore, THEME_OPTIONS, setTheme } from '~/lib/stores/theme';

interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch = memo(({ className }: ThemeSwitchProps) => {
  const theme = useStore(themeStore);
  const [domLoaded, setDomLoaded] = useState(false);

  useEffect(() => {
    setDomLoaded(true);
  }, []);

  return (
    domLoaded && (
      <div className={`theme-switch-select ${className ?? ''}`}>
        <select value={theme} onChange={(e) => setTheme(e.target.value as any)} title="Select Theme">
          {THEME_OPTIONS.map((opt: string) => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1).replace('-', ' ')}
            </option>
          ))}
        </select>
      </div>
    )
  );
});
