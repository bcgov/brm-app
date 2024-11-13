import { Tooltip, Popover } from "antd";
import { InfoCircleOutlined, ArrowRightOutlined } from "@ant-design/icons";
import React from "react";

interface FieldProps {
  name: string;
  description?: string;
  field?: string;
}

export default function FieldStyler({ name, description = "", field }: FieldProps) {
  const klammLink = `${process.env.NEXT_PUBLIC_KLAMM_URL}/fields/${field}`;
  const formattedDescription = description
    ? description.split("\n").map((text, index) => (
        <p key={index} style={{ margin: "0" }}>
          {text}
        </p>
      ))
    : null;

  const descriptionLink = (
    <>
      {formattedDescription}{" "}
      <a href={klammLink} rel="noopener noreferrer" target="_blank">
        KLAMM <ArrowRightOutlined />
      </a>
    </>
  );

  const finalDescription = process.env.NEXT_PUBLIC_KLAMM_URL && field ? descriptionLink : formattedDescription;

  const popOverInformation = (
    <Popover
      placement="top"
      content={finalDescription}
      title={name}
      trigger="click"
      overlayStyle={{ maxWidth: "300px", wordWrap: "break-word" }}
    >
      <span>
        {" "}
        <InfoCircleOutlined />
      </span>
    </Popover>
  );
  const helpDialog = "View Description";
  return (
    <label htmlFor={field ? field : name}>
      {name}
      {description && (
        <Tooltip title={helpDialog} placement="top">
          {popOverInformation}
        </Tooltip>
      )}
    </label>
  );
}
