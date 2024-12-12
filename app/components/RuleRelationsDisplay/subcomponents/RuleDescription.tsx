import React from "react";
import { Button, message, Popover } from "antd";
import styles from "./RuleDescription.module.css";

interface RuleDescription {
  data: {
    label?: string;
    name: string;
    filepath?: string;
    description?: string;
    url?: string;
    isPublished?: boolean;
  };
  onClose: () => void;
  visible: boolean;
}

// Displays the description of a rule
export function RuleDescription({ data, onClose, visible }: RuleDescription) {
  if (!visible) return null;

  const handleAppLinkClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (!data.url) {
      e.preventDefault();
      return;
    }
    const baseUrl = window.location.origin;
    window.open(`${baseUrl}/rule/${data.url}`);
  };

  const handleKlammLinkClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (!data.isPublished && data.url) {
      e.preventDefault();
      message.error("Rule exists but is not published in Klamm");
      return;
    }
    const baseUrl = process.env.NEXT_PUBLIC_KLAMM_URL;
    window.open(`${baseUrl}/rules/${data.name}`, "_blank");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className={styles.popupContainer} role="dialog" aria-label="Rule details" onKeyDown={handleKeyDown}>
      <h3 className={styles.title}>{data.label || data.name}</h3>

      <div className={styles.metaInfo}>Name: {data.name}</div>
      <div className={styles.metaInfo}>Path: {data.filepath || "N/A"}</div>

      <div className={styles.description}>{data.description || "No description available"}</div>
      <Popover content={!data.url ? "Rule does not exist in application" : null} trigger="hover">
        <Button
          type="link"
          className={styles.link}
          onClick={handleAppLinkClick}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAppLinkClick(e);
            }
          }}
          tabIndex={data.url ? 0 : -1}
          role="link"
          {...(!data.url && { "aria-disabled": "true" })}
          disabled={!data.url}
        >
          View in App
        </Button>
      </Popover>
      <Popover content={!data.isPublished && data.url ? "Rule is not published in Klamm" : null} trigger="hover">
        <Button
          type="link"
          className={styles.link}
          onClick={handleKlammLinkClick}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleKlammLinkClick(e);
            }
          }}
          tabIndex={0}
          role="link"
          disabled={!data.isPublished && !!data.url}
        >
          View in Klamm
        </Button>
      </Popover>
    </div>
  );
}
