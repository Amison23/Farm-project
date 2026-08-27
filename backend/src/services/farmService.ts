import { FarmRepository } from '../repositories/farmRepository.js';
import { supabase } from '../config/supabaseClient.js';
import { CreateFarmDto, Farm, FarmMember, UserRole } from '../types/farm.js';

export class FarmService {
  private farmRepo: FarmRepository;

  constructor() {
    this.farmRepo = new FarmRepository();
  }

  async getUserFarms(userId: string): Promise<(Farm & { role: UserRole })[]> {
    return this.farmRepo.getUserFarms(userId);
  }

  async getFarmById(farmId: string): Promise<Farm> {
    const farm = await this.farmRepo.getFarmById(farmId);
    if (!farm) {
      const err: any = new Error('Farm not found.');
      err.statusCode = 404;
      err.code = 'FARM_NOT_FOUND';
      throw err;
    }
    return farm;
  }

  async createFarm(dto: CreateFarmDto, userId: string): Promise<Farm> {
    if (!dto.name || !dto.name.trim()) {
      const err: any = new Error('Farm name is required.');
      err.statusCode = 400;
      err.code = 'INVALID_FARM_NAME';
      throw err;
    }
    return this.farmRepo.createFarm(dto.name.trim(), dto.location?.trim(), userId);
  }

  async updateFarm(farmId: string, updates: Partial<Pick<Farm, 'name' | 'location'>>): Promise<Farm> {
    return this.farmRepo.updateFarm(farmId, updates);
  }

  async getFarmMembers(farmId: string): Promise<FarmMember[]> {
    return this.farmRepo.getFarmMembers(farmId);
  }

  async inviteMemberByEmail(farmId: string, email: string, role: UserRole): Promise<FarmMember> {
    if (!email || !email.includes('@')) {
      const err: any = new Error('Valid email address is required.');
      err.statusCode = 400;
      err.code = 'INVALID_EMAIL';
      throw err;
    }

    // Look up target profile by email
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', (
        // Find auth user ID matching email
        await supabase.rpc('get_user_id_by_email', { email_input: email }).then(r => r.data) || ''
      ))
      .maybeSingle();

    // Fallback: Query profiles table directly by querying auth.users via admin API
    let targetUserId = profile?.id;
    if (!targetUserId) {
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (!listError && users?.users) {
        const found = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (found) targetUserId = found.id;
      }
    }

    if (!targetUserId) {
      const err: any = new Error(`No registered user found with email ${email}. They must sign up first.`);
      err.statusCode = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    // Check if user is already a member
    const existingMembers = await this.farmRepo.getFarmMembers(farmId);
    if (existingMembers.some(m => m.user_id === targetUserId)) {
      const err: any = new Error('User is already a member of this farm.');
      err.statusCode = 409;
      err.code = 'ALREADY_MEMBER';
      throw err;
    }

    return this.farmRepo.addMember(farmId, targetUserId, role);
  }

  async removeMember(farmId: string, targetUserId: string, requestingUserId: string): Promise<void> {
    if (targetUserId === requestingUserId) {
      const err: any = new Error('Owners cannot remove themselves from a farm.');
      err.statusCode = 400;
      err.code = 'CANNOT_REMOVE_SELF';
      throw err;
    }
    return this.farmRepo.removeMember(farmId, targetUserId);
  }
}
