import React from 'react';
import { Session } from '../types';
import { format } from 'date-fns';
import { Edit2, Trash2, Users } from 'lucide-react';

interface Props {
  sessions: Session[];
  onEdit: (session: Session) => void;
  onDelete: (session: Session) => void;
}

export function SessionList({ sessions, onEdit, onDelete }: Props) {
  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div key={session.id} className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{session.title}</h3>
              <p className="text-sm text-gray-500">{session.type}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(session)}
                className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-blue-50"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this session?')) {
                    onDelete(session);
                  }
                }}
                className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-red-50"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          
          <div className="mt-2">
            {session.description && (
              <p className="text-gray-600 text-sm">{session.description}</p>
            )}
          </div>
          
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-500">Start Date:</span>
              <span className="ml-1 font-medium">
                {format(new Date(session.startDate), 'MMM d, yyyy')}
              </span>
            </div>
            <div>
              <span className="text-gray-500">End Date:</span>
              <span className="ml-1 font-medium">
                {format(new Date(session.endDate), 'MMM d, yyyy')}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Points:</span>
              <span className="ml-1 font-medium">{session.points}</span>
            </div>
          </div>
        </div>
      ))}
      
      {sessions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No sessions found
        </div>
      )}
    </div>
  );
}