import { supabase } from './supabase';

export interface Category {
  id: string;
  cat_id?: string;
  name: string;
  description?: string | null;
  status?: boolean;
  image?: string | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetches all categories directly from Supabase.
 * Strictly uses real database data only - no dummy data.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching categories from Supabase:', error.message);
      return [];
    }

    if (!data) {
      return [];
    }

    // Only return active categories if status is defined
    return (data as Category[]).filter(
      (cat) => cat.status === undefined || cat.status === null || cat.status === true
    );
  } catch (err) {
    console.error('Unexpected error fetching categories from Supabase:', err);
    return [];
  }
}

/**
 * Fetches a single category by its ID or cat_id from Supabase.
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`id.eq.${id},cat_id.eq.${id}`)
      .single();

    if (error) {
      console.error(`Error fetching category with id ${id}:`, error.message);
      return null;
    }

    return (data as Category) || null;
  } catch (err) {
    console.error(`Unexpected error fetching category ${id}:`, err);
    return null;
  }
}
