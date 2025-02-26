import { render, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { updateRuleData } from "@/app/utils/api";
import RuleHeader from "./RuleHeader";

jest.mock("@/app/utils/api", () => ({
  updateRuleData: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
  usePathname() {
    return "/rule/123";
  },
}));

describe("RuleHeader - title editing", () => {
  const ruleInfoMock = { _id: "1", title: "Original Title", filepath: "filename.json" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates title on success", async () => {
    updateRuleData.mockResolvedValue({});
    const { getByLabelText, getByText } = render(<RuleHeader ruleInfo={ruleInfoMock} />);

    fireEvent.click(getByText("Original Title"));
    expect(getByLabelText("Edit title")).toBeInTheDocument();
    fireEvent.change(getByLabelText("Edit title"), { target: { value: "New Title" } });
    fireEvent.blur(getByLabelText("Edit title"));

    await waitFor(() => {
      expect(updateRuleData).toHaveBeenCalledWith("1", { title: "New Title" });
      expect(getByText("New Title")).toBeInTheDocument();
    });
  });

  it("reverts title on update failure", async () => {
    updateRuleData.mockRejectedValue(new Error("Failed to update"));
    const { getByLabelText, getByText } = render(<RuleHeader ruleInfo={ruleInfoMock} />);

    fireEvent.click(getByText("Original Title"));
    fireEvent.change(getByLabelText("Edit title"), { target: { value: "Failed Title" } });
    fireEvent.blur(getByLabelText("Edit title"));

    await waitFor(() => {
      expect(updateRuleData).toHaveBeenCalledWith("1", { title: "Failed Title" });
      expect(getByText("Original Title")).toBeInTheDocument();
    });
  });

  it("does nothing if title is unchanged", async () => {
    const { getByLabelText, getByText } = render(<RuleHeader ruleInfo={ruleInfoMock} />);
    fireEvent.click(getByText("Original Title")); // Start editing
    fireEvent.blur(getByLabelText("Edit title")); // Done editing without change
    await waitFor(() => expect(getByText("Original Title")).toBeInTheDocument());
  });
});
