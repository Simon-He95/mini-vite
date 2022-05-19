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
  <div>hi</div>
  count: {{ count }}
  <button @click="count++">+1</button>
</template>

<style scoped></style>
