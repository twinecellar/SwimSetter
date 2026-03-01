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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M16.5 20.5H7.5" />
        <path d="M13 18.5C13 19.0523 12.5523 19.5 12 19.5C11.4477 19.5 11 19.0523 11 18.5H13ZM11 18.5V16H13V18.5H11Z" fill="currentColor" stroke="none" />
        <path d="M10.5 9.5H13.5" />
        <path d="M5.5 14.5C5.5 14.5 3.5 13 3.5 10.5C3.5 9.73465 3.5 9.06302 3.5 8.49945C3.5 7.39488 4.39543 6.5 5.5 6.5C6.60457 6.5 7.5 7.39543 7.5 8.5V9.5" />
        <path d="M18.5 14.5C18.5 14.5 20.5 13 20.5 10.5C20.5 9.73465 20.5 9.06302 20.5 8.49945C20.5 7.39488 19.6046 6.5 18.5 6.5C17.3954 6.5 16.5 7.39543 16.5 8.5V9.5" />
        <path d="M16.5 11.3593V7.5C16.5 6.39543 15.6046 5.5 14.5 5.5H9.5C8.39543 5.5 7.5 6.39543 7.5 7.5V11.3593C7.5 12.6967 8.16841 13.9456 9.2812 14.6875L11.4453 16.1302C11.7812 16.3541 12.2188 16.3541 12.5547 16.1302L14.7188 14.6875C15.8316 13.9456 16.5 12.6967 16.5 11.3593Z" />
      </svg>
      {label || 'Done'}
    </Link>
  );
}
