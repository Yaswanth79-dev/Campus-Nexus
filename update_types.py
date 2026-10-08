import re

with open("types/database.ts", "r", encoding="utf-8") as f:
    content = f.read()

new_tables = """
      career_tracks: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon_name: string | null;
          category: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon_name?: string | null;
          category?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon_name?: string | null;
          category?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      career_track_skills: {
        Row: {
          id: string;
          career_track_id: string;
          skill_name: string;
          category: string;
          target_level: 'Essential' | 'Recommended';
          created_at: string;
        };
        Insert: {
          id?: string;
          career_track_id: string;
          skill_name: string;
          category: string;
          target_level: 'Essential' | 'Recommended';
          created_at?: string;
        };
        Update: {
          id?: string;
          career_track_id?: string;
          skill_name?: string;
          category?: string;
          target_level?: 'Essential' | 'Recommended';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'career_track_skills_career_track_id_fkey';
            columns: ['career_track_id'];
            isOneToOne: false;
            referencedRelation: 'career_tracks';
            referencedSchema: 'public';
          }
        ];
      };"""

content = content.replace("    Tables: {", "    Tables: {" + new_tables)

with open("types/database.ts", "w", encoding="utf-8") as f:
    f.write(content)
