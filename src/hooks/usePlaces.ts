import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Place } from '../data';

interface DbPlace {
  id: string;
  name: string;
  description: string;
  category: string;
  kind: string;
  position_lat: number;
  position_lng: number;
  rating: number;
  price: string;
  city: string;
  image_url: string | null;
  created_by: string | null;
  created_at: string;
}

function dbToPlace(row: DbPlace, favoriteIds: Set<string>): Place {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    category: row.category as Place['category'],
    kind: row.kind || '',
    position: [row.position_lat, row.position_lng],
    rating: Number(row.rating),
    price: row.price || '',
    city: row.city || '武汉',
    isFavorite: favoriteIds.has(row.id),
  };
}

export function usePlaces(userId: string | undefined) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavoriteIds(new Set());
      return new Set<string>();
    }
    const { data } = await supabase
      .from('favorites')
      .select('place_id')
      .eq('user_id', userId);
    const ids = new Set((data || []).map((f: any) => f.place_id));
    setFavoriteIds(ids);
    return ids;
  }, [userId]);

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const favIds = await fetchFavorites();
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaces((data || []).map((row: DbPlace) => dbToPlace(row, favIds)));
    } catch (err) {
      console.error('Failed to fetch places:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFavorites]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const addPlace = useCallback(async (place: Omit<Place, 'id' | 'isFavorite'>) => {
    const { data, error } = await supabase
      .from('places')
      .insert({
        name: place.name,
        description: place.description,
        category: place.category,
        kind: place.kind,
        position_lat: place.position[0],
        position_lng: place.position[1],
        rating: place.rating,
        price: place.price,
        city: place.city || '武汉',
        created_by: userId || null,
      })
      .select()
      .single();

    if (error) throw error;
    const newPlace = dbToPlace(data, favoriteIds);
    setPlaces(prev => [newPlace, ...prev]);
    return newPlace;
  }, [userId, favoriteIds]);

  const deletePlace = useCallback(async (id: string) => {
    const { error } = await supabase.from('places').delete().eq('id', id);
    if (error) throw error;
    setPlaces(prev => prev.filter(p => p.id !== id));
  }, []);

  const toggleFavorite = useCallback(async (placeId: string) => {
    if (!userId) return;

    const isFav = favoriteIds.has(placeId);

    if (isFav) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('place_id', placeId);
      setFavoriteIds(prev => {
        const next = new Set(prev);
        next.delete(placeId);
        return next;
      });
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: userId, place_id: placeId });
      setFavoriteIds(prev => new Set(prev).add(placeId));
    }

    setPlaces(prev =>
      prev.map(p => p.id === placeId ? { ...p, isFavorite: !isFav } : p)
    );
  }, [userId, favoriteIds]);

  return { places, loading, addPlace, deletePlace, toggleFavorite, refetch: fetchPlaces };
}
