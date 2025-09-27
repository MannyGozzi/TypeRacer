"use client";

import { useState, useEffect } from "react";
import TypeRacer from "@/components/TypeRacer";
import MultiplayerTypeRacer from "@/components/MultiplayerTypeRacer";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [mode, setMode] = useState<'single' | 'multiplayer'>('single');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div suppressHydrationWarning>
      {mode === 'single' ? (
        <TypeRacer />
      ) : (
        <MultiplayerTypeRacer />
      )}
      
      {/* Mode switcher overlay */}
      <div className="fixed top-4 right-4 z-50">
        <Button 
          onClick={() => setMode(mode === 'single' ? 'multiplayer' : 'single')}
          variant="outline"
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
        >
          {mode === 'single' ? 'Multiplayer Mode' : 'Single Player Mode'}
        </Button>
      </div>
    </div>
  );
}
