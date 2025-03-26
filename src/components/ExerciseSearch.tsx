import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Exercise } from '../types';
import { pb } from '../lib/pb';

interface Props {
  onSelect: (exercise: Exercise) => void;
}

export function ExerciseSearch({ onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length < 2) return;
    
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const records = await pb.collection('exercises').getList(1, 10, {
          filter: `name ~ "${search}" || nameNO ~ "${search}"`,
          sort: 'name',
        });
        setExercises(records.items as Exercise[]);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchExercises, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises..."
          className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>
      
      {search.length >= 2 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : exercises.length > 0 ? (
            <ul className="py-2">
              {exercises.map((exercise) => (
                <li
                  key={exercise.id}
                  onClick={() => onSelect(exercise)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-medium">{exercise.name}</div>
                  <div className="text-sm text-gray-500">
                    {exercise.category} • {exercise.equipment}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">No exercises found</div>
          )}
        </div>
      )}
    </div>
  );
}