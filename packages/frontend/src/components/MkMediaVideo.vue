<template>
  <div v-if="hide" class="icozogqfvdetwohsdglrbswgrejoxbdj" @click="hide = false">
    <div>
      <b><i class="ti ti-alert-triangle"></i> {{ $ts.sensitive }}</b>
      <span>{{ $ts.clickToShow }}</span>
    </div>
  </div>
  <div v-else class="kkjnbbplepmiyuadieoenjgutgcmtsvu">
    <MkVideoPlayer
      :options="{
        autoplay: false,
        controls: true,
        sources: [
          {
            src: video.url,
            type: video.type === 'video/quicktime' ? 'video/mp4' : video.type,
          },
        ],
      }"
    />
    <i class="ti ti-eye-off" @click="hide = true"></i>
    <a class="download" :href="video.url" :title="video.name" :download="video.name">
      <span class="icon"><i class="ti ti-download"></i></span>
    </a>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as misskey from 'misskey-js';
import { defaultStore } from '@/store';
import 'vue-plyr/dist/vue-plyr.css';
import MkVideoPlayer from '@/components/MkVideoPlayer.vue';

const props = defineProps<{
  video: misskey.entities.DriveFile;
}>();

const hide = ref(
  defaultStore.state.nsfw === 'force' ? true : props.video.isSensitive && defaultStore.state.nsfw !== 'ignore',
);
</script>

<style lang="scss" scoped>
.kkjnbbplepmiyuadieoenjgutgcmtsvu {
  height: min-content;

  position: relative;

  --plyr-color-main: var(--accent);

  > i,
  > .download {
    display: flex;
    justify-self: center;
    justify-content: center;
    position: absolute;
    border-radius: 6px;
    background-color: var(--fg);
    color: var(--accentLighten);
    font-size: 14px;
    opacity: 0.5;
    padding: 3px 6px;
    text-align: center;
    cursor: pointer;
    z-index: 1;
    top: 12px;
    right: 12px;
  }

  > .download {
    right: 52px;
    font-size: 11px;
  }

  > video {
    display: flex;
    justify-content: center;
    align-items: center;

    font-size: 3.5em;
    overflow: hidden;
    background-position: center;
    background-size: cover;
    width: 100%;
    height: 100%;
  }
}

.icozogqfvdetwohsdglrbswgrejoxbdj {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #111;
  color: #fff;

  > div {
    display: table-cell;
    text-align: center;
    font-size: 12px;

    > b {
      display: block;
    }
  }
}
</style>
