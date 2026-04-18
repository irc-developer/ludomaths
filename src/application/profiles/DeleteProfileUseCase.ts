import { IProfileRepository } from './IProfileRepository';

export class DeleteProfileUseCase {
  constructor(private readonly repo: IProfileRepository) {}

  async execute(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
