import { Metadata } from "next";
import { getRuleDataByFilepath, getDocument, getBRERuleFromName } from "@/app/utils/api";
import getGithubAuth from "@/app/utils/getGithubAuth";
import { GithubAuthProvider } from "@/app/components/GithubAuthProvider";
import RuleHeader from "@/app/components/RuleHeader";
import styles from "@/app/myss/rule.module.css";
import RuleFormClient from "@/app/components/RuleFormClient";
import { RULE_VERSION } from "@/app/constants/ruleVersion";
import NotFoundError from "@/app/components/NotFoundError";

type Props = {
  params: { ruleName: string };
  searchParams: { parentRule?: string; parentRuleId?: string; version?: string };
};

// Update page title with rule name
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ruleName } = params;
  try {
    // Clean the rule name to get the filepath
    const filepath = decodeURIComponent(ruleName).split("?")[0];
    const ruleData = await getRuleDataByFilepath(filepath);
    return {
      title: ruleData?.title || ruleData?.label || ruleData?.name || `Child Rule - ${filepath}`,
    };
  } catch (error) {
    console.error("Error fetching rule for metadata:", error);
    return {
      title: `Child Rule - ${ruleName}`,
    };
  }
}

export default async function ChildRule({ params: { ruleName }, searchParams }: Props) {
  // Get the parent rule name and ID from search params
  const parentRuleName = searchParams.parentRule || "";
  const parentRuleId = searchParams.parentRuleId || "";

  // Get version parameter if provided, or use production as default
  const version = searchParams.version === "draft" ? RULE_VERSION.draft : RULE_VERSION.inProduction;

  // Clean the rule name to get the filepath
  const filepath = decodeURIComponent(ruleName).split("?")[0];

  // Ensure user is first logged into github (reusing Github auth)
  const authPath = `myss/child/${encodeURIComponent(ruleName)}?parentRule=${encodeURIComponent(
    parentRuleName
  )}&parentRuleId=${encodeURIComponent(parentRuleId)}`;
  const githubAuthInfo = await getGithubAuth(authPath, false);

  try {
    console.log(`Fetching child rule: ${filepath}, parent: ${parentRuleName}, parentId: ${parentRuleId}`);

    // Get rule data using the filepath
    const ruleInfo = await getRuleDataByFilepath(filepath);

    if (!ruleInfo || !ruleInfo.name) {
      throw new Error(`Rule not found for filepath: ${filepath}`);
    }

    // Initialize rule content as a simple default in case we can't fetch it
    let ruleContent = {
      nodes: [
        {
          id: "output",
          type: "outputNode",
          position: { x: 0, y: 0 },
          data: {
            name: "output",
            value: JSON.stringify({ result: {} }),
          },
        },
      ],
      edges: [],
    };

    // Try to get rule content
    try {
      const document = await getDocument(filepath);
      if (document && document.nodes) {
        ruleContent = document;
        console.log("Found rule content by filepath");
      }
    } catch (err) {
      console.error(`Could not get document by filepath ${filepath}:`, err);
    }

    // Try to get BRE rule structure
    let breRuleData = null;
    try {
      const ruleName = filepath.replace(/\.json$/, "");
      breRuleData = await getBRERuleFromName(ruleName);
      console.log("Retrieved BRE rule structure for child rule");
    } catch (error) {
      console.warn("Could not retrieve BRE rule structure for child rule:", error);
    }

    return (
      <GithubAuthProvider authInfo={githubAuthInfo}>
        <div className={styles.fullWidthWrapper}>
          <RuleHeader
            ruleInfo={{
              name: ruleInfo.name,
              label: ruleInfo.label || ruleInfo.name,
              description: ruleInfo.description || "",
            }}
            showBackButton={true}
            backUrl={`/myss/${parentRuleName}`}
          />
          <div className={styles.rulesWrapper}>
            {/* Add indication if viewing draft version */}
            {version === RULE_VERSION.draft && (
              <div className={styles.linkedRuleInfo}>
                <p className={styles.linkedRuleText}>
                  Viewing draft version of child rule <strong>{filepath}</strong>
                </p>
              </div>
            )}
            <RuleFormClient
              ruleInfo={ruleInfo}
              ruleContent={ruleContent}
              isChildRule={true}
              parentRuleName={parentRuleName}
              parentRuleId={parentRuleId}
              ruleId={ruleInfo.id}
              version={version}
              breRuleData={breRuleData}
            />
          </div>
        </div>
      </GithubAuthProvider>
    );
  } catch (error) {
    console.error("Error fetching child rule data:", error);
    return (
      <NotFoundError
        title="Rule not found"
        message={`Unable to load rule '${filepath}'`}
        error={error}
        debugInfo={{
          "Child rule filepath": filepath,
          "Parent rule": parentRuleName,
          "Parent rule ID": parentRuleId,
          Version: version,
        }}
      />
    );
  }
}
