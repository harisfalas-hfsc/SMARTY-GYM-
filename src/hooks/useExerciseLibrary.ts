import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExerciseBasic {
  id: string;
  name: string;
  body_part: string;
  equipment: string;
  target: string;
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

async function fetchAllExercises(): Promise<ExerciseBasic[]> {
  const all: ExerciseBasic[] = [];
  const size = 1000;
  for (let offset = 0; ; offset += size) {
    const { data, error } = await supabase
      .from("exercises")
      .select("id,name,body_part,equipment,target_muscle")
      .eq("is_active", true)
      .order("name")
      .range(offset, offset + size - 1);
    if (error) throw error;
    const rows = data ?? [];
    all.push(
      ...rows.map((r) => ({
        id: r.id,
        name: r.name,
        body_part: r.body_part ?? "",
        equipment: r.equipment ?? "",
        target: r.target_muscle ?? "",
      })),
    );
    if (rows.length < size) break;
  }
  return all;
}

/** Exercise library search used by the admin workout editor. */
export function useExerciseLibrary() {
  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["exercise-library-basic"],
    queryFn: fetchAllExercises,
    staleTime: 10 * 60 * 1000,
  });
  const searchExercises = (query: string, limit = 20): ExerciseBasic[] => {
    if (!query || query.length < 2) return [];
    const q = normalize(query);
    return exercises.filter((ex) => normalize(ex.name).includes(q)).slice(0, limit);
  };
  return { exercises, isLoading, searchExercises };
}
