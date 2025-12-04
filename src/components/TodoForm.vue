<template>
  <form @submit.prevent="onSubmit">
    <input
      v-model="title"
      type="text"
      class="form-control mb-2"
      placeholder="ชื่องาน..."
    />

    <textarea
      v-model="details"
      class="form-control mb-2"
      rows="3"
      placeholder="รายละเอียดงาน..."
    />

    <input v-model="due_at" type="datetime-local" class="form-control mb-2" />

    <select v-model.number="list_id" class="form-select mb-3">
      <option :value="null">เลือกกลุ่มหัวข้อ...</option>
      <option v-for="list in lists" :key="list.id" :value="list.id">
        {{ list.name }}
      </option>
    </select>

    <div class="d-flex justify-content-end gap-2">
      <button
        type="button"
        class="btn btn-outline-secondary"
        @click="$emit('cancel')"
      >
        ยกเลิก
      </button>
      <button type="submit" class="btn btn-dark">เพิ่มงาน</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  lists: { id: number; name: string }[];
  initial?: {
    title: string;
    details: string | null;
    due_at: string | null;
    list_id: number | null;
  } | null;
}>();

const emit = defineEmits<{
  (
    e: "submit-todo",
    payload: {
      title: string;
      details: string | null;
      due_at: string | null;
      list_id: number | null;
    }
  ): void;
  (e: "cancel"): void;
}>();

const title = ref("");
const details = ref("");
const due_at = ref("");
const list_id = ref<number | null>(null);

watch(
  () => props.initial,
  (val) => {
    title.value = val?.title ?? "";
    details.value = val?.details ?? "";
    due_at.value = val?.due_at ?? "";
    list_id.value = val?.list_id ?? null;
  },
  { immediate: true }
);

function onSubmit() {
  const t = title.value.trim();
  if (!t) return;

  emit("submit-todo", {
    title: t,
    details: details.value.trim() || null,
    due_at: due_at.value || null,
    list_id: list_id.value,
  });
}
</script>
