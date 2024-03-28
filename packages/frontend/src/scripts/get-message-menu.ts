import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n';
import * as os from '@/os';
import copyToClipboard from '@/scripts/copy-to-clipboard';

async function deleteMessage(messageId: string): Promise<void> {
  const { canceled } = await os.confirm({
    type: 'warning',
    text: i18n.t('deleteConfirm'),
  });

  if (canceled) return;

  os.api('messaging/messages/delete', {
    messageId,
  });
}

function togglePin(messageId: string, pin: boolean): void {
  os.apiWithDialog(
    pin ? 'messaging/messages/pin' : 'messaging/messages/unpin',
    {
      messageId,
    },
    undefined,
  );
}

export function getMessageMenu({
  message,
  isMe,
  isAdmin,
}: {
  // @ts-ignore
  message: Misskey.entities.MessagingMessage;
  isAdmin: boolean;
  isMe: boolean;
}) {
  return [
    {
      icon: 'ti ti-copy',
      text: i18n.ts.copy,
      action: () => {
        copyToClipboard(message.text);
      },
    },
    ...(isAdmin || isMe
      ? [
          message.isPinned
            ? {
                icon: 'ti ti-pinned-off',
                text: i18n.ts.unpin,
                action: () => togglePin(message.id, false),
              }
            : {
                icon: 'ti ti-pin',
                text: i18n.ts.pin,
                action: () => togglePin(message.id, true),
              },
          null,
          {
            icon: 'ti ti-trash',
            text: i18n.ts.delete,
            danger: true,
            action: () => deleteMessage(message.id),
          },
        ]
      : []),
  ].filter((x) => x !== undefined);
}
