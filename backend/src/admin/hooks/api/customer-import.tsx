import { FetchError } from "@medusajs/js-sdk";
import {
  useMutation,
  UseMutationOptions,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";

export interface ImportCustomerData {
  first_name: string;
  last_name: string;
  email: string;
  company_name?: string;
  phone?: string;
  password: string;
}

export interface ImportCustomersResponse {
  imported: number;
  failed: number;
  customers?: any[];
  results: {
    success: boolean;
    customer?: any;
    error?: string;
    email: string;
  }[];
}

export const useImportCustomers = (
  options?: UseMutationOptions<
    ImportCustomersResponse,
    FetchError,
    { customers: ImportCustomerData[] }
  >
) => {
  return useMutation({
    mutationFn: ({ customers }: { customers: ImportCustomerData[] }) =>
      sdk.client.fetch<ImportCustomersResponse>(
        `/admin/customers/import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: { customers },
        }
      ),
    ...options,
  });
};
