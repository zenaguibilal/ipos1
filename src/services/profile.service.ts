'use client';

import { v4 as uuidv4 } from 'uuid';
import { companyRepository } from '@/repositories/company.repository';
import type { CompanyProfile } from '@/lib/types';

class ProfileService {
    
    async getProfile(): Promise<CompanyProfile | null> {
        try {
            let profile = await companyRepository.get();
            if (!profile) {
                // If no profile exists, create a default one.
                const newProfile: Omit<CompanyProfile, 'updatedAt'> = {
                    uuid: uuidv4(),
                    companyName: "Mon Magasin",
                };
                return await companyRepository.add(newProfile as CompanyProfile);
            }
            return profile;
        } catch (error) {
            throw error;
        }
    }

    async updateProfile(profileData: Partial<CompanyProfile>): Promise<CompanyProfile> {
        try {
            const existing = await this.getProfile();
            if (!existing) {
                 throw new Error("Profil non trouvé, impossible de mettre à jour.");
            }

            const dataToUpdate: Partial<CompanyProfile> = {
                ...profileData,
                updatedAt: new Date(),
            };

            const updated = await companyRepository.update(dataToUpdate);
            return { ...existing, ...updated };
        } catch (error) {
            throw error;
        }
    }
}

export const profileService = new ProfileService();
