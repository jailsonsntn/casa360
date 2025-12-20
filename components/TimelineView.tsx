
import React from 'react';
import { TimelineEvent } from '../types';
import { History, CheckCircle, TrendingUp, TrendingDown, Bell } from 'lucide-react';

interface TimelineViewProps {
  events: TimelineEvent[];
}

const TimelineView: React.FC<TimelineViewProps> = ({ events }) => {
  const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getIcon = (type: TimelineEvent['eventType']) => {
    switch (type) {
      case 'task': return <CheckCircle className="w-4 h-4 text-indigo-500" />;
      case 'income': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'expense': return <TrendingDown className="w-4 h-4 text-rose-500" />;
      case 'reminder': return <Bell className="w-4 h-4 text-amber-500" />;
    }
  };

  const getBg = (type: TimelineEvent['eventType']) => {
    switch (type) {
      case 'task': return 'bg-indigo-50';
      case 'income': return 'bg-emerald-50';
      case 'expense': return 'bg-rose-50';
      case 'reminder': return 'bg-amber-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Linha do Tempo</h2>
        <div className="p-2 bg-slate-100 rounded-xl">
          <History className="w-6 h-6 text-slate-500" />
        </div>
      </div>

      <div className="relative ml-4 border-l-2 border-slate-200 pl-8 space-y-8 pb-10">
        {sortedEvents.map((event, idx) => (
          <div key={event.id} className="relative group">
            {/* Timeline Dot */}
            <div className={`absolute -left-[41px] top-0 p-2 rounded-full border-4 border-slate-50 ${getBg(event.eventType)} shadow-sm transition-transform group-hover:scale-110`}>
              {getIcon(event.eventType)}
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-slate-800 text-sm">{event.title}</h4>
                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                  {new Date(event.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-500">{event.description}</p>
              <div className="mt-3 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {sortedEvents.length === 0 && (
          <div className="text-center py-20 -ml-8 text-slate-400">
            <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Ainda não há registros automáticos.</p>
            <p className="text-xs mt-1">Sua atividade aparecerá aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineView;
