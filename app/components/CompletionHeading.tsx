"use client";

import { useState, useEffect } from "react";
import { getCompletionHeading } from "@/lib/get-completion-message";

export function CompletionHeading() {
  const [heading, setHeading] = useState('');

  useEffect(() => {
    setHeading(getCompletionHeading());
  }, []);

  return (
    <h1 style={{
      fontFamily: 'var(--font-fraunces)',
      fontSize: '28px', fontWeight: 600,
      color: 'var(--ink)', letterSpacing: '-0.5px',
      padding: '0 24px 8px', margin: 0,
    }}>
      {heading || 'Nice work.'}
    </h1>
  );
}
