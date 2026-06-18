import React, { useState, useEffect, useRef } from 'react';

const VantaDots = () => {
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const myRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!vantaEffect && (window as any).VANTA) {
      const effect = (window as any).VANTA.DOTS({
        el: myRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0x2563eb,
        color2: 0x10b981,
        backgroundColor: 0xf8fafc,
        size: 4.00,
        spacing: 30.00,
        showLines: true
      });
      setVantaEffect(effect);
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    }
  }, [vantaEffect]);
  
  return (
    <div className="absolute inset-0 z-0 pointer-events-none opacity-80 overflow-hidden">
      <div ref={myRef} className="absolute top-0 right-0 w-full lg:w-[120%] h-full transform lg:translate-x-[20%]"></div>
    </div>
  );
};

export default VantaDots;
