import { backendData } from '@/lib/backend';
import type { ConversationSummary } from '@/lib/types';
import { CompanionChat } from '@/components/companion-chat';
import { ConversationDrawer } from '@/components/conversation-drawer';

export default async function CompanionPage({
  searchParams,
}: {
  searchParams?: Promise<{ c?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const conversations = await backendData<ConversationSummary[]>('/v1/ai/conversations').catch(
    () => [] as ConversationSummary[],
  );

  let initialMessages: import('@/lib/types').ChatMessage[] = [];
  let conversationId: string | undefined;
  if (sp.c) {
    try {
      const conv = await backendData<{ id: string; messages: import('@/lib/types').ChatMessage[] }>(
        `/v1/ai/conversations/${sp.c}`,
      );
      conversationId = conv.id;
      initialMessages = conv.messages;
    } catch {
      // fall through to fresh
    }
  }

  return (
    <div className="flex">
      <ConversationDrawer initial={conversations} activeId={conversationId} />
      <div className="flex-1 min-w-0">
        <CompanionChat key={conversationId ?? 'new'} conversationId={conversationId} initialMessages={initialMessages} />
      </div>
    </div>
  );
}
