<template>
  <div class="thvuemwp" :class="{ isMe }">
    <MkAvatar class="avatar" :user="message.user" indicator link preview />
    <div class="content" @contextmenu.stop="onContextmenu">
      <div class="inner">
        <template v-if="!isMe">
          <div class="name">
            <MkUserName :user="message.user" />
          </div>
        </template>
        <div class="inner2">
          <div class="balloon" :class="{ noText: message.text == null || isOneEmoji, isStamp: isOneEmoji }">
            <div
              v-if="!message.isDeleted"
              class="content"
              @pointerdown.passive="onPointerdown"
              @pointerup.passive="onPointerup"
              @pointermove.passive="resetTimer"
            >
              <Mfm v-if="message.text" ref="text" class="text" :text="message.text" :i="$i" />
              <div v-if="message.file" class="file">
                <div class="richcontent">
                  <MkMediaList :media-list="[message.file]" :hide-top-round="!!message.text" :use-bg="!!message.text" />
                </div>
              </div>
            </div>
            <div v-else class="content">
              <p class="is-deleted">{{ $ts.deleted }}</p>
            </div>
          </div>

          <div class="context">
            <div>
              <template v-if="isGroup">
                <span v-if="message.reads.length > 0" class="read"
                  >{{ $ts.messageRead }} {{ message.reads.length }}</span
                >
              </template>
              <template v-else>
                <span v-if="isMe && message.isRead" class="read">{{ $ts.messageRead }}</span>
              </template>
            </div>

            <div>
              <MkTime :time="message.createdAt" />
              <template v-if="message.is_edited"><i class="ti ti-pencil"></i></template>
            </div>
          </div>
        </div>
      </div>

      <div></div>
      <MkUrlPreview v-for="url in urls" :key="url" :url="url" style="margin: 8px 0" />
      <footer></footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import { extractUrlFromMfm } from '@/scripts/extract-url-from-mfm';
import MkUrlPreview from '@/components/MkUrlPreview.vue';
import * as os from '@/os';
import { $i } from '@/account';
import { defaultStore } from '@/store';
import { getMessageMenu } from '@/scripts/get-message-menu';
import MkMediaList from '@/components/MkMediaList.vue';

const props = defineProps<{
  // @ts-ignore
  message: Misskey.entities.MessagingMessage;
  isGroup?: boolean;
  isAdmin?: boolean;
  contextDisposes?: Array<() => void>;
  onSetContextDisposes?: (resolves: unknown[]) => void;
}>();

const isMe = $computed(() => props.message.userId === $i?.id);
const urls = $computed(() => (props.message.text ? extractUrlFromMfm(mfm.parse(props.message.text)) : []));
const isOneEmoji = $computed(() => props.message.text?.match(/^:[a-zA-Z0-9_]+:$/));

// @ts-ignore
// eslint-disable-next-line no-undef
let holdTouchTimer: NodeJS.Timeout | null = $ref(null);

/**
 * コンテキストメニュー
 */
async function onContextmenu(ev: MouseEvent): Promise<void> {
  const isLink = (el: HTMLElement) => {
    if (el.tagName === 'A') return true;
    if (el.parentElement) {
      return isLink(el.parentElement);
    }
  };

  // @ts-ignore
  if (isLink(ev.target)) return;
  // @ts-ignore
  if (window.getSelection().toString() !== '') return;

  if (defaultStore.state.useReactionPickerForContextMenu) {
    ev.preventDefault();
  } else {
    const response = await os.contextMenuWithoutPromise(
      getMessageMenu({ message: props.message, isMe, isAdmin: props.isAdmin }),
      ev,
    );
    props.onSetContextDisposes?.([...(props.contextDisposes ?? []), response.dispose]);
  }
}

/**
 * タイマーリセット
 */
function resetTimer(): void {
  if (holdTouchTimer) {
    console.debug('resetTimer');
    clearTimeout(holdTouchTimer);
    holdTouchTimer = null;
  }
}

/**
 * スクロールイベントの監視
 */
function attachTouchmoveEvent(): void {
  console.debug('attachTouchmoveEvent');
  window.addEventListener('touchmove', resetTimer, { passive: true });
  window.addEventListener('touchend', detachTouchmoveEvent, { passive: true });
}

/**
 * スクロールイベントの監視解除
 */
function detachTouchmoveEvent(): void {
  console.debug('detachTouchmoveEvent');
  window.removeEventListener('touchmove', resetTimer);
  window.removeEventListener('touchend', detachTouchmoveEvent);
}

