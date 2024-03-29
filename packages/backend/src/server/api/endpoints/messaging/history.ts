import { Inject, Injectable } from '@nestjs/common';
import { Brackets, IsNull } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MessagingMessage } from '@/models/entities/MessagingMessage.js';
import type { MutingsRepository, UserGroupJoiningsRepository, MessagingMessagesRepository } from '@/models/index.js';
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
    @Inject(DI.userGroupJoiningsRepository)
    private userGroupJoiningsRepository: UserGroupJoiningsRepository,
    private messagingMessageEntityService: MessagingMessageEntityService,
  ) {
    super(meta, paramDef, async (ps, me) => {
      const mute = await this.mutingsRepository.findBy({
        muterId: me.id,
      });
      const muteeIds = mute.map(m => m.muteeId);

      if (ps.isAll) {
        // 自分が所属しているグループ一覧
        const groupIds = await this.userGroupJoiningsRepository.findBy({
          userId: me.id,
        }).then(xs => xs.map(x => x.userGroupId));

        // 自分がやりとりしているユーザー一覧 ( ミュートを除外 ) ( 自分のIDを含める )
        const userIds = [
          ...((await this.messagingMessagesRepository
            .createQueryBuilder('message')
            .select('message.userId')
            .where('message.recipientId = :meId', { meId: me.id })
            .groupBy('message.userId')
            .getRawMany()
            .then(xs => xs.map(x => {
              return x.message_userId;
            })))
            .filter( userId => !muteeIds.includes(userId))),
          me.id,
        ];

        // グループから最新のメッセージを一つずつ取得 (ミュートを除外)
        const groupMessages = await this
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
          })
          .setParameters({ groupIds: groupIds, mute: muteeIds }).getMany();

        // ユーザー一覧から最新のメッセージを一つずつ取得
        const userMessages = await this
          .messagingMessagesRepository
          .createQueryBuilder('root')
          .where(qb => {
            qb.where('root.id IN (' + this.messagingMessagesRepository
          .createQueryBuilder('message')
          .where('message.userId IN (:...userIds)', { userIds: userIds })
          .andWhere('message.groupId IS NULL')
          .groupBy('message.userId')
          .select('max(message.id) as id')
          .getQuery() + ')');
          }).setParameter('userIds', userIds).getMany();

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
      }

      const groups = ps.group ? await this.userGroupJoiningsRepository.findBy({
        userId: me.id,
      }).then(xs => xs.map(x => x.userGroupId)) : [];

      if (ps.group && groups.length === 0) {
        return [];
      }

      const history: MessagingMessage[] = [];

      for (let i = 0; i < ps.limit; i++) {
        const found = ps.group
          ? history.map(m => m.groupId!)
          : history.map(m => (m.userId === me.id) ? m.recipientId! : m.userId!);

        const query = this.messagingMessagesRepository.createQueryBuilder('message')
          .orderBy('message.createdAt', 'DESC');

        if (ps.group) {
          query.where('message.groupId IN (:...groups)', { groups: groups });

          if (found.length > 0) {
            query.andWhere('message.groupId NOT IN (:...found)', { found: found });
          }
        } else {
          query.where(new Brackets(qb => {
            qb
              .where('message.userId = :userId', { userId: me.id })
              .orWhere('message.recipientId = :userId', { userId: me.id });
          }));
          query.andWhere('message.groupId IS NULL');

          if (found.length > 0) {
            query.andWhere('message.userId NOT IN (:...found)', { found: found });
            query.andWhere('message.recipientId NOT IN (:...found)', { found: found });
          }

          if (mute.length > 0) {
            query.andWhere('message.userId NOT IN (:...mute)', { mute: mute.map(m => m.muteeId) });
            query.andWhere('message.recipientId NOT IN (:...mute)', { mute: mute.map(m => m.muteeId) });
          }
        }
        const message = await query.getOne();

        if (message) {
          history.push(message);
        } else {
          break;
        }
      }

      return await Promise.all(history.map(h => this.messagingMessageEntityService.pack(h.id, me)));
    });
  }
}
