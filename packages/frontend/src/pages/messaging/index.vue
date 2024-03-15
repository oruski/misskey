<template>
  <MkStickyContainer>
    <template #header>
      <MkPageHeader :actions="headerActions" :tabs="headerTabs" />
    </template>
    <MkSpacer :content-max="800">
      <div class="yweeujhr">
        <div class="buttons">
          <MkButton primary class="start" @click="start"><i class="ti ti-plus"></i> {{ $ts.startMessaging }}</MkButton>
          <MkButton primary class="start" @click="gotoGroup"><i class="ti ti-users"></i> {{ $ts.groups }}</MkButton>
        </div>

        <div v-if="messages.length > 0" class="history">
          <MkA
            v-for="(message, i) in messages"
            :key="message.id"
            v-anim="i"
            class="message _panel"
            :class="{ isMe: isMe(message), isRead: message.groupId ? message.reads.includes($i.id) : message.isRead }"
            :to="
              message.groupId
                ? `/my/messaging/group/${message.groupId}`
                : `/my/messaging/${getAcct(isMe(message) ? message.recipient : message.user)}`
            "
            :data-index="i"
          >
            <div>
              <MkAvatar
                class="avatar"
                :user="message.groupId ? message.user : isMe(message) ? message.recipient : message.user"
                indicator
                link
                preview
              />
              <header v-if="message.groupId">
                <span class="name">{{ message.group.name }}</span>
                <MkTime :time="message.createdAt" class="time" />
              </header>
              <header v-else>
                <span class="name"><MkUserName :user="isMe(message) ? message.recipient : message.user" /></span>
                <span class="username">@{{ acct(isMe(message) ? message.recipient : message.user) }}</span>
                <MkTime :time="message.createdAt" class="time" />
              </header>
              <div class="body">
                <p class="text">
                  <span v-if="isMe(message)" class="me">{{ $ts.you }}:</span>{{ message.text }}
                </p>
              </div>
            </div>
          </MkA>
        </div>
        <div v-if="!fetching && messages.length == 0" class="_fullinfo">
          <img src="/assets/error.png" class="_ghost" />
          <div>{{ $ts.noHistory }}</div>
        </div>
        <MkLoading v-if="fetching" />
      </div>
    </MkSpacer>
  </MkStickyContainer>
</template>

<script lang="ts" setup>
import { markRaw, onActivated, onDeactivated, onMounted, onUnmounted } from 'vue';
import { acct as Acct } from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import { acct } from '@/filters/user';
import * as os from '@/os';
import { stream } from '@/stream';
import { useRouter } from '@/router';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { $i } from '@/account';

const router = useRouter();

let fetching = $ref(true);
let messages = $ref([]);
let connection = $ref(null);
const getAcct = Acct.toString;
let isFirstLoad = $ref(true);

/**
 * 自分
 * @param message
 */
function isMe(message) {
  // @ts-ignore
  return message.userId === $i.id;
}

/**
 * メッセージ受信
 */
function onMessage(message) {
  if (message.recipientId) {
    messages = messages.filter(
      (m) =>
        !(
          // @ts-ignore
          (
            (m.recipientId === message.recipientId && m.userId === message.userId) ||
            // @ts-ignore
            (m.recipientId === message.userId && m.userId === message.recipientId)
          )
        ),
    );

    // @ts-ignore
    messages.unshift(message);
  } else if (message.groupId) {
    // @ts-ignore
    messages = messages.filter((m) => m.groupId !== message.groupId);
    // @ts-ignore
    messages.unshift(message);
  }
}

/**
 * 既読フラグ
 */
function onRead(ids) {
  for (const id of ids) {
    // @ts-ignore
    const found = messages.find((m) => m.id === id);
    if (found) {
      // @ts-ignore
      if (found.recipientId) {
        // @ts-ignore
        found.isRead = true;
        // @ts-ignore
      } else if (found.groupId) {
        // @ts-ignore
        found.reads.push($i.id);
      }
    }
  }
}

/**
 * チャット開始ポップアップ
 */
function start(ev) {
  os.popupMenu(
    [
      {
        text: i18n.ts.messagingWithUser,
        icon: 'ti ti-user',
        action: () => {
          startUser();
        },
      },
      {
        text: i18n.ts.messagingWithGroup,
        icon: 'ti ti-users',
        action: () => {
          startGroup();
        },
      },
    ],
    ev.currentTarget ?? ev.target,
  );
}

