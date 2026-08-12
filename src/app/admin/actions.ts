'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireOfficer } from '@/auth/require-officer'
import { getWriteClient } from '@/sanity/lib/write-client'

const ADMIN_WRITE_CHECK_ID = 'adminWriteCheck'

/** The only input this phase accepts. Kept local — this is not a framework. */
const writeCheckSchema = z.object({
  note: z
    .string()
    .trim()
    .min(1, 'Add a short note.')
    .max(80, 'Keep the note under 80 characters.'),
})

export type WriteCheckResult =
  | { status: 'ok'; note: string; checkedAt: string }
  | { status: 'error'; message: string }

/**
 * End-to-end proof of the secure write path:
 * browser → Server Action → requireOfficer() → Zod → server-only write client
 * → Sanity Content Lake.
 *
 * It authorizes itself. A Server Action is its own entry point, reachable by a
 * direct POST, so the `/admin` page check does not protect it.
 *
 * The write targets a diagnostic singleton, never real club content.
 */
export async function runWriteCheck(
  _previous: WriteCheckResult | null,
  formData: FormData,
): Promise<WriteCheckResult> {
  const officer = await requireOfficer({ capability: 'content:write' })

  const parsed = writeCheckSchema.safeParse({ note: formData.get('note') })
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const checkedAt = new Date().toISOString()

  try {
    await getWriteClient()
      .createOrReplace({
        _id: ADMIN_WRITE_CHECK_ID,
        _type: 'adminWriteCheck',
        note: parsed.data.note,
        lastCheckedAt: checkedAt,
        lastCheckedBy: officer.userId,
      })

    revalidatePath('/admin')
    return { status: 'ok', note: parsed.data.note, checkedAt }
  } catch {
    // Never surface the underlying Sanity error: it can echo request details.
    return { status: 'error', message: 'The write to Sanity failed. Check the server logs.' }
  }
}
