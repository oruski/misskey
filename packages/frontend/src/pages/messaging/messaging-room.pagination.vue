<template>
  <Transition
    :enter-active-class="$store.state.animation ? $style.transition_fade_enterActive : ''"
    :leave-active-class="$store.state.animation ? $style.transition_fade_leaveActive : ''"
    :enter-from-class="$store.state.animation ? $style.transition_fade_enterFrom : ''"
    :leave-to-class="$store.state.animation ? $style.transition_fade_leaveTo : ''"
    mode="out-in"
  >
    <MkLoading v-if="fetching" />

    <MkError v-else-if="error" @retry="init()" />

    <div v-else-if="empty" key="_empty_" class="empty">
      <slot name="empty">
        <div class="_fullinfo">
          <img src="/assets/error.png" class="_ghost" />
          <div>{{ i18n.ts.nothing }}</div>
        </div>
      </slot>
    </div>

    <div v-else ref="rootEl">
      <div v-show="pagination.reversed && more" key="_more_" class="_margin">
        <MkButton
          v-if="!moreFetching"
          v-appear="enableInfiniteScroll && !props.disableAutoLoad ? fetchMore : null"
          :class="$style.more"
          :disabled="moreFetching"
          :style="{ cursor: moreFetching ? 'wait' : 'pointer' }"
          primary
          @click="fetchMore"
        >
          &emsp;
        </MkButton>
        <MkLoading v-else class="loading" />
      </div>
      <slot :items="items" :fetching="fetching || moreFetching"></slot>
      <div v-show="!pagination.reversed && more" key="_more_" class="_margin">
        <MkButton
          v-if="!moreFetching"
          v-appear="enableInfiniteScroll && !props.disableAutoLoad ? fetchMore : null"
          :class="$style.more"
          :disabled="moreFetching"
          :style="{ cursor: moreFetching ? 'wait' : 'pointer' }"
          primary
          @click="fetchMore"
        >
          &emsp;
        </MkButton>
        <MkLoading v-else class="loading" />
      </div>
    </div>
  </Transition>
</template>

<script lang="ts">
import {
  computed,
  ComputedRef,
  isRef,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from 'vue';
import * as misskey from 'misskey-js';
import * as os from '@/os';
import {
  onScrollTop,
  isTopVisible,
  onScrollBottom,
  isBottomVisible,
  scrollToBottomForWindow,
  getBodyScrollHeight,
} from '@/scripts/scroll';
import { defaultStore } from '@/store';
import { MisskeyEntity } from '@/types/date-separated-list';
import { i18n } from '@/i18n';

const SECOND_FETCH_LIMIT = 20;
const TOLERANCE = 16;

export type Paging<E extends keyof misskey.Endpoints = keyof misskey.Endpoints> = {
  endpoint: E;
  limit: number;
  params?: misskey.Endpoints[E]['req'] | ComputedRef<misskey.Endpoints[E]['req']>;

  /**
   * 検索APIのような、ページング不可なエンドポイントを利用する場合
   * (そのようなAPIをこの関数で使うのは若干矛盾してるけど)
   */
  noPaging?: boolean;

  /**
   * items 配列の中身を逆順にする(新しい方が最後)
   */
  reversed?: boolean;

  offsetMode?: boolean;

  pageEl?: HTMLElement;
};
</script>
<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    pagination: Paging;
    disableAutoLoad?: boolean;
    displayLimit?: number;
    isFirstFetch?: boolean;
    onFirstFetch?: () => void;
  }>(),
  {
    displayLimit: 20,
    isFirstFetch: false,
  },
);

const emit = defineEmits<{
  (ev: 'queue', count: number): void;
}>();

let rootEl = $shallowRef<HTMLElement>();

// 遡り中かどうか
let backed = $ref(false);

let scrollRemove = $ref<(() => void) | null>(null);

const items = ref<MisskeyEntity[]>([]);
const queue = ref<MisskeyEntity[]>([]);
const offset = ref(0);
const fetching = ref(true);
const moreFetching = ref(false);
const more = ref(false);
const isBackTop = ref(false);
const empty = computed(() => items.value.length === 0);
const error = ref(false);
const isFirstFetch = $computed(() => props.isFirstFetch);
const { enableInfiniteScroll } = defaultStore.reactiveState;

const contentEl = $computed(() => props.pagination.pageEl || rootEl);

