import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/utils";
import { importCustomersWorkflow } from "../../../../workflows/customer/workflows/import-customers";
import { AdminImportCustomersType } from "./validators";

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminImportCustomersType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    const { result: importResults } = await importCustomersWorkflow.run({
      input: {
        customers: req.validatedBody.customers,
      },
      container: req.scope,
    });

    // Query the created customers to return complete data
    const customerIds = importResults
      .filter(result => result.success && result.customer)
      .map(result => result.customer!.id);

    let customers: any[] = [];
    if (customerIds.length > 0) {
      try {
        const { data } = await query.graph(
          {
            entity: "customer",
            fields: [
              "id",
              "email",
              "first_name",
              "last_name",
              "phone",
              "company_name",
              "created_at",
              "metadata",
            ],
            filters: { id: customerIds },
          },
          { throwIfKeyNotFound: false }
        );
        customers = data || [];
      } catch (error) {
        console.error("Error querying customers:", error);
        customers = [];
      }
    }

    res.json({
      imported: customerIds.length,
      failed: importResults.length - customerIds.length,
      customers,
      results: importResults,
    });
  } catch (error) {
    console.error("Error importing customers:", error);
    res.status(500).json({
      error: "Failed to import customers",
      details: error.message,
    });
  }
};
