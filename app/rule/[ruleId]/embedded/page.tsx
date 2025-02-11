import getRuleDataForVersion from "@/app/hooks/getRuleDataForVersion";
import RuleManager from "../../../components/RuleManager";
import { RULE_VERSION } from "@/app/constants/ruleVersion";

export default async function Rule({ params: { ruleId } }: { params: { ruleId: string } }) {
  // Get rule details and json content for the rule id
  const { ruleInfo, ruleContent } = await getRuleDataForVersion(ruleId, RULE_VERSION.embedded);

  if (!ruleInfo._id || !ruleContent) {
    return <h1>Rule not found</h1>;
  }

  return (
    <RuleManager ruleInfo={ruleInfo} initialRuleContent={ruleContent} version={false} showAllScenarioTabs={false} />
  );
}
