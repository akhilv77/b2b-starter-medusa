import { z } from "zod";

export type AdminImportCustomersType = z.infer<typeof AdminImportCustomers>;
export const AdminImportCustomers = z.object({
  customers: z.array(
    z.object({
      first_name: z.string().min(1, "First name is required"),
      last_name: z.string().min(1, "Last name is required"),
      email: z.string().email("Invalid email format"),
      company_name: z.string().optional(),
      phone: z.string().optional(),
      password: z.string().min(6, "Password must be at least 6 characters"),
    })
  ),
});

export const AdminImportCustomersParams = z.object({
  fields: z.string().optional(),
  offset: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  order: z.string().optional(),
});
