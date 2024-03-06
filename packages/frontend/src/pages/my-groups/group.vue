<template>
  <MkStickyContainer>
    <template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs" /></template>
    <div class="mk-group-page">
      <transition :name="$store.state.animation ? 'zoom' : ''" mode="out-in">
        <div v-if="group" class="buttons">
          <div class="_content" style="display: flex; gap: var(--margin); flex-wrap: wrap">
            <MkButton inline @click="invite()">{{ i18n.ts.invite }}</MkButton>
            <MkButton inline @click="renameGroup()">{{ i18n.ts.rename }}</MkButton>
            <MkButton inline @click="transfer()">{{ i18n.ts.transfer }}</MkButton>
            <MkButton inline @click="deleteGroup()">{{ i18n.ts.delete }}</MkButton>
          </div>
        </div>
      </transition>

      <transition :name="$store.state.animation ? 'zoom' : ''" mode="out-in">
        <div v-if="group" class="_section members _gap">
          <div class="_content">
            <div class="users">
              <div v-for="user in users" :key="user.id" class="user _panel">
                <div class="_user_content">
                  <MkAvatar :user="user" class="avatar" :show-indicator="true" />
                  <MkA :to="`/users/${user.id}`">
                    <div class="body">
                      <MkUserName :user="user" class="name" />
                      <MkAcct :user="user" class="acct" />
                    </div>
                  </MkA>
                </div>
                <div class="action">
                  <button class="_button" @click="removeUser(user)">
                    <MkButton danger>{{ i18n.ts.remove }}</MkButton>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, onActivated, onMounted, watch } from 'vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import MkA from '@/components/global/MkA.vue';
import MkAvatar from '@/components/global/MkAvatar.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const props = withDefaults(
  defineProps<{
    groupId: {
      type: string;
      required: true;
    };
  }>(),
  {},
);

let group = $ref();
let users = $ref([]);
let headerActions = $computed(() => []);
let headerTabs = $computed(() => []);
watch(() => props.groupId, fetch);

let isFirstFetch = $ref(true);

onMounted(async () => {
  await fetch();
});

onActivated(() => {
  if (isFirstFetch) return;
  fetch();
});

definePageMetadata(
  computed(() => ({
    title: group ? group.name : i18n.ts.members,
    icon: 'ti ti-users',
  })),
);

/**
 * データ取得
 */
async function fetch() {
  os.api('users/groups/show', {
    groupId: props.groupId,
  })
    .then((_group) => {
      group = _group;
      os.api('users/show', {
        userIds: group.userIds,
      }).then((_users) => {
        users = _users;
      });
    })
    .finally(() => {
      isFirstFetch = false;
    });
}

/**
 * 招待
 */
async function invite() {
  os.selectUser().then((user) => {
    os.apiWithDialog('users/groups/invite', {
      groupId: group.id,
      userId: user.id,
    });
  });
}

/**
 * ユーザー削除
 */
async function removeUser(user) {
  os.api('users/groups/pull', {
    groupId: group.id,
    userId: user.id,
  }).then(() => {
    users = users.filter((x) => x.id !== user.id);
  });
}

/**
 * グループ名変更
 */
async function renameGroup() {
  const { canceled, result: name } = await os.inputText({
    title: i18n.groupName,
    default: group.name,
  });
  if (canceled) return;

  await os.api('users/groups/update', {
    groupId: group.id,
    name: name,
  });

  group.name = name;
}

/**
 * 譲渡
 */
async function transfer() {
  os.selectUser().then((user) => {
    os.apiWithDialog('users/groups/transfer', {
      groupId: group.id,
      userId: user.id,
    });
  });
}

/**
 * グループ削除
 */
async function deleteGroup() {
  const { canceled } = await os.confirm({
    type: 'warning',
    text: i18n.t('removeAreYouSure', { x: group.name }),
  });
  if (canceled) return;

  await os.apiWithDialog('users/groups/delete', {
    groupId: group.id,
  });
  await fetch();
}
</script>

<style lang="scss" scoped>
.mk-group-page {
  > .buttons {
    display: flex;
    gap: var(--margin);
    flex-wrap: wrap;
    margin: 1em;
  }

  > .members {
    > ._content {
      > .users {
        > .user {
          margin: 1em;
          padding: 1em;
          display: flex;
          justify-content: space-between;
          align-items: center;

          ._user_content {
            display: flex;
            align-items: center;
            gap: var(--margin);

            > .avatar {
              width: 50px;
              height: 50px;
            }

            > .body {
              flex: 1;
              padding: 8px;

              > .name {
                display: block;
                font-weight: bold;
              }

              > .acct {
                opacity: 0.5;
              }
            }

            > .actions {
              display: flex;
              gap: var(--margin);
            }
          }
        }
      }
    }
  }
}
</style>
