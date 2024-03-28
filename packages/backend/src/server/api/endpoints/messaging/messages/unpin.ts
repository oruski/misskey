import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MessagingMessagesRepository } from '@/models/index.js';
import { MessagingService } from '@/core/MessagingService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
  tags: ['messaging'],

  requireCredential: true,

  kind: 'write:messaging',

  limit: {
    duration: ms('1hour'),
    max: 300,
  },

  errors: {
    noSuchMessage: {
      message: 'No such message.',
      code: 'NO_SUCH_MESSAGE',
      id: '86d56a2f-a9c3-4afb-b13c-3e9bfef9aa14',
    },
  },
} as const;

export const paramDef = {
  type: 'object',
  properties: {
    messageId: { type: 'string', format: 'misskey:id' },
  },
  required: ['messageId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
  constructor(
    @Inject(DI.messagingMessagesRepository)
    private messagingMessagesRepository: MessagingMessagesRepository,
    private messagingService: MessagingService,
  ) {
    super(meta, paramDef, async (ps, me) => {
      const message = await this.messagingMessagesRepository.findOne({
        where: { id: ps.messageId },
        relations: { group: true },
      });

      if (message == null) {
        throw new ApiError(meta.errors.noSuchMessage);
      }

      if (message.recipientId) {
        await this.messagingService.pinUserMessagingMessage({
          userId: me.id,
          messageId: message.id,
          state: false,
        }).catch(err => {
          if (err.id === 'e140a4bf-49ce-4fb6-b67c-b78dadf6b52f') throw new ApiError(meta.errors.noSuchMessage);
          throw err;
        });
      } else if (message.groupId) {
        await this.messagingService.pinGroupMessagingMessage({
          userId: me.id,
          groupId: message.groupId,
          messageId: message.id,
          state: false,
        }).catch(err => {
          if (err.id === '930a270c-714a-46b2-b776-ad27276dc569') throw new ApiError(meta.errors.noSuchMessage);
          throw err;
        });
      }
    });
  }
}
