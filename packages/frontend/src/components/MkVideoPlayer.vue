<template>
  <div :class="$style.root">
    <video ref="videoPlayer" class="video-js" vjs-default-skin playsinline :poster="poster"></video>
  </div>
</template>

<script>
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

export default {
  name: 'VideoPlayer',
  props: {
    options: {
      type: Object,
      default() {
        return {};
      },
      poster: {
        type: String,
        default: '',
      },
    },
  },
  data() {
    return {
      player: null,
    };
  },
  mounted() {
    this.player = videojs(
      this.$refs.videoPlayer,
      {
        ...this.options,
        fill: false,
        // 高さ制限
        height: 343,
        // responsive: true,
        fluid: false,
        // aspectRatio: '4:3',
      },
      () => {
        this.player.log('onPlayerReady', this);
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
  background-color: black;
}
</style>

<style lang="scss">
.vjs-error .vjs-error-display .vjs-modal-dialog-content {
  padding-top: 40px;
}
</style>
