import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import TabsEnterprises from '@/components/admin/TabsEnterprises'
import EnterpriseSearch from '@/components/admin/EnterpriseSearch'
import { Lock, Unlock, MapPin, Clock } from 'lucide-react'
import ActionButton from '@/components/admin/ActionButton'
import AddEnterpriseModal from '@/components/admin/AddEnterpriseModal'

async function lockEnterprise(accountId: string) {
	'use server'
	await prisma.account.update({ where: { AccountID: accountId }, data: { Status: 'Inactive' } })
	revalidatePath('/admin/enterprises')
	redirect('/admin/enterprises?status=locked')
}

async function unlockEnterprise(accountId: string) {
	'use server'
	await prisma.account.update({ where: { AccountID: accountId }, data: { Status: 'Active' } })
	revalidatePath('/admin/enterprises')
	redirect('/admin/enterprises?status=active')
}

export default async function AdminEnterprisesPage({ searchParams }: { searchParams: Promise<{ status?: string; search?: string }> }) {
	const params = await searchParams
	const tab = (params?.status || 'all') as 'all'|'active'|'locked'
	const search = params?.search?.trim() || ''

	const where: any = {}
	if (tab === 'active') where.account = { is: { Status: 'Active' } }
	if (tab === 'locked') where.account = { is: { Status: 'Inactive' } }
	if (search) {
		where.OR = [
			{ EnterpriseName: { contains: search } },
			{ PhoneNumber: { contains: search } },
			{ account: { is: { Email: { contains: search } } } },
		]
	}

	const enterprises = await prisma.enterprise.findMany({
		where,
		orderBy: { CreatedAt: 'desc' },
		select: {
			EnterpriseID: true,
			EnterpriseName: true,
			PhoneNumber: true,
			Address: true,
			OpenHours: true,
			CloseHours: true,
			CreatedAt: true,
			account: { select: { AccountID: true, Email: true, Status: true } },
		}
	})

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Enterprises</h1>
					<p className="text-slate-600 mt-1">Manage enterprise accounts and onboarding</p>
				</div>
				<AddEnterpriseModal triggerClassName="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-indigo-700 hover:bg-indigo-50" />
			</div>

			<div className="rounded-2xl border border-slate-200 bg-white p-4">
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<TabsEnterprises current={tab} search={search} />
					<EnterpriseSearch currentTab={tab} currentSearch={search} />
				</div>

				{/* Search Results Info */}
				{(search || tab !== 'all') && (
					<div className="mt-4 mb-2 text-sm text-slate-600">
						{search ? (
							<span>Found {enterprises.length} enterprise{enterprises.length !== 1 ? 's' : ''} matching "{search}"</span>
						) : (
							<span>Showing {enterprises.length} {tab} enterprise{enterprises.length !== 1 ? 's' : ''}</span>
						)}
					</div>
				)}

				<div className="mt-4 overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="text-left text-slate-500">
								<th className="py-2 pr-4">Name</th>
								<th className="py-2 pr-4">Email</th>
								<th className="py-2 pr-4">Phone</th>
								<th className="py-2 pr-4">Open/Close</th>
								<th className="py-2 pr-4">Address</th>
								<th className="py-2 pr-4">Created</th>
								<th className="py-2 pr-2 w-28">Status</th>
								<th className="py-2 pr-0 text-right w-32">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{enterprises.map((e) => (
								<tr key={e.EnterpriseID} className="hover:bg-slate-50">
									<td className="py-3 pr-4 font-medium text-slate-900">{e.EnterpriseName}</td>
									<td className="py-3 pr-4 text-slate-700">{e.account.Email}</td>
									<td className="py-3 pr-4 text-slate-700">{e.PhoneNumber}</td>
									<td className="py-3 pr-4 text-slate-700"><span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{e.OpenHours} - {e.CloseHours}</span></td>
									<td className="py-3 pr-4 text-slate-700"><span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{e.Address}</span></td>
									<td className="py-3 pr-4 text-slate-700">{formatDate(String(e.CreatedAt)).split(',')[0]}</td>
									<td className="py-3 pr-2 w-28">
										{e.account.Status === 'Active' ? (
											<span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
										) : (
											<span className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">Locked</span>
										)}
									</td>
									<td className="py-3 pr-0 text-right w-32">
										<form action={e.account.Status === 'Active' ? lockEnterprise.bind(null, e.account.AccountID) : unlockEnterprise.bind(null, e.account.AccountID)}>
											<ActionButton pendingText={e.account.Status === 'Active' ? 'Locking...' : 'Unlocking...'}>
												{e.account.Status === 'Active' ? (
													<span className="inline-flex items-center gap-1 text-rose-700"><Lock className="w-3 h-3" /> Lock</span>
												) : (
													<span className="inline-flex items-center gap-1 text-emerald-700"><Unlock className="w-3 h-3" /> Unlock</span>
												)}
											</ActionButton>
										</form>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{enterprises.length === 0 && (
						<div className="text-center text-slate-500 py-10">No enterprises</div>
					)}
				</div>
			</div>
		</div>
	)
}
