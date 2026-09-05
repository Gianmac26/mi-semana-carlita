'use client';
import { Task } from '@/lib/tasks';

interface Props {
  task: Task;
  checked: boolean;
  skipped: boolean;
  onToggle: () => void;
  onSkip: () => void;
}

export default function TaskItem({ task, checked, skipped, onToggle, onSkip }: Props) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        onClick={() => !skipped && onToggle()}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', borderRadius: skipped ? '16px 16px 0 0' : 16,
          background: skipped ? 'var(--line)' : 'var(--bg-card)',
          border: `1.5px solid ${skipped ? 'var(--line)' : 'var(--line)'}`,
          borderBottom: skipped ? 'none' : undefined,
          cursor: skipped ? 'default' : 'pointer',
          opacity: skipped ? 0.6 : checked ? 0.55 : 1,
          transition: 'all 0.15s',
          boxShadow: skipped ? 'none' : '0 1px 4px rgba(0,0,0,0.05)',
          userSelect: 'none',
        }}
      >
        {/* Checkbox */}
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          border: (checked && !skipped) ? 'none' : '2.5px solid var(--line)',
          background: (checked && !skipped) ? 'var(--ok)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
          {checked && !skipped && <span style={{ color: '#fff', fontSize: 16, lineHeight: 1 }}>✓</span>}
        </div>

        <span style={{ fontSize: 20, lineHeight: 1 }}>{task.icon}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: 15,
            textDecoration: (checked && !skipped) ? 'line-through' : 'none',
            color: 'var(--ink)',
          }}>
            {task.label}
          </div>
          {task.time && (
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
              {task.time}
            </div>
          )}
        </div>

        {skipped && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)',
            background: 'var(--bg-card)', borderRadius: 6, padding: '2px 7px',
            flexShrink: 0,
          }}>
            N/A
          </span>
        )}
      </div>

      {/* "Me quedé en casa" toggle — only for skippable tasks */}
      {task.skippable && (
        <button
          onClick={onSkip}
          style={{
            width: '100%', padding: '7px 16px',
            borderRadius: '0 0 16px 16px',
            border: '1.5px solid var(--line)', borderTop: 'none',
            background: skipped ? 'var(--teal-soft)' : 'var(--bg-card)',
            color: skipped ? 'var(--teal)' : 'var(--ink-soft)',
            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12,
            cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s',
          }}
        >
          <span>{skipped ? '✓' : '🏠'}</span>
          {skipped ? 'Me quedé en casa (no cuenta para el %)'  : 'Me quedé en casa'}
        </button>
      )}
    </div>
  );
}
