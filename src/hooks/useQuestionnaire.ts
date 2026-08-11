import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { QuestionnaireData, createDefaultQuestionnaireData } from '@/types/questionnaire';

interface QuestionnaireStore {
  currentStep: number;
  totalSteps: number;
  data: QuestionnaireData;
  isGenerating: boolean;
  generatedId: string | null;

  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;

  // Data updates
  updateTripDetails: (updates: Partial<QuestionnaireData['tripDetails']>) => void;
  updateTravelers: (updates: Partial<QuestionnaireData['travelers']>) => void;
  updateBudget: (updates: Partial<QuestionnaireData['budget']>) => void;
  updateTransport: (updates: Partial<QuestionnaireData['transport']>) => void;
  updateAccommodation: (updates: Partial<QuestionnaireData['accommodation']>) => void;
  updateFood: (updates: Partial<QuestionnaireData['food']>) => void;
  updateInterests: (updates: Partial<QuestionnaireData['interests']>) => void;
  updateStyle: (updates: Partial<QuestionnaireData['style']>) => void;

  // Generation
  setGenerating: (val: boolean) => void;
  setGeneratedId: (id: string | null) => void;

  // Reset
  reset: () => void;
}

export const useQuestionnaireStore = create<QuestionnaireStore>()(
  persist(
    (set) => ({
      currentStep: 1,
      totalSteps: 9,
      data: createDefaultQuestionnaireData(),
      isGenerating: false,
      generatedId: null,

      nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, s.totalSteps) })),
      prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
      goToStep: (step) => set({ currentStep: step }),

      updateTripDetails: (updates) =>
        set((s) => ({ data: { ...s.data, tripDetails: { ...s.data.tripDetails, ...updates } } })),
      updateTravelers: (updates) =>
        set((s) => ({ data: { ...s.data, travelers: { ...s.data.travelers, ...updates } } })),
      updateBudget: (updates) =>
        set((s) => ({ data: { ...s.data, budget: { ...s.data.budget, ...updates } } })),
      updateTransport: (updates) =>
        set((s) => ({ data: { ...s.data, transport: { ...s.data.transport, ...updates } } })),
      updateAccommodation: (updates) =>
        set((s) => ({ data: { ...s.data, accommodation: { ...s.data.accommodation, ...updates } } })),
      updateFood: (updates) =>
        set((s) => ({ data: { ...s.data, food: { ...s.data.food, ...updates } } })),
      updateInterests: (updates) =>
        set((s) => ({ data: { ...s.data, interests: { ...s.data.interests, ...updates } } })),
      updateStyle: (updates) =>
        set((s) => ({ data: { ...s.data, style: { ...s.data.style, ...updates } } })),

      setGenerating: (val) => set({ isGenerating: val }),
      setGeneratedId: (id) => set({ generatedId: id }),

      reset: () =>
        set({
          currentStep: 1,
          data: createDefaultQuestionnaireData(),
          isGenerating: false,
          generatedId: null,
        }),
    }),
    {
      name: 'atp:questionnaire:v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({
        data: state.data,
        currentStep: state.currentStep,
        generatedId: state.generatedId,
      }),
    }
  )
);
