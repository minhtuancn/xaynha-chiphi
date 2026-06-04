import { notFound } from "next/navigation";
import { getAccountDetail } from "@/actions/financial";
import { DetailViewTabs } from "@/components/detail-view-tabs";
import { AccountDetail } from "@/components/detail-views/account-detail";
import { serialize } from "@/lib/serialize";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionForm } from "@/components/forms/transaction-form";
import { getAccounts, createTransaction } from "@/actions/financial";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await getAccountDetail(id);
  if (!account) notFound();

  const accounts = await getAccounts();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{account.name}</h1>
      <DetailViewTabs
        viewTab={<AccountDetail account={serialize(account)} />}
        editTab={
          <Card>
            <CardContent className="pt-6">
              <TransactionForm
                accounts={accounts.map((a: { id: string; name: string; type: string }) => ({ id: a.id, name: a.name, type: a.type }))}
                onSubmit={createTransaction}
              />
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
