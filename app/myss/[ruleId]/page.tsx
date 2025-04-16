import { Metadata } from "next";
import { RULE_VERSION } from "@/app/constants/ruleVersion";
import { getRuleDataById, getBRERuleFromName } from "@/app/utils/api";
import getGithubAuth from "@/app/utils/getGithubAuth";
import getRuleDataForVersion from "@/app/hooks/getRuleDataForVersion";
import { GithubAuthProvider } from "@/app/components/GithubAuthProvider";
import RuleHeader from "@/app/components/RuleHeader";
import styles from "@/app/myss/rule.module.css";
import RuleFormClient from "@/app/components/RuleFormClient";

type Props = {
  params: { ruleId: string };
  searchParams: { version?: string };
};

// Update page title with rule name
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ruleId } = params;
  const { title, filepath } = await getRuleDataById(ruleId);
  return {
    title: title || filepath,
  };
}

export default async function Rule({ params: { ruleId }, searchParams }: Props) {
  // Get the correct version to fetch
  const defaultVersion = RULE_VERSION.inProduction;
  const version = searchParams.version?.trim() || defaultVersion;

  const oAuthRequired = version === RULE_VERSION.draft || version === RULE_VERSION.inReview; // only require oauth if a draft or a review
  // Ensure user is first logged into github so they can save what they edit
  // If they are not, redirect them to the oauth flow
  const githubAuthInfo = await getGithubAuth(`myss/${ruleId}?version=${version}`, oAuthRequired);

  // Get rule details and json content for the rule id
  const { ruleInfo, ruleContent } = await getRuleDataForVersion(ruleId, version);
  if (!ruleInfo._id) {
    return <h1>Rule not found</h1>;
  }

  // Get BRE rule structure if available
  let breRuleData = null;
  try {
    if (ruleInfo.filepath) {
      const ruleName = ruleInfo.filepath.replace(/\.json$/, "");
      breRuleData = await getBRERuleFromName(ruleName);
      console.log("Retrieved BRE rule structure:", ruleName);
    }
  } catch (error) {
    console.warn("Could not retrieve BRE rule structure:", error);
  }

  return (
    <GithubAuthProvider authInfo={githubAuthInfo}>
      <div className={styles.fullWidthWrapper}>
        <RuleHeader ruleInfo={ruleInfo} />
        <div className={styles.rulesWrapper}>
          <RuleFormClient
            ruleInfo={ruleInfo}
            ruleContent={ruleContent}
            ruleId={ruleId}
            version={version}
            breRuleData={breRuleData}
          />
        </div>
      </div>
    </GithubAuthProvider>
  );
}
