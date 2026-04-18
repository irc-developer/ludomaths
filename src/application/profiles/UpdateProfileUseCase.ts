import { IProfileRepository, StoredUnitProfile } from './IProfileRepository';
import { UnitProfile, validateUnitProfile } from '@domain/profiles/unitProfile';

export class UpdateProfileUseCase {
  constructor(private readonly repo: IProfileRepository) {}

  async execute(id: string, profile: UnitProfile): Promise<StoredUnitProfile> {
    validateUnitProfile(profile);
    return this.repo.update(id, profile);
  }
}
