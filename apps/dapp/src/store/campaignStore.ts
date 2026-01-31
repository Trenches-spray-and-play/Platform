import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface CampaignFilters {
    level: string[];
    search: string;
    chain: string[];
}

interface Campaign {
    id: string;
    name: string;
    tokenSymbol: string;
    level: string;
    roiMultiplier: string;
}

interface CampaignState {
    selectedCampaign: Campaign | null;
    filters: CampaignFilters;
    setSelectedCampaign: (campaign: Campaign | null) => void;
    setFilters: (filters: Partial<CampaignFilters>) => void;
    resetFilters: () => void;
}

const initialFilters: CampaignFilters = {
    level: [],
    search: '',
    chain: [],
};

// Base store configuration
const storeConfig = (set: any) => ({
    selectedCampaign: null as Campaign | null,
    filters: initialFilters,
    setSelectedCampaign: (campaign: Campaign | null) => set({ selectedCampaign: campaign }, false, 'setSelectedCampaign'),
    setFilters: (newFilters: Partial<CampaignFilters>) => set((state: CampaignState) => ({
        filters: { ...state.filters, ...newFilters }
    }), false, 'setFilters'),
    resetFilters: () => set({ filters: initialFilters }, false, 'resetFilters'),
});

// Create store based on environment
const isDev = process.env.NODE_ENV === 'development';

export const useCampaignStore = isDev
    ? create<CampaignState>()(devtools(storeConfig, { name: 'Campaign Store' }))
    : create<CampaignState>()(storeConfig);
