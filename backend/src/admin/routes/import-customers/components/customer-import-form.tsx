import {
  Button,
  Textarea,
  Text,
  Table,
  Badge,
  Tabs,
  toast,
} from "@medusajs/ui";
import { useState, useRef } from "react";
import { useImportCustomers, ImportCustomerData } from "../../../hooks/api/customer-import";
import { Skeleton } from "../../../components/common/skeleton";

export function CustomerImportForm() {
  const [customers, setCustomers] = useState<ImportCustomerData[]>([]);
  const [csvText, setCsvText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    mutateAsync: importCustomers,
    isPending,
    error,
  } = useImportCustomers();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateCustomer = (customer: any, index: number): string[] => {
    const errors: string[] = [];
    
    if (!customer.first_name || customer.first_name.trim().length === 0) {
      errors.push(`Row ${index + 1}: First name is required`);
    }
    if (!customer.last_name || customer.last_name.trim().length === 0) {
      errors.push(`Row ${index + 1}: Last name is required`);
    }
    if (!customer.email || !validateEmail(customer.email)) {
      errors.push(`Row ${index + 1}: Invalid email`);
    }
    if (!customer.password || customer.password.length < 6) {
      errors.push(`Row ${index + 1}: Password must be at least 6 characters`);
    }
    
    return errors;
  };

  const parseCSV = (csvContent: string): ImportCustomerData[] => {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const firstNameIndex = headers.findIndex(h => h.includes('first_name') || h.includes('firstname'));
    const lastNameIndex = headers.findIndex(h => h.includes('last_name') || h.includes('lastname'));
    const emailIndex = headers.findIndex(h => h.includes('email'));
    const companyNameIndex = headers.findIndex(h => h.includes('company_name') || h.includes('company'));
    const phoneIndex = headers.findIndex(h => h.includes('phone'));
    const passwordIndex = headers.findIndex(h => h.includes('password'));

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      return {
        first_name: values[firstNameIndex] || '',
        last_name: values[lastNameIndex] || '',
        email: values[emailIndex] || '',
        company_name: companyNameIndex >= 0 ? values[companyNameIndex] : undefined,
        phone: phoneIndex >= 0 ? values[phoneIndex] : undefined,
        password: values[passwordIndex] || '',
      };
    });
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvText(content);
      handleCSVParse(content);
      setIsParsingFile(false);
    };
    reader.onerror = () => {
      setIsParsingFile(false);
      setValidationErrors(['Failed to read file. Please try again.']);
    };
    reader.readAsText(file);
  };

  const handleCSVParse = (csvContent?: string) => {
    const content = csvContent || csvText;
    if (!content.trim()) return;

    setIsParsingFile(true);
    try {
      const parsedCustomers = parseCSV(content);
      validateAndSetCustomers(parsedCustomers);
    } catch (error) {
      setValidationErrors(['Failed to parse CSV. Please check the format.']);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleJSONParse = () => {
    if (!jsonText.trim()) return;

    setIsParsingFile(true);
    try {
      const parsedCustomers = JSON.parse(jsonText);
      if (!Array.isArray(parsedCustomers)) {
        setValidationErrors(['JSON must be an array of customers']);
        return;
      }
      validateAndSetCustomers(parsedCustomers);
    } catch (error) {
      setValidationErrors(['Invalid JSON format']);
    } finally {
      setIsParsingFile(false);
    }
  };

  const validateAndSetCustomers = (customerList: any[]) => {
    const errors: string[] = [];
    
    customerList.forEach((customer, index) => {
      errors.push(...validateCustomer(customer, index));
    });

    setValidationErrors(errors);
    
    if (errors.length === 0) {
      setCustomers(customerList);
    }
  };

  const handleSubmit = async () => {
    if (customers.length === 0) {
      setValidationErrors(['No valid customers to import']);
      return;
    }

    try {
      const result = await importCustomers({ customers });
      
      if (result.imported > 0) {
        toast.success(
          `Successfully imported ${result.imported} customer${result.imported > 1 ? 's' : ''}${
            result.failed > 0 ? `, ${result.failed} failed` : ''
          }`
        );
      } else {
        toast.error(`Failed to import customers. ${result.failed} customers failed.`);
      }

      // Show detailed results if there are errors
      if (result.failed > 0) {
        const failedEmails = result.results
          .filter(r => !r.success)
          .map(r => r.email)
          .slice(0, 5);
        
        if (failedEmails.length > 0) {
          toast.error(
            `Failed emails: ${failedEmails.join(', ')}${
              result.failed > 5 ? ` and ${result.failed - 5} more` : ''
            }`
          );
        }
      }

      // Reset form on success
      if (result.imported > 0) {
        setCustomers([]);
        setCsvText('');
        setJsonText('');
        setValidationErrors([]);
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import customers. Please try again.");
    }
  };

  const addSampleData = () => {
    const sampleData = [
      {
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        company_name: "Acme Corp",
        phone: "+1234567890",
        password: "temppass123"
      },
      {
        first_name: "Jane",
        last_name: "Smith",
        email: "jane.smith@example.com",
        company_name: "Tech Solutions",
        phone: "+1234567891",
        password: "temppass456"
      }
    ];
    setJsonText(JSON.stringify(sampleData, null, 2));
    setCustomers(sampleData);
    setValidationErrors([]);
  };

  return (
    <div className="flex flex-col gap-y-8 max-w-7xl">
      <div className="space-y-3">
        <Text className="txt-large-plus">Import Customers</Text>
        <Text className="txt-medium text-ui-fg-subtle">
          Upload a CSV file or paste JSON data with customer information. Each customer will receive a temporary password and will be required to change it on first login.
        </Text>
      </div>

      <Tabs defaultValue="csv" className="w-full">
        <Tabs.List className="grid w-full grid-cols-2">
          <Tabs.Trigger value="csv">CSV Upload</Tabs.Trigger>
          <Tabs.Trigger value="json">JSON Data</Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="csv" className="mt-6 space-y-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <Text className="txt-compact-medium-plus">Upload CSV File</Text>
              <Text className="txt-compact-small text-ui-fg-subtle">
                Expected columns: first_name, last_name, email, company_name (optional), phone (optional), password
              </Text>
              
              {/* Enhanced File Upload Area */}
              <div className="relative">
                <div className="border-2 border-dashed border-ui-border-base rounded-lg p-8 text-center bg-ui-bg-subtle hover:bg-ui-bg-base hover:border-ui-border-strong transition-all cursor-pointer group">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 bg-ui-bg-base border border-ui-border-base rounded-full flex items-center justify-center group-hover:bg-ui-bg-field group-hover:border-ui-border-strong transition-all">
                      <svg className="w-6 h-6 text-ui-fg-subtle group-hover:text-ui-fg-base transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <Text className="txt-compact-medium-plus text-ui-fg-base">
                        Choose CSV file or drag and drop
                      </Text>
                      <Text className="txt-compact-small text-ui-fg-subtle">
                        CSV files only, up to 10MB
                      </Text>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="base"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse Files
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Text className="txt-compact-medium-plus">Or Paste CSV Content</Text>
              <div className="space-y-3">
                <Textarea
                  placeholder="first_name,last_name,email,company_name,phone,password&#10;John,Doe,john@example.com,Acme Corp,+123456789,temppass123"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="base"
                  onClick={() => handleCSVParse()}
                  isLoading={isParsingFile}
                  disabled={!csvText.trim() || isParsingFile}
                >
                  Parse CSV
                </Button>
              </div>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="json" className="mt-6 space-y-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <Text className="txt-compact-medium-plus">Paste JSON Data</Text>
              <Text className="txt-compact-small text-ui-fg-subtle">
                Array of objects with: first_name, last_name, email, company_name (optional), phone (optional), password
              </Text>
              <div className="space-y-4">
                <Textarea
                  placeholder='[{"first_name": "John", "last_name": "Doe", "email": "john@example.com", "company_name": "Acme Corp", "phone": "+123456789", "password": "temppass123"}]'
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="base"
                    onClick={handleJSONParse}
                    isLoading={isParsingFile}
                    disabled={!jsonText.trim() || isParsingFile}
                  >
                    Parse JSON
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="base"
                    onClick={addSampleData}
                    disabled={isParsingFile}
                  >
                    Add Sample Data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Tabs.Content>
      </Tabs>

      {validationErrors.length > 0 && (
        <div className="rounded-lg bg-ui-bg-base border border-ui-border-error p-6">
          <Text className="txt-medium-plus text-ui-fg-error mb-4">Validation Errors:</Text>
          <ul className="txt-compact-medium text-ui-fg-error space-y-2">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="text-ui-fg-error mr-2">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(customers.length > 0 || isParsingFile) && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            {isParsingFile ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              <Text className="txt-medium-plus">
                Preview ({customers.length} customer{customers.length > 1 ? 's' : ''})
              </Text>
            )}
          </div>
          
          <div className="rounded-md border border-ui-border-base overflow-hidden">
            <div className="overflow-x-auto">
              {isParsingFile ? (
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    {Array.from({ length: 3 }, (_, i) => (
                      <div key={i} className="flex gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell className="txt-compact-small-plus">First Name</Table.HeaderCell>
                      <Table.HeaderCell className="txt-compact-small-plus">Last Name</Table.HeaderCell>
                      <Table.HeaderCell className="txt-compact-small-plus">Email</Table.HeaderCell>
                      <Table.HeaderCell className="txt-compact-small-plus">Company</Table.HeaderCell>
                      <Table.HeaderCell className="txt-compact-small-plus">Phone</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {customers.slice(0, 10).map((customer, index) => (
                      <Table.Row key={index}>
                        <Table.Cell className="txt-compact-small">{customer.first_name}</Table.Cell>
                        <Table.Cell className="txt-compact-small">{customer.last_name}</Table.Cell>
                        <Table.Cell className="txt-compact-small">{customer.email}</Table.Cell>
                        <Table.Cell className="txt-compact-small text-ui-fg-subtle">{customer.company_name || '-'}</Table.Cell>
                        <Table.Cell className="txt-compact-small text-ui-fg-subtle">{customer.phone || '-'}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              )}
            </div>
            {!isParsingFile && customers.length > 10 && (
              <div className="p-3 bg-ui-bg-subtle text-center txt-compact-small text-ui-fg-subtle">
                ... and {customers.length - 10} more customers
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-ui-bg-base border border-ui-border-error p-6">
          <Text className="txt-medium text-ui-fg-error">
            Error: {error.message || 'Failed to import customers'}
          </Text>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-ui-border-base">
        <Button
          onClick={handleSubmit}
          isLoading={isPending}
          disabled={customers.length === 0 || validationErrors.length > 0 || isParsingFile || isPending}
          size="base"
        >
          {isPending ? 'Importing...' : `Import ${customers.length} Customer${customers.length > 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}
