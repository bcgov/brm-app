import { Metadata } from "next";
import { getRuleDataByFilepath, getRuleDraftByFilepath, getDocument, getBRERuleFromName } from "@/app/utils/api";
import getGithubAuth from "@/app/utils/getGithubAuth";
import { GithubAuthProvider } from "@/app/components/GithubAuthProvider";
import RuleHeader from "@/app/components/RuleHeader";
import styles from "@/app/myss/rule.module.css";
import RuleFormClient from "@/app/components/RuleFormClient";
import { RULE_VERSION } from "@/app/constants/ruleVersion";
import NotFoundError from "@/app/components/NotFoundError";

type Props = {
  params: { ruleName: string };
  searchParams: { parentRule?: string; parentRuleId?: string; ruleKey?: string };
};

// Update page title with rule name
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ruleName } = params;
  try {
    // Get only the filename part without URL parameters and decode
    const baseRuleName = decodeURIComponent(ruleName).split("?")[0];
    const ruleData = await getRuleDataByFilepath(baseRuleName);
    return {
      title: ruleData?.title || ruleData?.label || ruleData?.name || `Linked Rule - ${baseRuleName}`,
    };
  } catch (error) {
    console.error("Error fetching rule for metadata:", error);
    return {
      title: `Linked Rule - ${decodeURIComponent(ruleName).split("?")[0]}`,
    };
  }
}

export default async function LinkedRule({ params, searchParams }: Props) {
  // Get the parent rule name and ID from search params
  const parentRuleName = searchParams.parentRule || "";
  const parentRuleId = searchParams.parentRuleId || "";
  const ruleKey = searchParams.ruleKey || "";

  // Clean the rule name - make sure to decode and remove any URL parameters
  const rawRuleName = params.ruleName;
  const decodedRuleName = decodeURIComponent(rawRuleName);
  const cleanRuleName = decodedRuleName.split("?")[0];

  // Create a safe auth path
  const safeRuleName = encodeURIComponent(cleanRuleName);
  const safeParentRule = encodeURIComponent(parentRuleName);
  const safeParentId = encodeURIComponent(parentRuleId);
  const authPath = `myss/linked/${safeRuleName}?parentRule=${safeParentRule}&parentRuleId=${safeParentId}`;

  // Add rule key if present
  let githubAuthPath = authPath;
  if (ruleKey) {
    githubAuthPath = `${authPath}&ruleKey=${encodeURIComponent(ruleKey)}`;
  }

  // Get github auth info without redirecting
  const githubAuthInfo = await getGithubAuth(githubAuthPath, false);

  // Determine version and filepath from the rule key
  let version = RULE_VERSION.inProduction;
  let filepath = cleanRuleName;

  console.log("this is rule key", ruleKey);

  // If we have a rule key, it may contain version info
  if (ruleKey) {
    const keyParts = ruleKey.split("?");
    filepath = keyParts[0]; // The filepath is always before the question mark

    // Check for version parameter
    if (keyParts.length > 1) {
      const params = new URLSearchParams(`?${keyParts[1]}`);
      const versionParam = params.get("version");
      if (versionParam === "draft") {
        version = RULE_VERSION.draft;
      }
    }
  }

  try {
    console.log(`Fetching linked rule: ${filepath}, version: ${version}`);

    // Get rule data based on version
    let ruleInfo;
    if (version === RULE_VERSION.draft) {
      const draftData = await getRuleDraftByFilepath(filepath);
      ruleInfo = draftData?.ruleData || (await getRuleDataByFilepath(filepath));
    } else {
      ruleInfo = await getRuleDataByFilepath(filepath);
    }

    // Try to get BRE rule structure
    let breRuleData = null;
    try {
      const ruleName = filepath.replace(/\.json$/, "");
      breRuleData = await getBRERuleFromName(ruleName);
      console.log("Retrieved BRE rule structure for linked rule");
    } catch (error) {
      console.warn("Could not retrieve BRE rule structure for linked rule:", error);
    }

    console.log(ruleInfo, "this is ruleinfo");

    if (!ruleInfo || !ruleInfo.name) {
      throw new Error(`Rule not found for ${filepath}`);
    }

    // Create a complete rule object if not all properties are present
    ruleInfo = {
      ...ruleInfo,
      name: ruleInfo.name || filepath,
      label: ruleInfo.label || ruleInfo.title || filepath,
      description: ruleInfo.description || "",
      rule_inputs: ruleInfo.rule_inputs || [], // Ensure this exists for the RuleFormClient
    };

    // Default empty rule content structure with just an input and output node
    let ruleContent = {
      nodes: [
        {
          id: "input",
          type: "inputNode",
          position: { x: -250, y: 0 },
          content: {
            fields: [{ field: "example", name: "Example Input", dataType: "text" }],
          },
        },
        {
          id: "output",
          type: "outputNode",
          position: { x: 250, y: 0 },
          data: { name: "output", value: JSON.stringify({ result: {} }) },
        },
      ],
      edges: [{ source: "input", target: "output", id: "edge-1" }],
    };

    // Try to load rule content
    try {
      console.log("this is filepath", filepath);
      const document = await getRuleDraftByFilepath(filepath);
      console.log(filepath, "this is document", document);
      if (document && document.content.nodes) {
        ruleContent = document.content;
        console.log("Found rule content by filepath");
      }
    } catch (err) {
      console.error("Could not get document by filepath:", err);
      console.log("Using default rule content structure");
    }

    // Render the linked rule page
    return (
      <GithubAuthProvider authInfo={githubAuthInfo}>
        <div className={styles.fullWidthWrapper}>
          <RuleHeader
            ruleInfo={{
              name: ruleInfo.name,
              label: ruleInfo.label,
              description: ruleInfo.description,
            }}
            showBackButton={true}
            backUrl={`/myss/${parentRuleName}`}
          />
          <div className={styles.rulesWrapper}>
            <div className={styles.linkedRuleInfo}>
              <p className={styles.linkedRuleText}>
                This is a linked rule <strong>{filepath}</strong> that was triggered by{" "}
                <strong>{parentRuleName}</strong>.
                {ruleKey && (
                  <span>
                    {" "}
                    Using rule key: <code>{ruleKey}</code>
                  </span>
                )}
                {version === RULE_VERSION.draft && (
                  <span>
                    {" "}
                    <strong>(Draft Version)</strong>
                  </span>
                )}
              </p>
              {!ruleContent?.nodes.some((node) => node.type === "inputNode") && (
                <p className={styles.linkedRuleWarning}>
                  <strong>Warning:</strong> This linked rule is missing proper document content. The rule exists in the
                  database but its definition couldn't be loaded.
                </p>
              )}
            </div>
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
    console.error("Error in LinkedRule component:", error);
    return (
      <NotFoundError
        title="Rule not found"
        message={`Unable to load rule '${filepath}'`}
        error={error}
        debugInfo={{
          "Rule filepath": filepath,
          "Parent rule": parentRuleName,
          "Parent rule ID": parentRuleId,
          Version: version,
        }}
      />
    );
  }
}
