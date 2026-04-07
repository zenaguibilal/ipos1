'use client';

import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import type { CompanyProfile } from '@/lib/types';

class CompanyProfileService {
    
    async getProfile(): Promise<CompanyProfile | null> {
        let profile = await db.company_profile.toCollection().first();
        if (!profile) {
            // If no profile exists, create a default one.
            const newProfile: CompanyProfile = {
                uuid: uuidv4(),
                companyName: "Mon Magasin",
            };
            const id = await db.company_profile.add(newProfile);
            newProfile.id = id;
            return newProfile;
        }
        return profile;
    }

    async updateProfile(profileData: Partial<CompanyProfile>): Promise<CompanyProfile> {
        const existing = await this.getProfile();
        if (!existing || !existing.id) {
             throw new Error("Profil non trouvé, impossible de mettre à jour.");
        }

        const dataToUpdate: Partial<CompanyProfile> = {
            ...profileData,
            updatedAt: new Date(),
        };

        await db.company_profile.update(existing.id, dataToUpdate);
        return { ...existing, ...dataToUpdate };
    }
}

export const companyProfileService = new CompanyProfileService();