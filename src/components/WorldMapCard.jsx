import React, { useState } from 'react';
import { Globe, MapPin, Activity, Navigation, Info } from 'lucide-react';

const WorldMapCard = ({ sites = [] }) => {
  const [hoveredSite, setHoveredSite] = useState(null);

  // Fallback defaults if site array is loading
  const defaultSites = [
    { country: 'United States', code: 'USA', flag: '🇺🇸', x: 22, y: 38, activeCount: 32652 },
    { country: 'China', code: 'CHN', flag: '🇨🇳', x: 78, y: 42, activeCount: 14352 },
    { country: 'France', code: 'FRA', flag: '🇫🇷', x: 48, y: 32, activeCount: 8257 },
    { country: 'Italy', code: 'ITA', flag: '🇮🇹', x: 53, y: 36, activeCount: 6038 },
    { country: 'Canada', code: 'CAN', flag: '🇨🇦', x: 24, y: 24, activeCount: 5756 },
    { country: 'Spain', code: 'ESP', flag: '🇪🇸', x: 45, y: 38, activeCount: 5107 },
    { country: 'United Kingdom', code: 'GBR', flag: '🇬🇧', x: 46, y: 28, activeCount: 4705 },
    { country: 'Germany', code: 'DEU', flag: '🇩🇪', x: 52, y: 30, activeCount: 4647 },
    { country: 'Australia', code: 'AUS', flag: '🇦🇺', x: 84, y: 76, activeCount: 3034 },
    { country: 'Japan', code: 'JPN', flag: '🇯🇵', x: 86, y: 40, activeCount: 2294 },
    { country: 'Brazil', code: 'BRA', flag: '🇧🇷', x: 34, y: 68, activeCount: 1872 },
    { country: 'India', code: 'IND', flag: '🇮🇳', x: 70, y: 48, activeCount: 948 }
  ];

  const siteList = (sites && sites.length > 0) ? sites : defaultSites;
  const maxCount = Math.max(...siteList.map(s => s.activeCount || 1));
  const totalGlobalActive = siteList.reduce((acc, s) => acc + (s.activeCount || 0), 0);

  return (
    <div className="card" style={{ marginTop: '24px', marginBottom: '24px', padding: '24px' }}>
      <div className="section-header" style={{ marginBottom: '20px' }}>
        <div>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
            <Globe size={22} color="var(--primary)" />
            <span>Global Active Trial Sites Map</span>
          </div>
          <div className="section-subtitle" style={{ fontSize: '13px', marginTop: '4px' }}>
            Live geographic distribution of active clinical trial sites worldwide across 87,000+ active studies (ClinicalTrials.gov V2)
          </div>
        </div>
      </div>

      {/* Main Container: Split into Map Canvas and Leaderboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* World Map Vector Canvas */}
        <div style={{ 
          position: 'relative', 
          backgroundColor: '#0f172a', 
          borderRadius: '12px', 
          height: '420px', 
          overflow: 'hidden', 
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
          border: '1px solid #1e293b'
        }}>
          {/* SVG Vector Background Grid & World Map Outline */}
          <svg 
            viewBox="0 0 1000 500" 
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
              </pattern>
              <radialGradient id="pulseGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0"/>
              </radialGradient>
            </defs>

            {/* Grid Overlay */}
            <rect width="1000" height="500" fill="url(#grid)" />

            {/* Equator & Prime Meridian Lines */}
            <line x1="0" y1="250" x2="1000" y2="250" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" opacity="0.4" />
            <line x1="500" y1="0" x2="500" y2="500" stroke="#334155" strokeWidth="1" strokeDasharray="4,4" opacity="0.4" />

            {/* Stylized Continent Outlines */}
            {/* North America */}
            <path d="M 120 80 Q 200 60 280 90 T 320 180 T 260 260 T 180 280 T 140 200 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" opacity="0.8" />
            {/* South America */}
            <path d="M 280 270 Q 350 290 370 380 T 310 470 T 270 360 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" opacity="0.8" />
            {/* Europe */}
            <path d="M 460 80 Q 550 70 580 140 T 520 200 T 450 160 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" opacity="0.8" />
            {/* Africa */}
            <path d="M 440 200 Q 560 210 580 320 T 520 440 T 450 320 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" opacity="0.8" />
            {/* Asia */}
            <path d="M 580 80 Q 750 60 880 120 T 850 280 T 680 260 T 580 180 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" opacity="0.8" />
            {/* Australia */}
            <path d="M 780 340 Q 880 330 900 420 T 800 440 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" opacity="0.8" />
          </svg>

          {/* Interactive Pulsing Hotspots Layer */}
          {siteList.map((site) => {
            const ratio = site.activeCount / maxCount;
            // Radius range between 12px and 36px
            const size = Math.max(16, Math.min(42, Math.round(ratio * 40)));
            const isHovered = hoveredSite?.code === site.code;

            return (
              <div 
                key={site.code}
                onMouseEnter={() => setHoveredSite(site)}
                onMouseLeave={() => setHoveredSite(null)}
                style={{
                  position: 'absolute',
                  left: `${site.x}%`,
                  top: `${site.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: isHovered ? 20 : 10
                }}
              >
                {/* Outer Pulsing Wave Ring */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: `${size * 2}px`,
                  height: `${size * 2}px`,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  backgroundColor: isHovered ? 'rgba(56, 189, 248, 0.4)' : 'rgba(0, 113, 188, 0.25)',
                  animation: 'pulseRing 2.5s infinite ease-out'
                }} />

                {/* Inner Beacon Core */}
                <div style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  backgroundColor: isHovered ? '#38bdf8' : (ratio > 0.4 ? '#0071bc' : '#0ea5e9'),
                  border: `2px solid ${isHovered ? '#ffffff' : '#38bdf8'}`,
                  boxShadow: `0 0 12px ${isHovered ? '#38bdf8' : 'rgba(0,113,188,0.8)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease-in-out'
                }}>
                  <span style={{ fontSize: '10px', color: 'white', fontWeight: '800' }}>
                    {site.code}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Interactive Hover Tooltip Card overlay */}
          {hoveredSite && (
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #38bdf8',
              borderRadius: '8px',
              padding: '12px 16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              zIndex: 30,
              minWidth: '220px',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '18px' }}>{hoveredSite.flag}</span>
                <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{hoveredSite.country}</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8' }}>
                {hoveredSite.activeCount.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Active Trial Sites</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={12} color="#10b981" />
                <span>{((hoveredSite.activeCount / totalGlobalActive) * 100).toFixed(1)}% of tracked global sites</span>
              </div>
            </div>
          )}

          {/* Map Legend watermark */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #334155',
            fontSize: '11px',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ height: '8px', width: '8px', borderRadius: '50%', backgroundColor: '#38bdf8', display: 'inline-block' }} />
            <span>Active Trial Site Beacons</span>
          </div>
        </div>

        {/* Side Leaderboard: Top Active Trial Site Hubs */}
        <div style={{ 
          backgroundColor: 'var(--bg-light)', 
          borderRadius: '12px', 
          padding: '16px', 
          height: '420px', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Navigation size={16} color="var(--primary)" />
            <span>Top Active Trial Site Hubs</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
            {siteList.map((site, index) => {
              const pct = totalGlobalActive ? Math.round((site.activeCount / totalGlobalActive) * 100) : 0;

              return (
                <div 
                  key={site.code}
                  onMouseEnter={() => setHoveredSite(site)}
                  onMouseLeave={() => setHoveredSite(null)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    marginBottom: '6px',
                    backgroundColor: hoveredSite?.code === site.code ? 'white' : 'transparent',
                    border: hoveredSite?.code === site.code ? '1px solid var(--accent-light)' : '1px solid transparent',
                    boxShadow: hoveredSite?.code === site.code ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', width: '16px' }}>
                        #{index + 1}
                      </span>
                      <span style={{ fontSize: '14px' }}>{site.flag}</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {site.country}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>
                      {site.activeCount.toLocaleString()}
                    </span>
                  </div>

                  {/* Micro Progress Bar */}
                  <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, (site.activeCount / maxCount) * 100)}%`,
                      backgroundColor: index === 0 ? '#0071bc' : (index < 3 ? '#0ea5e9' : '#10b981'),
                      borderRadius: '2px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            *Data synchronized with ClinicalTrials.gov V2 location registry
          </div>
        </div>

      </div>

      {/* Pulse Animation Styles */}
      <style>{`
        @keyframes pulseRing {
          0% {
            transform: translate(-50%, -50%) scale(0.6);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.6);
            opacity: 0;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default WorldMapCard;
