import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ArrowUpTray } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { CustomerImportForm } from "./components/customer-import-form";

const ImportCustomersPage = () => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-2">
          <Heading level="h2">Import Customers</Heading>
        </div>
      </div>
      <div className="p-6">
        <CustomerImportForm />
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Import Customers",
  icon: ArrowUpTray,
});

export default ImportCustomersPage;
