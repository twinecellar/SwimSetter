"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getCompletionMessage } from "@/lib/get-completion-message";

interface DoneButtonProps {
  href: string;
  effort: 'easy' | 'medium' | 'hard';
  duration_minutes: number;
  tags?: string[];
}

export function DoneButton({ href, effort, duration_minutes, tags }: DoneButtonProps) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    setLabel(getCompletionMessage({ effort, duration_minutes, tags }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Link
      href={href}
      prefetch={false}
      className="goby-finish-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '100%',
        background: 'var(--mint)',
        borderRadius: 'var(--radius)',
        padding: '18px 24px',
        fontFamily: 'var(--font-fraunces)',
        fontSize: '18px',
        fontWeight: 600,
        fontStyle: 'italic',
        color: 'white',
        letterSpacing: '-0.3px',
        textDecoration: 'none',
        boxShadow: '0 4px 16px rgba(59,175,126,0.2)',
      }}
    >
      {label || 'Done'}
    </Link>
  );
}
