import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n';
import * as os from '@/os';
import copyToClipboard from '@/scripts/copy-to-clipboard';

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
  async function deleteMessage(): Promise<void> {
    const { canceled } = await os.confirm({
      type: 'warning',
      text: i18n.t('deleteConfirm'),
    });

    if (canceled) return;

    os.api('messaging/messages/delete', {
      messageId: message.id,
    });
  }

  function togglePin(pin: boolean): void {
    os.apiWithDialog(
      pin ? 'messaging/messages/pin' : 'messaging/messages/unpin',
      {
        messageId: message.id,
      },
      undefined,
    );
  }

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
          {
            icon: 'ti ti-pin',
            text: i18n.ts.pin,
            action: () => togglePin(true),
          },
          {
            icon: 'ti ti-pinned-off',
            text: i18n.ts.unpin,
            action: () => togglePin(false),
          },
          null,
          {
            icon: 'ti ti-trash',
            text: i18n.ts.delete,
            danger: true,
            action: deleteMessage,
          },
        ]
      : []),
  ].filter((x) => x !== undefined);
}
