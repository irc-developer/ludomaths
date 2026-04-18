import { IProfileRepository, StoredUnitProfile } from './IProfileRepository';

export class LoadProfilesUseCase {
  constructor(private readonly repo: IProfileRepository) {}

  async loadAll(): Promise<StoredUnitProfile[]> {
    return this.repo.findAll();
  }

  async loadById(id: string): Promise<StoredUnitProfile | null> {
    return this.repo.findById(id);
  }
}
