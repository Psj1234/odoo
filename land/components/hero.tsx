"use client";

import Link from "next/link";
import { GL } from "./gl";
import { Pill } from "./pill";
import { Button } from "./ui/button";
import { useState } from "react";

export function Hero() {
  const [hovering, setHovering] = useState(false);
  return (
    <div className="flex flex-col h-svh justify-between">
      <GL hovering={hovering} />

      <div className="pb-16 mt-auto text-center relative">
        <Pill className="mb-6">BETA RELEASE</Pill>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-sentient">
          Unlock your <br />
          <i className="font-light">future</i> growth
        </h1>
        <p className="font-mono text-sm sm:text-base text-foreground/60 text-balance mt-8 max-w-[440px] mx-auto">
          Through real-time inventory intelligence that eliminates errors and boosts efficiency.
        </p>

        <a 
          className="contents max-sm:hidden" 
          href={process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:5173/login'}
        >
          <Button
            className="mt-14"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            [Get Started]
          </Button>
        </a>
        <a 
          className="contents sm:hidden" 
          href={process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:5173/login'}
        >
          <Button
            size="sm"
            className="mt-14"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
          >
            [Get Started]
          </Button>
        </a>
      </div>
    </div>
  );
}
