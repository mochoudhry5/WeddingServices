import { Invoice } from "@/lib/stripe";
import { FileText } from "lucide-react";
import { FC } from "react";

interface InvoicesSectionProps {
  invoices: Invoice[];
}

const InvoicesSection: FC<InvoicesSectionProps> = ({ invoices }) => {
  if (invoices.length === 0) return null;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "open":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  return (
    <div className="mb-8">
      <div className="border rounded-lg overflow-hidden">
        <div className="flex justify-between items-center py-4 px-6">
          <h3 className="text-lg font-medium">Billing History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-sm">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500"
                >
                  Invoice Number
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500"
                >
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="text-sm">
                  <td className="whitespace-nowrap px-6 py-4">
                    {invoice.number}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {new Date(invoice.created).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    ${invoice.amount_paid.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusStyle(
                        invoice.status
                      )}`}
                    >
                      {invoice.status.charAt(0).toUpperCase() +
                        invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <a
                      href={invoice.hosted_invoice_url}
                      className="inline-block text-gray-500 hover:text-gray-700"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="h-5 w-5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoicesSection;
