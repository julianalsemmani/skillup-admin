import React from 'react';
import { Exercise, ExerciseDetail } from '../types';
import { X } from 'lucide-react';

interface Props {
  exercise: Exercise;
  detail: ExerciseDetail;
  onChange: (detail: ExerciseDetail) => void;
  onRemove: () => void;
}

export function ExerciseDetailForm({ exercise, detail, onChange, onRemove }: Props) {
  return (
    <div className="p-4 border rounded-lg mb-4 bg-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium">{exercise.name}</h3>
          <p className="text-sm text-gray-500">{exercise.category} • {exercise.equipment}</p>
        </div>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sets
          </label>
          <input
            type="number"
            value={detail.set}
            onChange={(e) => onChange({ ...detail, set: Number(e.target.value) })}
            className="w-full px-3 py-2 border rounded-md"
            min="1"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Repetitions
          </label>
          <input
            type="number"
            value={detail.repetition}
            onChange={(e) => onChange({ ...detail, repetition: Number(e.target.value) })}
            className="w-full px-3 py-2 border rounded-md"
            min="1"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={detail.repetitionType}
            onChange={(e) => onChange({ ...detail, repetitionType: e.target.value as 'reps' | 'seconds' | 'minutes' })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="reps">Reps</option>
            <option value="seconds">Seconds</option>
            <option value="minutes">Minutes</option>
          </select>
        </div>
      </div>
    </div>
  );
}