<template>
  <div :class="$style.root">
    <video ref="videoPlayer" class="video-js" vjs-default-skin playsinline :poster="poster"></video>
  </div>
</template>

<script>
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { miLocalStorage } from '@/local-storage';

export default {
  name: 'VideoPlayer',
  props: {
    options: {
      type: Object,
      default() {
        return {};
      },
    },
    poster: {
      type: String,
      default: '',
    },
    onPlayerReady: {
      type: Function,
      default: (player) => {},
    },
  },
  data() {
    return {
      player: null,
    };
  },
  mounted() {
    const volume = miLocalStorage.getItem('videojsVolume');
    const muted = miLocalStorage.getItem('videojsMuted');

    this.player = videojs(
      this.$refs.videoPlayer,
      {
        ...this.options,
        fluid: true,
        fill: true,
        // responsive: true,
        aspectRatio: '16:9',
        // ミュートをセット
        muted: muted === '1',
      },
      () => {
        this.onPlayerReady(this.player);
        // ボリュームを変更した
        this.player.on('volumechange', () => {
          miLocalStorage.setItem('videojsVolume', this.player.volume());
          miLocalStorage.setItem('videojsMuted', this.player.muted() ? '1' : '0');
        });
        this.player.volume(volume ? parseFloat(volume) : 0.5);
      },
    );
  },
  beforeUnmount() {
    if (this.player) {
      this.player.dispose();
    }
  },
};
</script>

<style lang="scss" module>
.root {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: black;
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss">
.vjs-error .vjs-error-display .vjs-modal-dialog-content {
  padding-top: 40px;
}
</style>
