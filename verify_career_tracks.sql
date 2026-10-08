SELECT json_build_object(
  'tracks_count', (SELECT count(*) FROM public.career_tracks),
  'skills_count', (SELECT count(*) FROM public.career_track_skills),
  'tracks', (SELECT json_agg(json_build_object('name', name, 'icon', icon_name)) FROM public.career_tracks)
) as result;
