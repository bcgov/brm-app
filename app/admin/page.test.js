import { render, fireEvent, waitFor, screen, act } from "@testing-library/react";
import Admin from "./page";

Object.defineProperty(window, "matchMedia", {
  value: () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
  }),
});
import { getAllRuleData, updateRuleData, deleteRuleData } from "../utils/api";

jest.mock("../utils/api", () => ({
  getAllRuleData: jest.fn(),
  updateRuleData: jest.fn(),
  deleteRuleData: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

describe("Admin Page", () => {
  const mockRules = [
    { _id: "1", title: "Rule 1", filepath: "path/1.json", isPublished: true },
    { _id: "2", title: "Rule 2", filepath: "path/2.json", isPublished: false },
  ];

  beforeEach(() => {
    getAllRuleData.mockResolvedValue({ data: mockRules, total: 2 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("loads and displays rules", async () => {
    await act(async () => {
      render(<Admin />);
    });

    await act(async () => {
      await waitFor(() => {
        const inputs = screen.getAllByLabelText("Enter title");
        expect(inputs[0].value).toBe("Rule 1");
        expect(inputs[1].value).toBe("Rule 2");
      });
    });
  });

  it("handles search functionality", async () => {
    await act(async () => {
      render(<Admin />);
    });

    await act(async () => {
      await waitFor(() => expect(screen.getByDisplayValue("Rule 1")).toBeInTheDocument());

      const searchInput = screen.getByRole("searchbox");
      fireEvent.change(searchInput, { target: { value: "Rule 1" } });
      const searchButton = screen.getByRole("button", { name: /search/i });
      fireEvent.click(searchButton);
    });

    await waitFor(() => {
      expect(getAllRuleData).toHaveBeenCalledWith(
        expect.objectContaining({
          searchTerm: "Rule 1",
          page: 1,
          pageSize: 15,
        })
      );
    });
  });

  it("handles rule updates", async () => {
    await act(async () => {
      render(<Admin />);
    });
    await waitFor(() => {
      const titleInputs = screen.getAllByLabelText("Enter title");
      expect(titleInputs[0]).toBeInTheDocument();
    });

    const titleInputs = screen.getAllByLabelText("Enter title");
    fireEvent.change(titleInputs[0], { target: { value: "Updated Rule 1" } });

    const saveButton = screen.getByText("Save Changes");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateRuleData).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({
          title: "Updated Rule 1",
        })
      );
    });
  });

  it("handles rule deletion for unpublished rules", async () => {
    await act(async () => {
      render(<Admin />);
    });
    await waitFor(() => expect(screen.getByDisplayValue("Rule 2")).toBeInTheDocument());

    const deleteButtons = screen.getAllByText("Delete Rule");
    fireEvent.click(deleteButtons[0]);

    const saveButton = screen.getByText("Save Changes");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(deleteRuleData).toHaveBeenCalledWith("2");
    });
  });

  it("shows reset draft button for published rules", async () => {
    await act(async () => {
      render(<Admin />);
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue("Rule 1")).toBeInTheDocument();
      const resetButtons = screen.getAllByText("Reset Draft");
      expect(resetButtons.length).toBe(1);
    });
  });

  it("handles API errors gracefully", async () => {
    getAllRuleData.mockRejectedValueOnce(new Error("API Error"));
    console.log = jest.fn();

    await act(async () => {
      render(<Admin />);
    });
    await waitFor(() => {
      expect(console.log).toHaveBeenCalled();
    });
  });
});
