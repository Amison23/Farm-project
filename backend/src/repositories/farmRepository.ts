import { supabase } from '../config/supabaseClient.js';
import { Farm, FarmMember, UserRole } from '../types/farm.js';

export class FarmRepository {
  /**
   * List all farms a given user is an accepted member of.
   */
  async getUserFarms(userId: string): Promise<(Farm & { role: UserRole })[]> {
    const { data, error } = await supabase
      .from('farm_members')
      .select('role, farm:farms (*)')
      .eq('user_id', userId)
      .not('accepted_at', 'is', null);

    if (error) throw error;
    if (!data) return [];

    return data
      .filter((item: any) => item.farm !== null)
      .map((item: any) => ({
        ...(item.farm as Farm),
        role: item.role as UserRole,
      }));
  }

  /**
   * Get a single farm by ID.
   */
  async getFarmById(farmId: string): Promise<Farm | null> {
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Farm;
  }

  /**
   * Ensure profile exists for a user before inserting farm or membership rows.
   */
  private async ensureProfile(userId: string): Promise<void> {
    const { data } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
    if (!data) {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const fullName = userData.user?.user_metadata?.full_name || userData.user?.email || 'Farmer';
      await supabase.from('profiles').upsert({ id: userId, full_name: fullName });
    }
  }

  /**
   * Create a farm and automatically add the creator as the Owner in farm_members.
   */
  async createFarm(name: string, location: string | undefined, userId: string): Promise<Farm> {
    await this.ensureProfile(userId);

    const farmId = crypto.randomUUID();

    // 1. Insert farm row
    const { error: farmError } = await supabase
      .from('farms')
      .insert({ id: farmId, name, location: location || null, created_by: userId });

    if (farmError) throw farmError;

    // 2. Add creator as owner in farm_members
    const { error: memberError } = await supabase
      .from('farm_members')
      .insert({
        farm_id: farmId,
        user_id: userId,
        role: 'owner',
        accepted_at: new Date().toISOString(),
      });

    if (memberError) {
      await supabase.from('farms').delete().eq('id', farmId);
      throw memberError;
    }

    // 3. Fetch farm details now that membership is established
    const { data: farm, error: fetchError } = await supabase
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .single();

    if (fetchError) throw fetchError;

    return farm as Farm;
  }

  /**
   * Update farm details (e.g. name, location).
   */
  async updateFarm(farmId: string, updates: Partial<Pick<Farm, 'name' | 'location'>>): Promise<Farm> {
    const { data, error } = await supabase
      .from('farms')
      .update(updates)
      .eq('id', farmId)
      .select()
      .single();

    if (error) throw error;
    return data as Farm;
  }

  /**
   * Get members of a farm with user profile details.
   */
  async getFarmMembers(farmId: string): Promise<FarmMember[]> {
    const { data, error } = await supabase
      .from('farm_members')
      .select('*, profile:profiles (id, full_name, phone, created_at)')
      .eq('farm_id', farmId);

    if (error) throw error;
    return (data || []) as FarmMember[];
  }

  /**
   * Invite / add a user to a farm by user ID.
   */
  async addMember(farmId: string, userId: string, role: UserRole): Promise<FarmMember> {
    await this.ensureProfile(userId);

    const { data, error } = await supabase
      .from('farm_members')
      .insert({
        farm_id: farmId,
        user_id: userId,
        role,
        accepted_at: new Date().toISOString(), // auto-accepted for v1
      })
      .select('*, profile:profiles (id, full_name, phone, created_at)')
      .single();

    if (error) throw error;
    return data as FarmMember;
  }

  /**
   * Remove a member from a farm.
   */
  async removeMember(farmId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('farm_members')
      .delete()
      .eq('farm_id', farmId)
      .eq('user_id', userId);

    if (error) throw error;
  }
}
