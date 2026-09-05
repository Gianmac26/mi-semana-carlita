'use client';
import { Task } from '@/lib/tasks';

interface Props {
  task: Task;
  checked: boolean;
  onToggle: () => void;
}

export default function TaskItem({ task, checked, onToggle }: Props) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderRadius: 16,
        background: 'var(--bg-card)', border: '1.5px solid var(--line)',
        cursor: 'pointer', opacity: checked ? 0.55 : 1,
        transition: 'all 0.15s', marginBottom: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        userSelect: 'none',
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        border: checked ? 'none' : '2.5px solid var(--line)',
        background: checked ? 'var(--ok)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {checked && <span style={{ color: '#fff', fontSize: 16, lineHeight: 1 }}>✓</span>}
      </div>

      <span style={{ fontSize: 20, lineHeight: 1 }}>{task.icon}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600, fontSize: 15,
          textDecoration: checked ? 'line-through' : 'none',
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
    </div>
  );
}