// 先頭が表示されているかどうかを検出
// https://qiita.com/mkataigi/items/0154aefd2223ce23398e
let scrollObserver = $ref<IntersectionObserver>();

watch(
  [() => props.pagination.reversed],
  () => {
    if (scrollObserver) scrollObserver.disconnect();

    scrollObserver = new IntersectionObserver(
      (entries) => {
        backed = entries[0].isIntersecting;
      },
      {
        rootMargin: props.pagination.reversed ? '-100% 0px 100% 0px' : '100% 0px -100% 0px',
        threshold: 0.01,
      },
    );
  },
  { immediate: true },
);

watch($$(rootEl), () => {
  scrollObserver?.disconnect();
  nextTick(() => {
    if (rootEl) scrollObserver?.observe(rootEl);
  });
});

watch([$$(backed), $$(contentEl)], () => {
  if (!backed) {
    if (!contentEl) return;

    scrollRemove = (props.pagination.reversed ? onScrollBottom : onScrollTop)(contentEl, executeQueue, TOLERANCE);
  } else {
    if (scrollRemove) scrollRemove();
    scrollRemove = null;
  }
});

if (props.pagination.params && isRef(props.pagination.params)) {
  watch(props.pagination.params, init, { deep: true });
}

watch(
  queue,
  (a, b) => {
    if (a.length === 0 && b.length === 0) return;
    emit('queue', queue.value.length);
  },
  { deep: true },
);

watch(fetching, () => {
  if (props.isFirstFetch) {
    console.debug('[初回ローディング] Pagination scrollToBottomForWindow SCROLL004');
    scrollToBottomForWindow({ behavior: 'instant' });
    setTimeout(() => {
      console.debug('[初回ローディング] Pagination scrollToBottomForWindow SCROLL005');
      scrollToBottomForWindow({ behavior: 'instant' });
    }, 300);
    setTimeout(() => {
      console.debug('[初回ローディング] Pagination scrollToBottomForWindow SCROLL006');
      scrollToBottomForWindow({ behavior: 'instant' });
    }, 600);
  }
});

watch(isFirstFetch, () => {
  console.debug('scrollToBottomForWindow SCROLL007');
  scrollToBottomForWindow({ behavior: 'instant' });
});

async function init(): Promise<void> {
  console.debug('[pagination] init');

  queue.value = [];
  fetching.value = true;
  const params = props.pagination.params
    ? isRef(props.pagination.params)
      ? props.pagination.params.value
      : props.pagination.params
    : {};
  await os
    .api(props.pagination.endpoint, {
      ...params,
      limit: props.pagination.noPaging ? props.pagination.limit || 10 : (props.pagination.limit || 10) + 1,
    })
    .then(
      (res) => {
        for (let i = 0; i < res.length; i++) {
          const item = res[i];
          if (i === 3) item._shouldInsertAd_ = true;
        }
        if (!props.pagination.noPaging && res.length > (props.pagination.limit || 10)) {
          res.pop();
          items.value = res;
          more.value = true;
        } else {
          items.value = res;
          more.value = false;
        }
        offset.value = res.length;
        error.value = false;
        fetching.value = false;
      },
      (err) => {
        error.value = true;
        fetching.value = false;
      },
    )
    .finally(() => {
      if (props.isFirstFetch) {
        console.debug('scrollToBottomForWindow SCROLL011');
        scrollToBottomForWindow({ behavior: 'instant' });
        setTimeout(() => {
          console.debug('scrollToBottomForWindow SCROLL001');
          scrollToBottomForWindow({ behavior: 'instant' });
          props.onFirstFetch?.();
        }, 500);
      }
    });
}

const reload = (): Promise<void> => {
  fetching.value = true;
  moreFetching.value = false;
  more.value = false;
  items.value = [];
  return init();
};

/**
 * さらに読み込む
 */
