import { useContext } from "react";
import { RuleDescription } from "./RuleDescription";
import Modal from "antd/es/modal/Modal";
import { RuleModalContext } from "../RuleRelationsDisplay";

// Manages the display of the rule description modal
export function DescriptionManager() {
  const context = useContext(RuleModalContext);
  if (!context || !context.selectedRule) return null;

  const { selectedRule, closeModal } = context;

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