/**
 * グループに遷移
 */
function gotoGroup() {
  router.push('/my/groups');
}

/**
 * ユーザーチャットを開始
 */
async function startUser() {
  os.selectUser().then((user) => {
    // @ts-ignore
    router.push(`/my/messaging/${Acct.toString(user)}`);
  });
}

/**
 * グループチャットを開始
 */
async function startGroup() {
  const groups1 = await os.api('users/groups/owned');
  const groups2 = await os.api('users/groups/joined');
  if (groups1.length === 0 && groups2.length === 0) {
    os.alert({
      type: 'warning',
      title: i18n.ts.youHaveNoGroups,
      text: i18n.ts.joinOrCreateGroup,
    });
    return;
  }
  const { canceled, result: group } = await os.select({
    title: i18n.ts.group,
    items: groups1.concat(groups2).map((group) => ({
      value: group,
      text: group.name,
    })),
  });
  if (canceled) return;
  router.push(`/my/messaging/group/${group.id}`);
}

/**
 * 通信開始
 */
function attach() {
  console.debug('[chat index] attach');

  // @ts-ignore
  if (connection) connection.dispose();

  // @ts-ignore
  connection = markRaw(stream.useChannel('messagingIndex'));

  // @ts-ignore
  connection.on('message', onMessage);
  // @ts-ignore
  connection.on('read', onRead);

  os.api('messaging/history', { group: false }).then((userMessages) => {
    os.api('messaging/history', { group: true })
      .then((groupMessages) => {
        const _messages = userMessages.concat(groupMessages);
        _messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        messages = _messages;
        fetching = false;
      })
      .finally(() => {
        isFirstLoad = false;
      });
  });
}

/**
 * 通信終了
 */
function detach() {
  console.debug('[chat index] detach');
  // @ts-ignore
  if (connection) connection.dispose();
}

onMounted(() => {
  attach();
});

onUnmounted(() => {
  detach();
});

onActivated(() => {
  if (isFirstLoad) return;
  attach();
});

onDeactivated(() => {
  detach();
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
  title: i18n.ts.messaging,
  icon: 'ti ti-messages',
});
</script>

<style lang="scss" scoped>
.yweeujhr {
  > .buttons {
    display: flex;
    justify-content: center;
    margin: var(--margin) 0;
    gap: var(--margin);
  }

  > .start {
    margin: 0 auto var(--margin) auto;
  }

  > .history {
    > .message {
      display: block;
      text-decoration: none;
      margin-bottom: var(--margin);

      * {
        pointer-events: none;
        user-select: none;
      }

      &:hover {
        .avatar {
          filter: saturate(200%);
        }
      }

      &:active {
      }

      &.isRead,
      &.isMe {
        opacity: 0.8;
      }

      &:not(.isMe):not(.isRead) {
        > div {
          // @ts-ignore
          background-image: url('/client-assets/unread.svg');
          background-repeat: no-repeat;
          background-position: 0 center;
        }
      }

      &:after {
        content: '';
        display: block;
        clear: both;
      }

      > div {
        padding: 20px 30px;

        &:after {
          content: '';
          display: block;
          clear: both;
        }

        > header {
          display: flex;
          align-items: center;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;

          > .name {
            margin: 0;
            padding: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 1em;
            font-weight: bold;
            transition: all 0.1s ease;
          }

          > .username {
            margin: 0 8px;
          }

          > .time {
            margin: 0 0 0 auto;
          }
        }

        > .avatar {
          float: left;
          width: 54px;
          height: 54px;
          margin: 0 16px 0 0;
          border-radius: 8px;
          transition: all 0.1s ease;
        }

        > .body {
          > .text {
            display: block;
            margin: 0 0 0 0;
            padding: 0;
            overflow: hidden;
            overflow-wrap: break-word;
            font-size: 1.1em;
            color: var(--faceText);

            .me {
              opacity: 0.7;
            }
          }

          > .image {
            display: block;
            max-width: 100%;
            max-height: 512px;
          }
        }
      }
    }
  }
}

@container (max-width: 400px) {
  .yweeujhr {
    > .history {
      > .message {
        &:not(.isMe):not(.isRead) {
          > div {
            background-image: none;
            border-left: solid 4px #3aa2dc;
          }
        }

        > div {
          padding: 16px;
          font-size: 0.9em;

          > .avatar {
            margin: 0 12px 0 0;
          }
        }
      }
    }
  }
}
</style>
