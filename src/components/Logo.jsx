import { useContext } from 'react';
import { ThemeContext } from '../App';

export default function Logo({ className = "w-10 h-10" }) {
  const { theme } = useContext(ThemeContext);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
        style={{ filter: `drop-shadow(0 0 8px ${theme.hex}60)` }} // Tema renginde siber bir parlama
      >
        {/* M Harfi (Keskin ve simetrik) */}
        <path
          d="M 15 80 L 15 30 L 35 55 L 55 30 L 55 80"
          stroke={theme.hex}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* P Harfi (Modern ve aerodinamik) */}
        <path
          d="M 68 80 L 68 30 L 80 30 C 92 30 92 55 80 55 L 68 55"
          stroke={theme.hex}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* P'nin yanına küçük teknolojik bir nokta detayı */}
        <circle cx="85" cy="80" r="4" fill={theme.hex} />
      </svg>
    </div>
  );
}