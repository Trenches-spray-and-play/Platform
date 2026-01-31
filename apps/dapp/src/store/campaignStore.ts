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

export const useCampaignStore = create<CampaignState>()(
    devtools(
        (set) => ({
            selectedCampaign: null,
            filters: initialFilters,
            setSelectedCampaign: (campaign) => set({ selectedCampaign: campaign }, false, 'setSelectedCampaign'),
            setFilters: (newFilters) => set((state) => ({
                filters: { ...state.filters, ...newFilters }
            }), false, 'setFilters'),
            resetFilters: () => set({ filters: initialFilters }, false, 'resetFilters'),
        }),
        { name: 'Campaign Store' }
    )
);