const fetchMore = async (): Promise<void> => {
  if (!more.value || fetching.value || moreFetching.value || items.value.length === 0 || props.isFirstFetch) return;

  console.debug('fetchMore');

  moreFetching.value = true;
  const params = props.pagination.params
    ? isRef(props.pagination.params)
      ? props.pagination.params.value
      : props.pagination.params
    : {};
  await os
    .api(props.pagination.endpoint, {
      ...params,
      limit: SECOND_FETCH_LIMIT + 1,
      ...(props.pagination.offsetMode
        ? {
            offset: offset.value,
          }
        : props.pagination.reversed
        ? {
            untilId: items.value[items.value.length - 1].id,
          }
        : {
            untilId: items.value[items.value.length - 1].id,
          }),
    })
    .then(
      (res) => {
        for (let i = 0; i < res.length; i++) {
          const item = res[i];
          if (i === 10) item._shouldInsertAd_ = true;
        }

        const reverseConcat = (_res) => {
          // 画面のスクロール位置を保持
          const oldScroll = window.scrollY;
          console.debug('oldScroll =', oldScroll);

          // 画面サイズを保持
          const oldHeight = getBodyScrollHeight();

          // 逆順に追加
          items.value = items.value.concat(_res);

          return nextTick(() => {
            // 現在の画面サイズを取得
            const newHeight = getBodyScrollHeight();

            // 画面サイズの差分を取得
            const diff = newHeight - oldHeight;

            // 前回のスクロール位置から差分を追加する
            window.scroll({ top: oldScroll + diff, behavior: 'instant' });
            return nextTick();
          });
        };

        if (res.length > SECOND_FETCH_LIMIT) {
          res.pop();

          if (props.pagination.reversed) {
            reverseConcat(res).then(() => {
              more.value = true;
              setTimeout(() => {
                moreFetching.value = false;
              }, 500);
            });
          } else {
            items.value = items.value.concat(res);
            more.value = true;
            setTimeout(() => {
              moreFetching.value = false;
            }, 500);
          }
        } else {
          if (props.pagination.reversed) {
            reverseConcat(res).then(() => {
              more.value = false;
              setTimeout(() => {
                moreFetching.value = false;
              }, 500);
            });
          } else {
            items.value = items.value.concat(res);
            more.value = false;
            setTimeout(() => {
              moreFetching.value = false;
            }, 500);
          }
        }
        offset.value += res.length;

        if (props.isFirstFetch) {
          console.debug('scrollToBottomForWindow SCROLL002');
          scrollToBottomForWindow({ behavior: 'instant' });
        }
      },
      () => {
        setTimeout(() => {
          moreFetching.value = false;
        }, 500);
      },
    );
};

const prepend = (item: MisskeyEntity): void => {
  // 初回表示時はunshiftだけでOK
  if (!rootEl) {
    items.value.unshift(item);
    return;
  }

  const isTop = isBackTop.value || (props.pagination.reversed ? isBottomVisible : isTopVisible)(contentEl, TOLERANCE);

  if (isTop) unshiftItems([item]);
  else prependQueue(item);
};

function unshiftItems(newItems: MisskeyEntity[]) {
  const length = newItems.length + items.value.length;
  items.value = [...newItems, ...items.value].slice(0, props.displayLimit);
  if (length >= props.displayLimit) more.value = true;
}

function executeQueue() {
  if (queue.value.length === 0) return;
  unshiftItems(queue.value);
  queue.value = [];
}

function prependQueue(newItem: MisskeyEntity) {
  queue.value.unshift(newItem);
  if (queue.value.length >= props.displayLimit) {
    queue.value.pop();
  }
}

const appendItem = (item: MisskeyEntity): void => {
  items.value.push(item);
};

const removeItem = (finder: (item: MisskeyEntity) => boolean) => {
  const i = items.value.findIndex(finder);
  items.value.splice(i, 1);
};

const updateItem = (id: MisskeyEntity['id'], replacer: (old: MisskeyEntity) => MisskeyEntity): void => {
  const i = items.value.findIndex((item) => item.id === id);
  items.value[i] = replacer(items.value[i]);
};

const inited = init();

onActivated(() => {
  isBackTop.value = false;
});

onDeactivated(() => {
  isBackTop.value = props.pagination.reversed
    ? window.scrollY >= (rootEl ? rootEl.scrollHeight - window.innerHeight : 0)
    : window.scrollY === 0;
});

onMounted(() => {});

onBeforeUnmount(() => {
  scrollObserver?.disconnect();
});

defineExpose({
  items,
  queue,
  backed,
  more,
  inited,
  reload,
  prepend,
  append: appendItem,
  removeItem,
  updateItem,
});
</script>

<style lang="scss" module>
.transition_fade_enterActive,
.transition_fade_leaveActive {
  transition: opacity 0.125s ease;
}
.transition_fade_enterFrom,
.transition_fade_leaveTo {
  opacity: 0;
}

.more {
  margin-left: auto;
  margin-right: auto;
}
</style>