/**
 * 長押し制御
 */
async function onPointerdown(ev: PointerEvent): Promise<void> {
  console.debug('onPointerdown');
  console.debug('props.contextDisposes =', props.contextDisposes);
  console.debug('props.onSetContextDisposes =', props.onSetContextDisposes);
  if (holdTouchTimer) {
    clearTimeout(holdTouchTimer);
  }
  props.contextDisposes?.forEach((dispose) => {
    console.debug('dispose =', dispose);
    return dispose();
  });

  props.onSetContextDisposes?.([]);
  nextTick(async () => {
    attachTouchmoveEvent();
    holdTouchTimer = setTimeout(async () => {
      console.debug('メニュー表示');
      const response = await os.contextMenuWithoutPromise(
        getMessageMenu({ message: props.message, isMe, isAdmin: props.isAdmin }),
        ev,
      );
      console.debug('response =', response);
      props.onSetContextDisposes?.([...(props.contextDisposes ?? []), response.dispose]);
      return nextTick();
    }, 1000);
    console.debug('holdTouchTimer =', holdTouchTimer);
  });
}

/**
 * 長押し解除
 */
async function onPointerup(ev: PointerEvent): Promise<void> {
  console.debug('onPointerup');
  console.debug('props.contextDisposes =', JSON.stringify(props.contextDisposes));
  if (holdTouchTimer) {
    clearTimeout(holdTouchTimer);
    holdTouchTimer = null;
  }
  detachTouchmoveEvent();
}
</script>

