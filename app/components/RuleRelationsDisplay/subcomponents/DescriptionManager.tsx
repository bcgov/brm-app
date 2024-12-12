import { RuleDescription } from "./RuleDescription";
import { useRuleModal } from "../../../contexts/RuleModalContext";
import Modal from "antd/es/modal/Modal";

// Manages the display of the rule description modal
export function DescriptionManager() {
  const { selectedRule, closeModal } = useRuleModal();

  if (!selectedRule) return null;

  return (
    <Modal
      open={true}
      onCancel={closeModal}
      footer={null}
      destroyOnClose
      keyboard={true}
      maskClosable={true}
      aria-modal="true"
    >
      <div role="document" tabIndex={0}>
        <RuleDescription
          data={{
            label: selectedRule.label,
            name: selectedRule.name,
            filepath: selectedRule.filepath,
            description: selectedRule.description || undefined,
            url: selectedRule.url,
            isPublished: selectedRule.isPublished,
          }}
          onClose={closeModal}
          visible={true}
        />
      </div>
    </Modal>
  );
}
