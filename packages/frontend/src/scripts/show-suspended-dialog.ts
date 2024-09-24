import * as os from '@/os';
import { i18n } from '@/i18n';

export function showSuspendedDialog(message?: string) {
  return os.alert({
    type: 'error',
    title: i18n.ts.yourAccountSuspendedTitle,
    text: i18n.ts.yourAccountSuspendedDescription + (message ? `\n\n${message}` : ''),
  });
}
