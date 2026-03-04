import { useState } from 'react';
import { TASKS } from '../data/tasks.js';

const SECTIONS = [
  { key: 'urgent',     label: '🚨 Urgent',       tagClass: 'badge-red',    items: TASKS.urgent },
  { key: 'inProgress', label: '🔄 In Progress',  tagClass: 'badge-teal',   items: TASKS.inProgress },
  { key: 'next',       label: '📋 Up Next',       tagClass: 'badge-orange', items: TASKS.next },
  { key: 'backlog',    label: '📦 Backlog',        tagClass: 'badge-muted',  items: TASKS.backlog },
  { key: 'done',       label: '✅ Completed',     tagClass: 'badge-green',  items: TASKS.done },
];

export default function Tasks() {
  const [checked, setChecked] = useState({});
  const toggle = (id) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="panel-scroll">
      <h1 className="text-xl font-semibold mb-6">Tasks</h1>

      {SECTIONS.map(section => (
        <div key={section.key} className="card mb-4">
          <div className="card-title">{section.label}</div>
          <div className="space-y-2">
            {section.items.map(item => {
              const done = section.key === 'done' || checked[item.id];
              return (
                <div key={item.id}
                     className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface2 transition-colors group">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => toggle(item.id)}
                    className="mt-0.5 w-4 h-4 rounded border-border accent-teal flex-shrink-0 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm leading-relaxed ${done ? 'line-through text-muted' : 'text-white'}`}>
                      {item.t}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={section.tagClass}>{section.key}</span>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer"
                         className="text-xs text-teal opacity-0 group-hover:opacity-100 transition-opacity">↗</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
