import { supabase } from '../lib/supabase';
import { InstructionalSuite, CurriculumNode } from '../types';

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

  /**
   * Save a parsed curriculum
   */
  static async saveParsedCurriculum(
    name: string,
    nodes: CurriculumNode[],
    sourceType: 'text' | 'file',
    sourceData?: string,
    fileName?: string,
    fileType?: string
  ): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const id = `parsed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const { error } = await supabase
        .from('parsed_curriculums')
        .insert({
          id,
          user_id: user.id,
          name,
          source_type: sourceType,
          source_data: sourceData || null,
          nodes,
          file_name: fileName || null,
          file_type: fileType || null,
        });

      if (error) throw error;
      return { success: true, id };
    } catch (error: any) {
      console.error('Error saving parsed curriculum:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load all parsed curriculums for the current user
   */
  static async loadParsedCurriculums(): Promise<Array<{
    id: string;
    name: string;
    nodes: CurriculumNode[];
    sourceType: string;
    fileName?: string;
    createdAt: string;
  }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('parsed_curriculums')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        nodes: row.nodes,
        sourceType: row.source_type,
        fileName: row.file_name,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error('Error loading parsed curriculums:', error);
      return [];
    }
  }

  /**
   * Delete a parsed curriculum
   */
  static async deleteParsedCurriculum(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('parsed_curriculums')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting parsed curriculum:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save user settings
   */
  static async saveUserSettings(settings: {
    institutionName?: string;
    instructorName?: string;
    defaultOutputType?: string;
    defaultGradeLevel?: string;
    defaultStandardsFramework?: string;
    defaultBloomLevel?: string;
    defaultDifferentiation?: string;
    defaultAesthetic?: string;
    defaultPageCount?: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if settings exist
      const { data: existing } = await supabase
        .from('user_settings')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('user_settings')
          .update(settings)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            ...settings
          });
        
        if (error) throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error saving user settings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load user settings
   */
  static async loadUserSettings(): Promise<{
    institutionName: string;
    instructorName: string;
    defaultOutputType: string;
    defaultGradeLevel: string;
    defaultStandardsFramework: string;
    defaultBloomLevel: string;
    defaultDifferentiation: string;
    defaultAesthetic: string;
    defaultPageCount: number;
  } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      
      if (!data) return null;

      return {
        institutionName: data.institution_name || '',
        instructorName: data.instructor_name || '',
        defaultOutputType: data.default_output_type || 'Worksheet',
        defaultGradeLevel: data.default_grade_level || '5th Grade',
        defaultStandardsFramework: data.default_standards_framework || 'Common Core Math',
        defaultBloomLevel: data.default_bloom_level || 'Application',
        defaultDifferentiation: data.default_differentiation || 'General',
        defaultAesthetic: data.default_aesthetic || 'Modern Professional',
        defaultPageCount: data.default_page_count || 1,
      };
    } catch (error) {
      console.error('Error loading user settings:', error);
      return null;
    }
  }
}
