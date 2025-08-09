import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/workflows-sdk";
import { importCustomersStep } from "../steps/import-customers";

export type ImportCustomersWorkflowInput = {
  customers: {
    first_name: string;
    last_name: string;
    email: string;
    company_name?: string;
    phone?: string;
    password: string;
  }[];
};

export type ImportCustomersWorkflowOutput = {
  success: boolean;
  customer?: any;
  error?: string;
  email: string;
}[];

export const importCustomersWorkflow = createWorkflow(
  "import-customers",
  function (input: ImportCustomersWorkflowInput) {
    const results = importCustomersStep(input.customers);

    return new WorkflowResponse(results);
  }
);
