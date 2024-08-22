"use client";
import { useState, useEffect } from "react";
import { Modal, Button, Form, Input, message } from "antd";
import { RuleInfo } from "@/app/types/ruleInfo";
import { DEFAULT_RULE_CONTENT } from "@/app/constants/defaultRuleContent";
import RuleHeader from "@/app/components/RuleHeader";
import RuleManager from "../../components/RuleManager";
import { RULE_VERSION } from "@/app/constants/ruleVersion";
import { postRuleData } from "@/app/utils/api";

export default function NewRule() {
  const [openNewRuleModal, setOpenNewRuleModal] = useState(false);
  const [ruleInfo, setRuleInfo] = useState<RuleInfo>({
    _id: "",
    title: "New rule",
    goRulesJSONFilename: "",
  });

  useEffect(() => {
    setOpenNewRuleModal(!ruleInfo.goRulesJSONFilename);
  }, [ruleInfo]);

  const createNewRule = async (newRuleInfo: Partial<RuleInfo>) => {
    try {
      setRuleInfo({ ...ruleInfo, ...newRuleInfo });
      const updatedRuleInfo = await postRuleData({ ...newRuleInfo, ruleDraft: { content: DEFAULT_RULE_CONTENT } });
      message.success("New draft created");
      setRuleInfo(updatedRuleInfo);
      window.location.href = `/rule/${updatedRuleInfo._id}?version=draft`;
    } catch (e) {
      console.error("Error updating rule", e);
      message.error("Unable to create new draft");
    }
  };

  return (
    <>
      <Modal title="Create New Rule" open={openNewRuleModal} centered closable={false} footer={null}>
        <Form name="basic" initialValues={{ remember: true }} onFinish={createNewRule} autoComplete="off">
          <br />
          <Form.Item label="Rule title" name="title" rules={[{ required: true, message: "Please input your title!" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="File path/name"
            name="goRulesJSONFilename"
            tooltip="example: my-rule.json or my-path/my-rule.json"
            rules={[
              {
                required: true,
                message: "File path/name is required",
              },
              {
                message:
                  "File path/name can include letters, numbers, dashes (-), underscores (_), and dots (.). Leading slashes (/) are not allowed.",
                pattern: /^(?!\/)[a-zA-Z0-9_\-\\.\/]+$/,
              },
              {
                message: "File path/name must end in .json",
                pattern: /\.json$/,
                validateTrigger: "onBlur",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <RuleHeader ruleInfo={ruleInfo} version={RULE_VERSION.draft} />
      {ruleInfo.goRulesJSONFilename && (
        <RuleManager ruleInfo={ruleInfo} initialRuleContent={DEFAULT_RULE_CONTENT} editing />
      )}
    </>
  );
}