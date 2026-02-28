'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'

export default function InviteUserPage() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, display_name: displayName }),
    })
    const json = await res.json()

    if (!res.ok) {
      toast.error(json.error ?? 'Failed to invite user')
      setLoading(false)
      return
    }

    setSent(true)
    toast.success(`Invitation sent to ${email}`)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="max-w-md">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-green-700 font-medium">Invitation sent!</p>
            <p className="text-sm text-gray-500">{email} will receive an email to set up their account.</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => { setSent(false); setEmail(''); setDisplayName('') }}>Invite another</Button>
              <Button variant="outline" asChild><Link href="/admin/users">Back to users</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md">
      <Card>
        <CardHeader><CardTitle>Invite User</CardTitle></CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="John Smith" />
            </div>
            <div className="space-y-2">
              <Label>Email Address <span className="text-red-500">*</span></Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="john@company.com" />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send Invitation'}</Button>
            <Button type="button" variant="outline" asChild><Link href="/admin/users">Cancel</Link></Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
