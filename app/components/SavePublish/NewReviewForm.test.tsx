import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import NewReviewForm from "./NewReviewForm";
import { generateBranchName, generateReviewMessage } from "@/app/utils/githubApi";

jest.mock("@/app/utils/githubApi", () => ({
  generateBranchName: jest.fn(),
  generateReviewMessage: jest.fn(),
}));

describe("NewReviewForm", () => {
  const mockCreateNewReview = jest.fn();
  const defaultProps = {
    filePath: "/path/to/file.json",
    createNewReview: mockCreateNewReview,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (generateBranchName as jest.Mock).mockReturnValue("generated-branch-name");
    (generateReviewMessage as jest.Mock).mockReturnValue("generated review message");
  });

  describe("Form Rendering", () => {
    test("renders all form elements", () => {
      render(<NewReviewForm {...defaultProps} />);

      expect(screen.getByLabelText(/branch name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/review description/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /submit for review/i })).toBeInTheDocument();
    });

    test("initializes with generated values", () => {
      render(<NewReviewForm {...defaultProps} />);

      expect(screen.getByLabelText(/branch name/i)).toHaveValue("generated-branch-name");
      expect(screen.getByLabelText(/review description/i)).toHaveValue("generated review message");
    });
  });


  describe("Form Submission", () => {

    test("calls utility functions with correct filepath", () => {
      render(<NewReviewForm {...defaultProps} />);

      expect(generateBranchName).toHaveBeenCalledWith("/path/to/file.json");
      expect(generateReviewMessage).toHaveBeenCalledWith(false, "/path/to/file.json");
    });
  });
});
