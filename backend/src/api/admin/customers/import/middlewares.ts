import { MiddlewareRoute } from "@medusajs/framework";
import { AdminImportCustomers, AdminImportCustomersParams } from "./validators";
import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework";

export const adminCustomerImportMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/customers/import",
    middlewares: [
      validateAndTransformBody(AdminImportCustomers),
      validateAndTransformQuery(AdminImportCustomersParams, {
        defaults: [],
      }),
    ],
  },
];
