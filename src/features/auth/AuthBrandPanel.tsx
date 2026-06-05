import iyteLogo from '../../assets/iyte-logo.png';
import heroBg from '../../assets/hero.png';

export const AUTH_PRIMARY = '#8b1a1a';

/**
 * Left branding panel for all auth screens.
 * Shows campus aerial photo with IYTE logo and title overlay.
 * Hidden on mobile (< md), visible on md+.
 */
export default function AuthBrandPanel() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center relative w-2/5 min-h-screen overflow-hidden shrink-0">
      {/* Campus photo */}
      <img
        src={heroBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Color overlay */}
      <div className="absolute inset-0 bg-[#8b1a1a] opacity-75" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-10">
        <div className="mb-8 p-3 rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
          <img src={iyteLogo} alt="IYTE Logo" className="w-24 h-24 object-contain rounded-full" />
        </div>
        <h1 className="text-white text-3xl font-bold leading-tight mb-3 m-0">
          Izmir Institute of Technology
        </h1>
        <p className="text-white/85 text-base font-medium tracking-wide m-0">
          Undergraduate Transfer Management System
        </p>
        <p className="text-white/60 text-sm mt-2 font-bold tracking-widest m-0">
          UTMS
        </p>
      </div>
    </div>
  );
}
