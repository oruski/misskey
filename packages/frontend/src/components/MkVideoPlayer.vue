<template>
  <div>
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
        fill: true,
        // responsive: true,
        fluid: true,
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

<style lang="scss">
.vjs-error .vjs-error-display .vjs-modal-dialog-content {
  padding-top: 40px;
}
</style>
