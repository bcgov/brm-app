import dayjs from "dayjs";
import { Tag, Input, Radio, AutoComplete, InputNumber, Flex, Button, Tooltip, DatePicker, Select } from "antd";
import { MinusCircleOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { dollarFormat } from "@/app/utils/utils";
import InputStyler from "../InputStyler";
import { parseSchemaTemplate, parsePropertyName } from "../InputStyler";
import {
  InputProps,
  ChildFieldInputProps,
  ObjectArrayInputProps,
  ObjectLengthDisplayProps,
  BooleanInputProps,
  SelectInputProps,
  DateInputProps,
  TextInputProps,
  NumberInputProps,
  ReadOnlyProps,
  ReadOnlyNumberDisplayProps,
  ReadOnlyArrayDisplayProps,
} from "@/app/types/inputs";

export const DefaultInput = ({ show, field, handleValueChange }: InputProps) => {
  if (!show) return null;
  return (
    <label className="labelsmall">
      <Input onBlur={(e) => handleValueChange?.(e.target.value, field)} />
      <span className="label-text">{parsePropertyName(field)}</span>
    </label>
  );
};

export const ChildFieldInput = ({
  item,
  each,
  index,
  field,
  handleInputChange,
  scenarios,
  rawData,
  value,
}: ChildFieldInputProps) => (
  <div key={each.name}>
    {each.label}
    {InputStyler({
      value: item[each.field],
      field: `${field}[${index}].${each.field}`,
      editable: true,
      scenarios,
      rawData,
      setRawData: (newData: { [x: string]: any }) => {
        const updatedArray = [...value];
        updatedArray[index] = {
          ...updatedArray[index],
          [each.field]: newData[`${field}[${index}].${each.field}`],
        };
        handleInputChange?.(updatedArray, field);
      },
      ruleProperties: each,
    })}
  </div>
);

export const ObjectArrayInput = ({
  show,
  value,
  field,
  ruleProperties,
  handleInputChange,
  scenarios,
  rawData,
}: ObjectArrayInputProps) => {
  if (!show) return null;

  const parsedSchema = parseSchemaTemplate(field);
  const parsedPropertyName = parsedSchema?.arrayName || field;

  const customName = parsedPropertyName.charAt(0).toUpperCase() + parsedPropertyName.slice(1);
  const childFields = ruleProperties?.childFields || [];
  const childFieldMap = childFields.reduce((acc: { [x: string]: null }, field: { field: string | number }) => {
    acc[field.field] = null;
    return acc;
  }, {});

  return (
    <div>
      {handleInputChange && (
        <>
          <Button icon={<PlusCircleOutlined />} onClick={() => handleInputChange([...value, childFieldMap], field)}>
            Add
          </Button>
          <Button icon={<MinusCircleOutlined />} onClick={() => handleInputChange(value.slice(0, -1), field)}>
            Remove
          </Button>
        </>
      )}
      {value.map((item, index) => (
        <div key={`value-item-${index}`}>
          <h4>
            {customName} {index + 1}
          </h4>
          <label className="labelsmall">
            {childFields.map((each: { field: any }) => (
              <ChildFieldInput
                key={`child-field-${each.field ?? null}-${index}`}
                item={item}
                each={each}
                index={index}
                field={field}
                handleInputChange={handleInputChange}
                scenarios={scenarios}
                rawData={rawData}
                value={value}
              />
            ))}
          </label>
        </div>
      ))}
    </div>
  );
};

export const ObjectLengthDisplay = ({ show, value }: ObjectLengthDisplayProps) => {
  if (!show) return null;
  return <div>{Object.keys(value).length}</div>;
};

export const BooleanInput = ({ show, value, field, handleInputChange }: BooleanInputProps) => {
  if (!show) return null;
  return (
    <Flex gap="small" align="center" vertical>
      <label className="labelsmall">
        <Flex gap="small" align="center">
          <Radio.Group
            onChange={(e) => handleInputChange(e.target.value, field)}
            value={value === true ? true : value === false ? false : undefined}
          >
            <Flex gap="small" align="center">
              <Radio value={true}>Yes</Radio>
              <Radio value={false}>No</Radio>
            </Flex>
          </Radio.Group>
          <Tooltip title="Clear value">
            <Button
              type="dashed"
              icon={<MinusCircleOutlined />}
              size="small"
              shape="circle"
              onClick={() => handleInputChange(undefined, field)}
            />
          </Tooltip>
        </Flex>
        <span className="label-text">{parsePropertyName(field)}</span>
      </label>
    </Flex>
  );
};

export const SelectInput = ({ show, value, field, options, handleInputChange, multiple }: SelectInputProps) => {
  if (!show) return null;
  return (
    <label className="labelsmall">
      <Flex gap="small" align="center">
        <Select
          data-testid="select-container"
          id={field}
          options={options}
          defaultValue={value}
          style={{ width: 200 }}
          onChange={(val) => handleInputChange(val, field)}
          mode={multiple ? "multiple" : undefined}
        />
      </Flex>
      <span className="label-text">{parsePropertyName(field)}</span>
    </label>
  );
};

export const DateInput = ({ show, value, field, maximum, minimum, handleInputChange, handleClear }: DateInputProps) => {
  if (!show) return null;
  return (
    <label className="labelsmall">
      <Flex gap="small" align="center">
        <DatePicker
          data-testid="date-picker"
          allowClear={true}
          id={field}
          maxDate={maximum}
          minDate={minimum}
          defaultValue={value ? dayjs(value, "YYYY-MM-DD") : null}
          onChange={(val) => {
            const formattedDate = val ? val.format("YYYY-MM-DD") : null;
            handleInputChange(formattedDate, field);
          }}
          style={{ width: 200 }}
        />
      </Flex>
      <span className="label-text">{parsePropertyName(field)}</span>
    </label>
  );
};

export const ReadOnlyArrayDisplay = ({
  show,
  value,
  field,
  scenarios,
  rawData,
  setRawData,
  ruleProperties,
}: ReadOnlyArrayDisplayProps) => {
  if (!show) return null;

  const isPrimitiveArray = Array.isArray(value) && value.every((item) => typeof item !== "object" || item === null);

  if (isPrimitiveArray) {
    return (
      <Flex wrap="wrap" gap="small">
        {value.map((item, index) => {
          const stringValue = String(item);
          const isLongText = stringValue.length > 50;

          return (
            <Tag color="blue" key={index} style={{ maxWidth: "100%", whiteSpace: "normal", height: "auto" }}>
              {isLongText ? <Tooltip title={stringValue}>{`${stringValue.substring(0, 50)}...`}</Tooltip> : stringValue}
            </Tag>
          );
        })}
      </Flex>
    );
  }

  const customName = parsePropertyName(field);
  return (
    <div>
      {value.map((item, index) => (
        <div key={index}>
          <h4>
            {customName} {index + 1}
          </h4>
          {Object.entries(item).map(([key, val]) => (
            <div key={key}>
              <label className="labelsmall">
                {key}
                {InputStyler({
                  value: val,
                  field: key,
                  editable: false,
                  scenarios,
                  rawData,
                  setRawData,
                  ruleProperties,
                })}
              </label>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const ReadOnlyBooleanDisplay = ({ show, value }: ReadOnlyProps) => {
  if (!show) return null;
  return (
    <Radio.Group onChange={() => null} value={value}>
      <Radio value={true}>Yes</Radio>
      <Radio value={false}>No</Radio>
    </Radio.Group>
  );
};

export const ReadOnlyStringDisplay = ({ show, value }: ReadOnlyProps) => {
  if (!show) return null;
  const stringList = value.split(",");
  if (stringList.length > 1) {
    return (
      <>
        {stringList.map((string: string, index: number) => (
          <Tag color="blue" key={index}>
            {string.trim()}
          </Tag>
        ))}
      </>
    );
  }

  return <Tag color="blue">{value}</Tag>;
};

export const ReadOnlyNumberDisplay = ({ show, value, field }: ReadOnlyNumberDisplayProps) => {
  if (!show) return null;
  if (field.toLowerCase().includes("amount")) {
    const formattedValue = dollarFormat(value);
    return <Tag color="green">${formattedValue}</Tag>;
  }
  return <Tag color="blue">{value}</Tag>;
};

export const NumberInput = ({
  show,
  value,
  field,
  maximum,
  minimum,
  handleValueChange,
  handleInputChange,
}: NumberInputProps) => {
  if (!show) return null;
  return (
    <label className="labelsmall">
      <Flex gap={"small"} align="center">
        <InputNumber
          max={maximum}
          min={minimum}
          value={value}
          onBlur={(e) => handleValueChange(e.target.value, field)}
          onChange={(val) => handleInputChange(val, field)}
        />
        <Tooltip title="Clear value">
          <Button
            type="dashed"
            icon={<MinusCircleOutlined />}
            size="small"
            shape="circle"
            onClick={() => handleInputChange(undefined, field)}
          />
        </Tooltip>
      </Flex>
      <span className="label-text">{parsePropertyName(field)}</span>
    </label>
  );
};

export const TextInput = ({
  show,
  value,
  field,
  valuesArray,
  handleValueChange,
  handleInputChange,
  handleClear,
}: TextInputProps) => {
  if (!show) return null;
  return (
    <label className="labelsmall">
      <Flex gap={"small"} align="center">
        <AutoComplete
          id={field}
          options={valuesArray}
          defaultValue={value}
          onBlur={(e) => handleValueChange((e.target as HTMLInputElement).value, field)}
          style={{ width: 200 }}
          onChange={(val) => handleInputChange(val, field)}
        />
        <Tooltip title="Clear value">
          <Button
            type="dashed"
            icon={<MinusCircleOutlined />}
            size="small"
            shape="circle"
            onClick={() => handleClear(field)}
          />
        </Tooltip>
      </Flex>
      <span className="label-text">{parsePropertyName(field)}</span>
    </label>
  );
};
