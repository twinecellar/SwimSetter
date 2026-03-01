"use client";

interface CompletionTagsProps {
  selected: string[];
  suggested: string[];
  customTag: string;
  onToggleTag: (tag: string) => void;
  onCustomTagChange: (value: string) => void;
  onAddCustomTag: () => void;
}

export function CompletionTags({
  selected,
  suggested,
  customTag,
  onToggleTag,
  onCustomTagChange,
  onAddCustomTag,
}: CompletionTagsProps) {
  return (
    <div>
      <p style={{
        fontFamily: 'var(--font-fraunces)',
        fontSize: '17px', fontWeight: 600,
        color: 'var(--ink)', margin: '0 0 2px',
      }}>
        How did it feel?
      </p>
      <p style={{
        fontFamily: 'var(--font-dm-sans)',
        fontSize: '13px',
        color: 'var(--ink-soft)', opacity: 0.5,
        margin: '0 0 14px',
      }}>
        Pick as many as apply.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {[...suggested, ...selected.filter((t) => !suggested.includes(t))].map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleTag(tag)}
              className="goby-tag-chip completion-tag-chip"
              style={{
                border: `1.5px solid ${isSelected ? 'var(--ink)' : 'var(--fog-dark)'}`,
                background: isSelected ? 'var(--ink)' : 'white',
                color: isSelected ? 'var(--yolk)' : 'var(--ink-soft)',
                borderRadius: '100px',
                padding: '9px 16px',
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '14px', fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <input
          type="text"
          value={customTag}
          onChange={(event) => onCustomTagChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') { event.preventDefault(); onAddCustomTag(); }
          }}
          placeholder="Add your own…"
          className="completion-tag-input"
          style={{
            flex: 1,
            background: 'var(--fog)',
            border: '1.5px solid var(--fog-dark)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '14px',
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={onAddCustomTag}
          style={{
            background: 'var(--ink)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            fontFamily: 'var(--font-dm-sans)',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
