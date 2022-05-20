<script lang="ts">
import { ref } from "vue";
export default {
  setup() {
    const count = ref(0);
    function add() {
      count.value++;
    }
    return { count, add };
  },
};
</script>

<template>
  <div class="hi">hi</div>
  count: {{ count }}
  <button @click="count++">+1</button>
</template>

<style scoped>
.hi {
  color: yellow;
}
</style>
