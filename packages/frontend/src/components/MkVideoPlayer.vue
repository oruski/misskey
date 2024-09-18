<template>
  <div>
    <video ref="videoPlayer" class="video-js" vjs-default-skin data-setup='{"fluid": true}'></video>
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
    },
  },
  data() {
    return {
      player: null,
    };
  },
  mounted() {
    this.player = videojs(this.$refs.videoPlayer, this.options, () => {
      this.player.log('onPlayerReady', this);
    });
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
