import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Link } from '@/components/link'
import { getAccount, getEvent, getEventOrders } from '@/data'
import { BanknotesIcon, CalendarIcon, ChevronLeftIcon, FolderIcon, UsersIcon } from '@heroicons/react/16/solid'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  let event = await getEvent(params.id)

  return {
    title: event?.name,
  }
}

export default async function Account({ params }: { params: { id: string } }) {
  let account = await getAccount(params.id)
  let orders = await getEventOrders(params.id)

  if (!account) {
    notFound()
  }

  return (
    <>
      <div className="max-lg:hidden">
        <Link href="/accounts" className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400">
          <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
          Accounts
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="w-32 shrink-0 sm:w-64">
            <img className="aspect-[3/2] rounded-lg shadow" src={account.imgUrl} alt="" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h1 className="text-2xl/4 font-semibold text-zinc-950 sm:text-3xl dark:text-white">
                ••••{account.name.slice(account.name.length - 4, account.name.length)}
              </h1>
              <Badge color={account.status === 'On Sale' ? 'lime' : 'zinc'}>{account.status}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-10 gap-y-4 py-1.5">
              <span className="flex items-center gap-3 text-base/6 font-semibold text-zinc-800 sm:text-xl dark:text-white">
                <UsersIcon className="size-8 shrink-0 fill-zinc-400 dark:fill-zinc-500" />
                <span>{account.followers}</span>
              </span>
              <span className="flex items-center gap-3 text-base/6 font-semibold text-zinc-800 sm:text-xl dark:text-white">
                <BanknotesIcon className="size-8 shrink-0 fill-zinc-400 dark:fill-zinc-500" />
                <span>{account.price}</span>
              </span>
              <span className="flex items-center gap-3 text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white">
                <CalendarIcon className="size-4 shrink-0 fill-zinc-400 dark:fill-zinc-500" />
                <span>{account.date}</span>
              </span>
              <span className="flex items-center gap-3 text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white">
                <FolderIcon className="size-4 shrink-0 fill-zinc-400 dark:fill-zinc-500" />
                <span>{account.category}</span>
              </span>
            </div>
            <p>{account.description}</p>
          </div>
        </div>
        <div className="flex w-full gap-4">
          <Button className="w-full">Buy</Button>
        </div>
      </div>
      {/* <div className="mt-8 grid gap-8 sm:grid-cols-3">
        <Stat title="Total revenue" value={event.totalRevenue} change={event.totalRevenueChange} />
        <Stat
          title="Tickets sold"
          value={`${event.ticketsSold}/${event.ticketsAvailable}`}
          change={event.ticketsSoldChange}
        />
        <Stat title="Pageviews" value={event.pageViews} change={event.pageViewsChange} />
      </div> */}
      {/* <Subheading className="mt-12">Recent orders</Subheading> */}
      {/* <Table className="mt-4 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]">
        <TableHead>
          <TableRow>
            <TableHeader>Order number</TableHeader>
            <TableHeader>Purchase date</TableHeader>
            <TableHeader>Customer</TableHeader>
            <TableHeader className="text-right">Amount</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} href={order.url} title={`Order #${order.id}`}>
              <TableCell>{order.id}</TableCell>
              <TableCell className="text-zinc-500">{order.date}</TableCell>
              <TableCell>{order.customer.name}</TableCell>
              <TableCell className="text-right">US{order.amount.usd}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table> */}
    </>
  )
}
