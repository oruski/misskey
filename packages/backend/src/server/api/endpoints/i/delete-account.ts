import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import type {
  UsersRepository,
  UserProfilesRepository,
  User,
  FollowingsRepository,
  NotificationsRepository,
} from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DeleteAccountService } from '@/core/DeleteAccountService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { UserSuspendService } from '@/core/UserSuspendService.js';
import { bindThis } from '@/decorators.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { ApiError } from '@/server/api/error.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';

export const meta = {
  requireCredential: true,

  secure: true,
} as const;

export const paramDef = {
  type: 'object',
  properties: {
    password: { type: 'string' },
  },
  required: ['password'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
  constructor(
    @Inject(DI.usersRepository)
    private usersRepository: UsersRepository,
    @Inject(DI.userProfilesRepository)
    private userProfilesRepository: UserProfilesRepository,
    @Inject(DI.notificationsRepository)
    private notificationsRepository: NotificationsRepository,
    @Inject(DI.followingsRepository)
    private followingsRepository: FollowingsRepository,
    private roleService: RoleService,
    private userSuspendService: UserSuspendService,
    private deleteAccountService: DeleteAccountService,
    private userFollowingService: UserFollowingService,
    private userEntityService: UserEntityService,
    private globalEventService: GlobalEventService,
  ) {
    super(meta, paramDef, async (ps, me) => {
      const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

      // Compare password
      const same = await bcrypt.compare(ps.password, profile.password!);

      if (!same) {
        throw new ApiError({
          message: 'Incorrect password',
          id: '0689b653-39e8-4a8d-b569-9087c94ac3fc',
          code: 'INCORRECT_PASSWORD',
        });
      }

      // ロールの取得
      const policies = await this.roleService.getUserPolicies(me.id);
      const isSuspendUponAccountDeletion = policies.suspendUponAccountDeletion;

      // suspendUponAccountDeletionポリシーがある場合、削除時に凍結を行う
      if (isSuspendUponAccountDeletion) {
        await this.userProfilesRepository.update({ userId: me.id }, {
          suspendedReason: 'Account deleted',
        });

        await this.usersRepository.update(me.id, {
          isSuspended: true,
        });

        // Terminate streaming
        if (this.userEntityService.isLocalUser(me)) {
          this.globalEventService.publishUserEvent(me.id, 'terminate', {});
        }

        await this.userSuspendService.doPostSuspend(me).catch(e => {
        });
        await this.readAllNotify(me).catch(e => {
        });
        await this.unFollowAll(me).catch(e => {
        });
        return;
      }
      await this.deleteAccountService.deleteAccount(me);
    });
  }

  /**
   * フォローしているユーザーを全てアンフォローする
   */
  @bindThis
  private async unFollowAll(follower: User) {
    const followings = await this.followingsRepository.findBy({
      followerId: follower.id,
    });

    for (const following of followings) {
      const followee = await this.usersRepository.findOneBy({
        id: following.followeeId,
      });

      if (followee == null) {
        throw `Cant find followee ${following.followeeId}`;
      }

      await this.userFollowingService.unfollow(follower, followee, true);
    }
  }

  /**
   * 通知を全て既読にする
   */
  @bindThis
  private async readAllNotify(notifier: User) {
    await this.notificationsRepository.update({
      notifierId: notifier.id,
      isRead: false,
    }, {
      isRead: true,
    });
  }
}
