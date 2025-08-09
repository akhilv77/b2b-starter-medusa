import { createStep, StepResponse } from "@medusajs/workflows-sdk";
import { Modules } from "@medusajs/utils";
import { IAuthModuleService } from "@medusajs/framework/types";
import Scrypt from "scrypt-kdf";

export interface ImportCustomerData {
  first_name: string;
  last_name: string;
  email: string;
  company_name?: string;
  phone?: string;
  password: string;
}

export interface ImportCustomerResult {
  success: boolean;
  customer?: any;
  authIdentity?: any;
  error?: string;
  email: string;
}

export const importCustomersStep = createStep(
  "import-customers",
  async (
    customersData: ImportCustomerData[],
    { container }
  ) => {
    const authModuleService = container.resolve<IAuthModuleService>(Modules.AUTH);
    const customerModuleService = container.resolve(Modules.CUSTOMER);

    const results: ImportCustomerResult[] = [];

    for (const customerData of customersData) {
      try {
        const { first_name, last_name, email, company_name, phone, password } = customerData;

        // Check if customer already exists
        const existingCustomers = await customerModuleService.listCustomers({
          email: email,
        });

        if (existingCustomers.length > 0) {
          results.push({
            success: false,
            error: "Customer with this email already exists",
            email,
          });
          continue;
        }

        // 1. Create the customer first
        const customer = await customerModuleService.createCustomers({
          first_name,
          last_name,
          email,
          phone: phone || undefined,
          company_name: company_name || undefined,
          has_account: true, // Mark as registered customer with account
          metadata: {
            force_password_change: true, // Flag to force password change on first login
          },
        });

        // 2. Hash the password
        const hashConfig = { logN: 15, r: 8, p: 1 };
        const passwordHash = await Scrypt.kdf(password, hashConfig);

        // 3. Create the authentication identity
        const authIdentity = await authModuleService.createAuthIdentities({
          provider_identities: [
            {
              provider: "emailpass",
              entity_id: email,
              provider_metadata: {
                password: passwordHash.toString("base64"),
              },
            },
          ],
          app_metadata: {
            customer_id: customer.id,
          },
        });

        results.push({
          success: true,
          customer,
          authIdentity,
          email,
        });
      } catch (error) {
        console.error(`Error importing customer ${customerData.email}:`, error);
        results.push({
          success: false,
          error: error.message || "Unknown error occurred",
          email: customerData.email,
        });
      }
    }

    return new StepResponse(results);
  },
  async (results: ImportCustomerResult[], { container }) => {
    // Compensation logic - remove created customers and auth identities
    const authModuleService = container.resolve<IAuthModuleService>(Modules.AUTH);
    const customerModuleService = container.resolve(Modules.CUSTOMER);

    for (const result of results) {
      if (result.success && result.customer && result.authIdentity) {
        try {
          // Remove customer
          await customerModuleService.deleteCustomers(result.customer.id);
          
          // Remove auth identity
          await authModuleService.deleteAuthIdentities([result.authIdentity.id]);
        } catch (error) {
          console.error(`Error during compensation for ${result.email}:`, error);
        }
      }
    }
  }
);
