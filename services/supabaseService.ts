import { supabase } from '../lib/supabase';
import { InstructionalSuite } from '../types';

export class SupabaseService {
  
  /**
   * Save or update an instructional suite
   */
  static async saveSuite(suite: InstructionalSuite): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user ID from Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      const { data: existingData } = await supabase
        .from('instructional_suites')
        .select('id')
        .eq('id', suite.id)
        .single();

      if (existingData) {
        // Update existing
        const { error } = await supabase
          .from('instructional_suites')
          .update({
            node_id: suite.nodeId,
            title: suite.title,
            sections: suite.sections,
            output_type: suite.outputType,
            bloom_level: suite.bloomLevel,
            differentiation: suite.differentiation,
            aesthetic: suite.aesthetic,
            institution_name: suite.institutionName || null,
            instructor_name: suite.instructorName || null,
            doodle_base64: suite.doodleBase64 || null,
            doodle_prompt: suite.doodlePrompt || null,
          })
          .eq('id', suite.id);

        if (error) throw error;
      } else {
        // Insert new with authenticated user ID
        const { error } = await supabase
          .from('instructional_suites')
          .insert({
            id: suite.id,
            user_id: userId,
            node_id: suite.nodeId,
            title: suite.title,
            sections: suite.sections,
            output_type: suite.outputType,
            bloom_level: suite.bloomLevel,
            differentiation: suite.differentiation,
            aesthetic: suite.aesthetic,
            institution_name: suite.institutionName || null,
            instructor_name: suite.instructorName || null,
            doodle_base64: suite.doodleBase64 || null,
            doodle_prompt: suite.doodlePrompt || null,
          });

        if (error) throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error saving suite:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load all suites
   */
  static async loadSuites(): Promise<InstructionalSuite[]> {
    try {
      const { data, error } = await supabase
        .from('instructional_suites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        nodeId: row.node_id,
        title: row.title,
        sections: row.sections,
        outputType: row.output_type,
        bloomLevel: row.bloom_level,
        differentiation: row.differentiation,
        aesthetic: row.aesthetic,
        institutionName: row.institution_name || '',
        instructorName: row.instructor_name || '',
        doodleBase64: row.doodle_base64 || '',
        doodlePrompt: row.doodle_prompt || '',
      }));
    } catch (error) {
      console.error('Error loading suites:', error);
      return [];
    }
  }

  /**
   * Delete a suite
   */
  static async deleteSuite(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('instructional_suites')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting suite:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Migrate localStorage data to Supabase
   */
  static async migrateFromLocalStorage(storageKey: string): Promise<number> {
    try {
      const savedDrafts = localStorage.getItem(storageKey);
      if (!savedDrafts) return 0;

      const drafts: InstructionalSuite[] = JSON.parse(savedDrafts);
      let migrated = 0;

      for (const draft of drafts) {
        const result = await this.saveSuite(draft);
        if (result.success) migrated++;
      }

      return migrated;
    } catch (error) {
      console.error('Error migrating from localStorage:', error);
      return 0;
    }
  }
}
