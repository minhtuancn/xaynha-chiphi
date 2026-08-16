import { notFound } from "next/navigation";
import { getAccountDetail } from "@/actions/financial";
import { DetailViewTabs } from "@/components/detail-view-tabs";
import { AccountDetail } from "@/components/detail-views/account-detail";
import { serialize } from "@/lib/serialize";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionForm } from "@/components/forms/transaction-form";
import { createTransaction } from "@/actions/financial";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await getAccountDetail(id);
  if (!account) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{account.name}</h1>
      <DetailViewTabs
        viewTab={<AccountDetail account={serialize(account)} />}
        editTab={
          <Card>
            <CardContent className="pt-6">
              <TransactionForm
                accounts={[{ id: account.id, name: account.name, type: account.type }]}
                onSubmit={createTransaction}
              />
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
