'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChecklistItem } from '@/lib/types';

function ChecklistSection({ title, items, eventId, onToggle }: {
  title: string; items: ChecklistItem[]; eventId: string; onToggle: (id: string) => void;
}) {
  const done = items.filter((i) => i.completed).length;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{done}/{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <label key={item.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${item.completed ? 'bg-green-50' : 'hover:bg-slate-50'}`}>
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => onToggle(item.id)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className={`text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.task}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function ChecklistClient({ eventId, preItems, duringItems, postItems }: {
  eventId: string; preItems: ChecklistItem[]; duringItems: ChecklistItem[]; postItems: ChecklistItem[];
}) {
  const router = useRouter();
  const [pre, setPre] = useState(preItems);
  const [during, setDuring] = useState(duringItems);
  const [post, setPost] = useState(postItems);
  const [saving, setSaving] = useState(false);

  const toggle = (items: ChecklistItem[], setItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>, id: string) => {
    const updated = items.map((i) => i.id === id ? { ...i, completed: !i.completed } : i);
    setItems(updated);
    save([...updated, ...(items === pre ? during : pre), ...(items === post ? during : post)]);
  };

  const save = async (allItems: ChecklistItem[]) => {
    setSaving(true);
    try {
      await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: allItems }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const saveAll = () => save([...pre, ...during, ...post]);

  return (
    <div className="space-y-5">
      {saving && <p className="text-xs text-indigo-600 text-right">Saving...</p>}
      <ChecklistSection title="Pre-Event Tasks" items={pre} eventId={eventId} onToggle={(id) => {
        const updated = pre.map((i) => i.id === id ? { ...i, completed: !i.completed } : i);
        setPre(updated);
        save([...updated, ...during, ...post]);
      }} />
      <ChecklistSection title="During-Event Tasks" items={during} eventId={eventId} onToggle={(id) => {
        const updated = during.map((i) => i.id === id ? { ...i, completed: !i.completed } : i);
        setDuring(updated);
        save([...pre, ...updated, ...post]);
      }} />
      <ChecklistSection title="Post-Event Tasks" items={post} eventId={eventId} onToggle={(id) => {
        const updated = post.map((i) => i.id === id ? { ...i, completed: !i.completed } : i);
        setPost(updated);
        save([...pre, ...during, ...updated]);
      }} />
    </div>
  );
}
