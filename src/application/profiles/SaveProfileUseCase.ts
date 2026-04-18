import { IProfileRepository, StoredUnitProfile } from './IProfileRepository';
import { UnitProfile, validateUnitProfile } from '@domain/profiles/unitProfile';

export class SaveProfileUseCase {
  constructor(private readonly repo: IProfileRepository) {}

  async execute(profile: UnitProfile): Promise<StoredUnitProfile> {
    validateUnitProfile(profile);
    return this.repo.save(profile);
  }
}
