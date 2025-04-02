import type { DefaultOptionType } from "antd/es/select";
import { KlammBREField } from "@/app/types/klamm";
import { getBREFields, getBREFieldFromName } from "@/app/utils/api";
import { InputOutputField } from "./InputOutputField";

export const getFieldsFromSource = async (searchValue: string): Promise<DefaultOptionType[]> => {
  const data: KlammBREField[] = await getBREFields(searchValue);
  return data.map(({ name, label, description }) => ({
    label: `${label}${description ? `: ${description}` : ""}`, // Add the description as part of the label - will be formatted properly later
    value: name,
  }));
};

export const getInfoForField = async (value: string): Promise<Partial<InputOutputField>> => {
  // Get more information from Klamm
  const klammData: KlammBREField = await getBREFieldFromName(value);
  // Update the node with the information we want to store in the json
  const input: Partial<InputOutputField> = {};
  // Get important bits of data to store in json
  input.id = klammData.id;
  input.field = klammData.name;
  input.name = klammData.label;
  input.description = klammData.description;
  input.dataType = klammData?.data_type?.name;
  input.validationCriteria = klammData?.data_validation?.validation_criteria;
  input.validationType = klammData?.data_validation?.bre_validation_type?.value;
  // Check if data type is 'object-array'
  if (klammData?.data_type?.name === "object-array") {
    input.childFields =
      klammData?.child_fields &&
      klammData?.child_fields.map((child) => ({
        id: child.id,
        name: child.label,
        field: child.name,
        description: child.description,
        dataType: child?.bre_data_type?.name,
        validationCriteria: child?.bre_data_validation?.validation_criteria,
        validationType: child?.bre_data_validation?.bre_validation_type?.value,
      }));
  } else {
    input.childFields = [];
  }
  return input;
};

export const refreshFields = async (inputOutputFields: InputOutputField[]) => {
  return await Promise.all(
    inputOutputFields.map(async (field) => {
      if (field.field) {
        const klammData: KlammBREField = await getBREFieldFromName(field.field);
        return {
          id: klammData.id,
          field: klammData.name,
          name: klammData.label,
          description: klammData.description,
          dataType: klammData?.data_type?.name,
          validationCriteria: klammData?.data_validation?.validation_criteria,
          validationType: klammData?.data_validation?.bre_validation_type?.value,
          childFields:
            klammData?.data_type?.name === "object-array"
              ? klammData?.child_fields?.map((child) => ({
                  id: child.id,
                  name: child.label,
                  field: child.name,
                  description: child.description,
                  dataType: child?.bre_data_type?.name,
                  validationCriteria: child?.bre_data_validation?.validation_criteria,
                  validationType: child?.bre_data_validation?.bre_validation_type?.value,
                }))
              : [],
        };
      }
      return field;
    })
  );
};

const exportedFunctions = {
  getFieldsFromSource,
  getInfoForField,
  refreshFields,
};

export default exportedFunctions;
