import axios from "axios";

// Function to log the error on the backend so we can see it in the logs
function logErrorToAPI(error: string, errorInfo?: any): void {
  axios
    .post("/api/logError", {
      error,
      errorInfo,
    })
    .then((response) => {
      console.log("Error logged:", error);
    })
    .catch((err: Error) => {
      console.error("Failed to log error:", err);
    });
}

// Universal function to log the error
export async function logError(error: string, errorInfo?: any) {
  // logErrorToAPI only when client side error (server side errors already visible)
  if (typeof window !== "undefined") {
    logErrorToAPI(error, errorInfo);
  }
  console.error(error, errorInfo?.message);
}
