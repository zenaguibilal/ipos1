'use client';

import { createClient } from "@/utils/supabase/client";
import type { CompanyProfile } from "@/lib/types";

const fromSupabase = (profile: any): CompanyProfile => profile ? ({
    uuid: profile.uuid,
    companyName: profile.company_name,
    address: profile.address,
    city: profile.city,
    zipCode: profile.zip_code,
    country: profile.country,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    vatNumber: profile.vat_number,
    rcNumber: profile.rc_number,
    goldPricePerGram: profile.gold_price_per_gram,
    prix_pain: profile.prix_pain,
    updatedAt: profile.updated_at,
}) : ({} as CompanyProfile);

const toSupabase = (profile: Partial<CompanyProfile>) => ({
    uuid: profile.uuid,
    company_name: profile.companyName,
    address: profile.address,
    city: profile.city,
    zip_code: profile.zipCode,
    country: profile.country,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    vat_number: profile.vatNumber,
    rc_number: profile.rcNumber,
    gold_price_per_gram: profile.goldPricePerGram,
    prix_pain: profile.prix_pain,
    updated_at: profile.updatedAt,
});


class CompanyRepository {
    private supabase = createClient();
    
    async get(): Promise<CompanyProfile | null> {
        // Since there's no user, we assume a single profile for the app.
        // We fetch the first one we find.
        const { data, error } = await this.supabase
            .from('company_profile')
            .select('*')
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data ? fromSupabase(data) : null;
    }
    
    async add(profile: CompanyProfile): Promise<CompanyProfile> {
        const { data, error } = await this.supabase.from('company_profile').insert(toSupabase(profile)).select().single();
        if (error) throw error;
        return fromSupabase(data);
    }
    
    async update(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
        // Since there is only one profile, we can update using its UUID.
        const existing = await this.get();
        if (!existing) throw new Error("No profile found to update.");

        const { data: updatedData, error } = await this.supabase
            .from('company_profile')
            .update(toSupabase(data))
            .eq('uuid', existing.uuid)
            .select()
            .single();

        if (error) throw error;
        return fromSupabase(updatedData);
    }

    async deleteAll(): Promise<void> {
        const { error } = await this.supabase.from('company_profile').delete().gt('id', 0); // Placeholder to delete all
        if (error) throw error;
    }

    async bulkUpsert(profiles: CompanyProfile[]): Promise<void> {
        const { error } = await this.supabase.from('company_profile').upsert(profiles.map(toSupabase));
        if (error) throw error;
    }
}

export const companyRepository = new CompanyRepository();
