import { createContext, useContext, useState } from "react";
import type { PropsWithChildren } from "react";
import { RuleNode } from "@/app/types/rulemap";

interface RuleModalContextType {
  selectedRule: RuleNode | null;
  openModal: (rule: RuleNode) => void;
  closeModal: () => void;
}

const RuleModalContext = createContext<RuleModalContextType | null>(null);

// Provides a context for the selected rule in the rule graph
// Used to display a modal with detailed information about the rule
// Separate from the rule graph component to prevent unnecessary re-renders
export function RuleModalProvider({ children }: PropsWithChildren) {
  const [selectedRule, setSelectedRule] = useState<RuleNode | null>(null);

  const openModal = (rule: RuleNode) => {
    setSelectedRule(rule);
  };

  const closeModal = () => {
    setSelectedRule(null);
  };

  return (
    <RuleModalContext.Provider value={{ selectedRule, openModal, closeModal }}>{children}</RuleModalContext.Provider>
  );
}

// Hook to access the rule modal context
export function useRuleModal() {
  const context = useContext(RuleModalContext);
  if (!context) {
    throw new Error("useRuleModal must be used within a RuleModalProvider");
  }
  return context;
}
