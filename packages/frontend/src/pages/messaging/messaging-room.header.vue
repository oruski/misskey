<template>
  <div v-if="show" ref="el" :class="[$style.root]" :style="{ background: bg }">
    <div :class="$style.upper">
      <template v-if="metadata">
        <div :class="$style.titleContainer" @click="scrollToBottom">
          <div :class="$style.title">
            <i v-if="metadata.icon" :class="[$style.titleIcon, metadata.icon]"></i>
            <template v-if="metadata.userName">
              <div :class="$style.nameContainer">
                <MkAvatar v-if="metadata.avatar" :user="metadata.avatar" :class="$style.avatar" indicator />
                <MkUserName :user="metadata.userName" />
              </div>
            </template>
            <template v-else-if="metadata.title">
              <div>
                {{ metadata.title }}
              </div>
            </template>
          </div>
        </div>
      </template>

      <template v-if="props.groupUsers?.length">
        <div :class="$style.buttonsRight">
          <button
            ref="buttonEl"
            class="_button"
            :class="$style.button"
            @click.stop="actionHandler"
            @touchstart="preventDrag"
          >
            <I18n :src="i18n.ts.onlineUsersCount" text-tag="span" class="text">
              <template #n>
                <b>{{ props.onlineUserCount }}</b>
              </template>
            </I18n>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, inject, shallowRef, defineAsyncComponent, onDeactivated } from 'vue';
import tinycolor from 'tinycolor2';
import { scrollToBottomForWindow } from '@/scripts/scroll';
import { globalEvents } from '@/events';
import { injectPageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import * as os from '@/os';

const props = withDefaults(
  defineProps<{
    onlineUserCount?: number;
    groupUsers?: string[];
    groupOwnerId?: string;
    actions?: {
      text: string;
      icon: string;
      highlighted?: boolean;
      handler: (ev: MouseEvent) => void;
    }[];
    displayMyAvatar?: boolean;
  }>(),
  {
    onlineUserCount: 0,
    // @ts-ignore
    groupUsers: [] as unknown as string[],
  },
);

const emit = defineEmits<{
  (ev: 'update:tab', key: string);
}>();

const metadata = injectPageMetadata();

const hideTitle = inject('shouldOmitHeaderTitle', false);

let el = $shallowRef<HTMLElement | undefined>(undefined);
const bg = ref<string | undefined>(undefined);
const show = $computed(() => {
  return !hideTitle;
});
let buttonEl = shallowRef<HTMLElement | undefined>(undefined);
let showing = $ref(false);
let popupModal = $ref(undefined);

const actionHandler: (ev: MouseEvent) => void = async () => {
  showing = !showing;

  if (!showing) {
    if (popupModal) {
      // @ts-ignore
      (await popupModal).dispose();
      popupModal = undefined;
    }
    return;
  }

  // @ts-ignore
  popupModal = os.popup(
    defineAsyncComponent(() => import('./messaging-room.member-details.vue')),
    {
      showing,
      users: props.groupUsers,
      count: props.onlineUserCount,
      groupOwnerId: props.groupOwnerId,
      targetElement: buttonEl.value as HTMLElement,
    },
    {},
    'end',
  );
};

const preventDrag = (ev: TouchEvent) => {
  ev.stopPropagation();
};

const scrollToBottom = () => {
  if (el) {
    scrollToBottomForWindow({ behavior: 'smooth' });
  }
};
const calcBg = () => {
  const rawBg = metadata?.bg || 'var(--bg)';
  const tinyBg = tinycolor(
    rawBg.startsWith('var(') ? getComputedStyle(document.documentElement).getPropertyValue(rawBg.slice(4, -1)) : rawBg,
  );
  tinyBg.setAlpha(0.85);
  bg.value = tinyBg.toRgbString();
};

let ro: ResizeObserver | null;

onMounted(() => {
  calcBg();
  globalEvents.on('themeChanged', calcBg);
});

onUnmounted(() => {
  globalEvents.off('themeChanged', calcBg);
  if (ro) ro.disconnect();
});

onDeactivated(async () => {
  // @ts-ignore
  if (popupModal) (await popupModal).dispose();
});
</script>

<style lang="scss" module>
.root {
  -webkit-backdrop-filter: var(--blur, blur(15px));
  backdrop-filter: var(--blur, blur(15px));
  border-bottom: solid 0.5px var(--divider);
  width: 100%;
}

.upper,
.lower {
  width: 100%;
  background: transparent;
}

.upper {
  position: relative;
  --height: 50px;
  display: flex;
  gap: var(--margin);
  height: var(--height);

  .tabs:first-child {
    margin-left: auto;
  }

  .tabs:not(:first-child) {
    padding-left: 16px;
    mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0), rgb(0, 0, 0) 16px, rgb(0, 0, 0) 100%);
  }

  .tabs {
    margin-right: auto;
  }

  &.slim {
    text-align: center;
    gap: 0;

    .tabs:first-child {
      margin-left: 0;
    }

    > .titleContainer {
      margin: 0 auto;
      max-width: 100%;
    }
  }
}

.lower {
  --height: 40px;
  height: var(--height);
}

.buttons {
  --margin: 8px;
  display: flex;
  align-items: center;
  min-width: var(--height);
  height: var(--height);

  &:empty {
    width: var(--height);
  }
}

.buttonsLeft {
  composes: buttons;
  margin: 0 var(--margin) 0 0;
}

.buttonsRight {
  composes: buttons;
  margin: 0 0 0 var(--margin);
  font-size: 0.65em;
  width: fit-content;
  position: absolute;
  right: 16px;
}

.nameContainer {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.avatar {
  $size: 20px;
  display: inline-block;
  width: $size;
  height: $size;
  vertical-align: bottom;
}

.button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--height);
  width: 100%;
  box-sizing: border-box;
  position: relative;
  border-radius: 5px;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  &.highlighted {
    color: var(--accent);
  }
}

.fullButton {
  & + .fullButton {
    margin-left: 12px;
  }
}

.titleContainer {
  display: flex;
  align-items: center;
  white-space: nowrap;
  text-align: left;
  font-weight: bold;
  flex-shrink: 1;
  margin-left: 24px;
}

.titleAvatar {
  $size: 32px;
  display: inline-block;
  width: $size;
  height: $size;
  vertical-align: bottom;
  margin: 0 8px;
  pointer-events: none;
}

.titleIcon {
  margin-right: 8px;
  width: 16px;
  text-align: center;
}

.title {
  display: flex;
  align-items: center;
  min-width: 0;
  white-space: nowrap;
  line-height: 1.1;
}

.subtitle {
  opacity: 0.6;
  font-size: 0.8em;
  font-weight: normal;
  white-space: nowrap;

  &.activeTab {
    text-align: center;

    > .chevron {
      display: inline-block;
      margin-left: 6px;
    }
  }
}
</style>