<style lang="scss" scoped>
.thvuemwp {
  $me-balloon-color: var(--accent);

  position: relative;
  background-color: transparent;
  display: flex;

  > .avatar {
    position: sticky;
    top: calc(var(--stickyTop, 0px) + 16px);
    display: block;
    width: 54px;
    height: 54px;
    transition: all 0.1s ease;
  }

  > .content {
    // スマホの場合のみ選択禁止
    @media (max-width: 500px) {
      user-select: none;
    }

    min-width: 0;

    > .inner {
      > .name {
        margin: 0 0 4px 0;
        font-size: 0.85em;
        color: var(--fg);
        opacity: 0.75;
      }

      > .inner2 {
        display: flex;
        gap: 4px;

        > .context {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 2px;
          font-size: 0.65em;
          color: var(--fg);
          opacity: 0.5;
          margin-left: 4px;
          margin-right: 4px;
          margin-bottom: 2px;
          white-space: nowrap;
        }

        > .balloon {
          position: relative;
          display: inline-flex;
          align-items: center;
          padding: 0;
          min-height: 38px;
          border-radius: 16px;
          max-width: 100%;

          &:before {
            content: '';
            pointer-events: none;
            display: block;
            position: absolute;
            top: 12px;
          }

          & + * {
            clear: both;
          }

          &:hover {
            > .delete-button {
              display: block;
            }

            > .pin-button {
              display: block;
            }
          }

          > .pin-button {
            display: none;
            position: absolute;
            z-index: 1;
            top: -4px;
            right: -40px;
            margin: 0;
            padding: 0;
            cursor: pointer;
            outline: none;
            border: none;
            border-radius: 0;
            box-shadow: none;
            background: transparent;

            > img {
              vertical-align: bottom;
              width: 16px;
              height: 16px;
              cursor: pointer;
            }
          }

          > .delete-button {
            display: none;
            position: absolute;
            z-index: 1;
            top: -4px;
            right: -4px;
            margin: 0;
            padding: 0;
            cursor: pointer;
            outline: none;
            border: none;
            border-radius: 0;
            box-shadow: none;
            background: transparent;

            > img {
              vertical-align: bottom;
              width: 16px;
              height: 16px;
              cursor: pointer;
            }
          }

          > .content {
            max-width: 100%;

            > .is-deleted {
              display: block;
              margin: 0;
              padding: 0;
              overflow: hidden;
              overflow-wrap: break-word;
              font-size: 1em;
              color: rgba(#000, 0.5);
            }

            > .text {
              display: block;
              margin: 0;
              padding: 12px 18px;
              overflow: hidden;
              overflow-wrap: break-word;
              word-break: break-word;
              font-size: 1em;
              color: rgba(#000, 0.8);

              & + .file {
                > a {
                  border-radius: 0 0 16px 16px;
                }
              }
            }

            > .file {
              > a {
                display: block;
                max-width: 100%;
                border-radius: 16px;
                overflow: hidden;
                text-decoration: none;

                &:hover {
                  text-decoration: none;

                  > p {
                    background: #ccc;
                  }
                }

                > * {
                  display: block;
                  margin: 0;
                  width: 100%;
                  max-height: 512px;
                  object-fit: contain;
                  box-sizing: border-box;
                }

                > p {
                  padding: 30px;
                  text-align: center;
                  color: #555;
                  background: #ddd;
                }
              }
            }
          }
        }
      }
    }

    > footer {
      display: block;
      margin: 2px 0 0 0;
      font-size: 0.65em;

      > .read {
        margin: 0 8px;
      }

      > i {
        margin-left: 4px;
      }
    }
  }

  &:not(.isMe) {
    padding-left: var(--margin);

    > .avatar {
      margin-top: 8px;
    }

    > .content {
      padding-left: 16px;
      padding-right: 32px;

      > .inner {
        > .inner2 {
          display: flex;
          gap: 4px;

          > .balloon {
            $color: var(--messageBg);
            background: $color;

            &.noText {
              background: transparent;
            }

            &:not(.noText):before {
              left: -14px;
              border-top: solid 8px transparent;
              border-right: solid 8px $color;
              border-bottom: solid 8px transparent;
              border-left: solid 8px transparent;
            }

            &.isStamp {
              > .content {
                > .text {
                  &,
                  ::v-deep(*) {
                    min-width: 120px;
                    min-height: 120px;
                    max-width: 100%;
                    max-height: 370px;
                    object-fit: contain;

                    @media (min-width: 500px) {
                      max-width: 370px;
                    }
                  }
                }
              }
            }

            > .content {
              > .text {
                color: var(--fg);
              }
            }
          }
        }
      }

      > footer {
        text-align: left;
      }
    }
  }

  &.isMe {
    flex-direction: row-reverse;
    padding-right: var(--margin);
    right: var(--margin); // 削除時にposition: absoluteになったときに使う

    > .content {
      padding-right: 16px;
      padding-left: 32px;
      text-align: right;

      > .inner {
        > .inner2 {
          display: flex;
          gap: 4px;
          flex-direction: row-reverse;

          > .balloon {
            background: $me-balloon-color;
            text-align: left;

            ::selection {
              color: var(--accent);
              background-color: #fff;
            }

            &.noText {
              background: transparent;
            }

            &:not(.noText):before {
              right: -14px;
              left: auto;
              border-top: solid 8px transparent;
              border-right: solid 8px transparent;
              border-bottom: solid 8px transparent;
              border-left: solid 8px $me-balloon-color;
            }

            &.isStamp {
              > .content {
                > .text {
                  &,
                  ::v-deep(*) {
                    min-width: 120px;
                    min-height: 120px;
                    max-width: 100%;
                    max-height: 370px;
                    object-fit: contain;

                    @media (min-width: 500px) {
                      max-width: 370px;
                    }
                  }
                }
              }
            }

            > .content {
              > p.is-deleted {
                color: rgba(#fff, 0.5);
              }

              > .text {
                &,
                ::v-deep(*) {
                  color: var(--fgOnAccent) !important;
                }
              }
            }
          }
        }
      }

      > footer {
        text-align: right;

        > .read {
          user-select: none;
        }
      }
    }
  }
}

@container (max-width: 400px) {
  .thvuemwp {
    > .avatar {
      width: 48px;
      height: 48px;
    }

    > .content {
      > .balloon {
        > .content {
          > .text {
            font-size: 0.9em;
          }
        }
      }
    }
  }
}

@container (max-width: 500px) {
  .thvuemwp {
    > .content {
      > .balloon {
        > .content {
          > .text {
            padding: 8px 16px;
          }
        }
      }
    }
  }
}

.richcontent {
  min-width: 128px;
}

@container (min-width: 250px) {
  .richcontent {
    min-width: 140px;
  }
}

@container (min-width: 320px) {
  .richcontent {
    min-width: 150px;
  }
}

@container (min-width: 390px) {
  .richcontent {
    min-width: 250px;
  }
}

@container (min-width: 400px) {
  .richcontent {
    min-width: 250px;
  }
}

@container (min-width: 500px) {
  .richcontent {
    min-width: 320px;
  }
}

@container (min-width: 640px) {
  .richcontent {
    min-width: 480px;
  }
}

@container (min-width: 840px) {
  .richcontent {
    min-width: 640px;
  }
}
</style>
