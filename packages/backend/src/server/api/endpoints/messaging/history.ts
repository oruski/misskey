import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type {
  MutingsRepository,
  UserGroupJoiningsRepository,
  MessagingMessagesRepository,
  BlockingsRepository,
} from '@/models/index.js';
import { MessagingMessageEntityService } from '@/core/entities/MessagingMessageEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
  tags: ['messaging'],

  requireCredential: true,

  kind: 'read:messaging',

  res: {
    type: 'array',
    optional: false, nullable: false,
    items: {
      type: 'object',
      optional: false, nullable: false,
      ref: 'MessagingMessage',
    },
  },
} as const;

export const paramDef = {
  type: 'object',
  properties: {
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
    group: { type: 'boolean', default: false },
    isAll: { type: 'boolean', default: false },
  },
  required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
  constructor(
    @Inject(DI.messagingMessagesRepository)
    private messagingMessagesRepository: MessagingMessagesRepository,
    @Inject(DI.mutingsRepository)
    private mutingsRepository: MutingsRepository,
    @Inject(DI.blockingsRepository)
    private blockingsRepository: BlockingsRepository,
    @Inject(DI.userGroupJoiningsRepository)
    private userGroupJoiningsRepository: UserGroupJoiningsRepository,
    private messagingMessageEntityService: MessagingMessageEntityService,
  ) {
    super(meta, paramDef, async (ps, me) => {
      const mute = await this.mutingsRepository.findBy({
        muterId: me.id,
      });
      const muteeIds = mute.map(m => m.muteeId);

      const block = await this.blockingsRepository.findBy({
        blockerId: me.id,
      });
      const blockeeIds = block.map(m => m.blockeeId);

      // 自分が所属しているグループ一覧
      const groupIds = await this.userGroupJoiningsRepository.findBy({
        userId: me.id,
      }).then(xs => xs.map(x => x.userGroupId));

      // グループから最新のメッセージを一つずつ取得 (ミュートを除外)
      const groupMessages = groupIds.length ? await this
        .messagingMessagesRepository
        .createQueryBuilder('root')
        .where(qb => {
          qb.where('root.id IN (' + this.messagingMessagesRepository
            .createQueryBuilder('message')
            .where('message.groupId IN (:...groupIds)', { groupIds: groupIds })
            .groupBy('message.groupId')
            .select('max(message.id) as id').getQuery() + ')');
          if (muteeIds.length > 0) {
            qb.andWhere('root.userId NOT IN (:...mute)', { mute: muteeIds });
          }
          if (blockeeIds.length > 0) {
            qb.andWhere('root.userId NOT IN (:...block)', { block: blockeeIds });
          }
        })
        .setParameters({ groupIds: groupIds, mute: muteeIds, block: blockeeIds }).getMany() : [];

      // ユーザー一覧から最新のメッセージを一つずつ取得
      const userMessages = await this
        .messagingMessagesRepository
        .createQueryBuilder('root')
        .where(qb => {
          qb.where('root.id IN (' + this.messagingMessagesRepository
            .createQueryBuilder('message')
            .where(new Brackets(qb => {
              qb.where(new Brackets(qb => {
                // 他人が送信したメッセージ
                qb.where('message.recipientId = :meId', { meId: me.id });

                if (muteeIds.length > 0) {
                  qb.andWhere('message.userId NOT IN (:...mute)', { mute: muteeIds });
                }

                if (blockeeIds.length > 0) {
                  qb.andWhere('message.userId NOT IN (:...block)', { block: blockeeIds });
                }
              })).orWhere(new Brackets(qb => {
                // 自分が送信したメッセージ
                qb.where('message.userId = :meId', { meId: me.id });

                if (muteeIds.length > 0) {
                  qb.andWhere('message.recipientId NOT IN (:...mute)', { mute: muteeIds });
                }

                if (blockeeIds.length > 0) {
                  qb.andWhere('message.recipientId NOT IN (:...block)', { block: blockeeIds });
                }
              }));
            }))
            .andWhere(
              // 期間を一ヶ月前までに絞る
              'message.createdAt > :monthAgo',
              { monthAgo: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
            )
            .andWhere('message.groupId IS NULL')
            .groupBy('message.userId, message.recipientId')
            .select('max(message.id) as id')
            .getQuery() + ')');
        }).setParameters({
          meId: me.id,
          mute: muteeIds,
          block: blockeeIds,
          monthAgo: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        }).getMany();

      const messages = Array.from(new Map([
        ...groupMessages,
        ...Array.from(new Map(userMessages
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map(m => [[m.userId, m.recipientId].sort().join(), m])).values()),
      ].map(m => [m.id, m])).values());

      return Promise.all(
        messages
          .map(h => this.messagingMessageEntityService.pack(h.id, me)),
      );
    });
  }
}
