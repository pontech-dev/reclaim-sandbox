import { Badge } from '@/components/badge'
import { Divider } from '@/components/divider'
import { Heading } from '@/components/heading'
import { Input, InputGroup } from '@/components/input'
import { Link } from '@/components/link'
import { Select } from '@/components/select'
import { getSellingAccounts } from '@/data'
import { MagnifyingGlassIcon, UsersIcon } from '@heroicons/react/16/solid'
import { SellAccount } from './sellAccount'

export default async function Home() {
  let accounts = await getSellingAccounts()

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-sm:w-full sm:flex-1">
          <Heading>Buy Accounts</Heading>
          <div className="mt-4 flex max-w-xl gap-4">
            <div className="flex-1">
              <InputGroup>
                <MagnifyingGlassIcon />
                <Input name="search" placeholder="Search accounts&hellip;" />
              </InputGroup>
            </div>
            <div>
              <Select name="sort_by">
                <option value="name">Sort by name</option>
                <option value="date">Sort by date</option>
                <option value="status">Sort by status</option>
              </Select>
            </div>
          </div>
        </div>
        <SellAccount>Sell Your Account</SellAccount>
        {/* <Button>Sell Your Account</Button> */}
      </div>
      <ul className="mt-10">
        {accounts.map((account, index) => (
          <>
            <li key={account.id}>
              <Divider soft={index > 0} />
              <div className="flex items-center justify-between">
                <div key={account.id} className="flex gap-6 py-6">
                  <div className="w-32 shrink-0">
                    <Link href={`/accounts/${account.id}`} aria-hidden="true">
                      <img className="aspect-[3/2] rounded-lg shadow" src={account.imgUrl} alt="" />
                    </Link>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-base/6 font-semibold">
                      <Link href={`/accounts/${account.id}`}>{account.name}</Link>
                    </div>
                    <div className="text-xs/6 text-zinc-500">{account.date}</div>
                    <div className="flex items-center gap-3">
                      <UsersIcon className="size-4 shrink-0 fill-zinc-400 dark:fill-zinc-500" />
                      <div className="text-xs/6 text-zinc-600">{account.followers}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className="max-sm:hidden" color={account.status === 'On Sale' ? 'lime' : 'zinc'}>
                    {account.status}
                  </Badge>
                  <button>${account.price}</button>
                </div>
              </div>
            </li>
          </>
        ))}
      </ul>
    </>
  )
}
