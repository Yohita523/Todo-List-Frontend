<template>
  <div class="todo-page container py-5">
    <div class="card shadow main-card mx-auto">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1 class="h1 mb-0">Todo List</h1>
        </div>

        <div class="d-flex flex-wrap gap-2 mb-4">
          <button
            class="btn btn-light border-dark flex-fill"
            @click="openCreateTodoModal"
          >
            <span class="me-1">＋</span> เพิ่มรายการสิ่งที่ต้องทำ
          </button>
          <button
            class="btn btn-light border-dark flex-fill"
            @click="openCreateListModal"
          >
            <span class="me-1">＋</span> เพิ่มกลุ่ม
          </button>
          <select
            class="form-select border-dark w-auto ms-auto"
            v-model="currentFilter"
          >
            <option value="all">ทุกกลุ่ม</option>
            <option v-for="list in lists" :key="list.id" :value="list.id">
              {{ list.name }}
            </option>
          </select>
        </div>

        <div class="row g-3">
          <div
            v-for="todo in filteredTodos"
            :key="todo.id"
            class="col-12 col-md-6"
          >
            <div
              class="todo-card card h-100"
              :class="{ 'todo-card-done': todo.is_done }"
            >
              <div class="card-body d-flex flex-column">
                <div class="mb-2">
                  <div class="fw-semibold">{{ todo.title }}</div>
                  <div class="text-muted small">
                    กลุ่ม: {{ getListName(todo.list_id) }}
                    <button
                      v-if="todo.list_id"
                      type="button"
                      class="btn btn-link btn-sm p-0 ms-1"
                      @click="openEditList(todo.list_id!)"
                    >
                      แก้ไข
                    </button>
                  </div>
                </div>

                <div v-if="todo.due_at" class="text-muted small mb-3">
                  📅 {{ formatDate(todo.due_at) }}
                </div>

                <div
                  class="mt-auto d-flex justify-content-between align-items-center"
                >
                  <div>
                    <input
                      class="form-check-input me-2"
                      type="checkbox"
                      :checked="!!todo.is_done"
                      @change="() => toggleTodo(todo.id)"
                    />
                    <span
                      class="small"
                      :class="{ 'text-success': todo.is_done }"
                    >
                      {{ todo.is_done ? "เสร็จแล้ว" : "ยังไม่เสร็จ" }}
                    </span>
                  </div>

                  <div class="btn-group">
                    <button
                      class="btn btn-sm btn-outline-secondary"
                      @click="toggleDetail(todo.id)"
                    >
                      {{
                        openedDetailId === todo.id ? "ซ่อนข้อมูล" : "แสดงข้อมูล"
                      }}
                    </button>

                    <button
                      class="btn btn-sm btn-outline-primary"
                      @click="openEditTodo(todo)"
                    >
                      แก้ไข
                    </button>

                    <button
                      class="btn btn-sm btn-outline-danger"
                      @click="deleteTodo(todo.id)"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
                <Transition name="fade">
                  <p
                    v-if="openedDetailId === todo.id && todo.details"
                    class="mt-3 small mb-0 text-muted"
                  >
                    {{ todo.details }}
                  </p>
                </Transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Transition name="modal-fade">
      <div v-if="showTodoModal" class="modal-backdrop">
        <div class="modal-card card">
          <div class="card-body">
            <h2 class="h5 text-center mb-3">
              {{ editingTodo ? "แก้ไขสิ่งที่ต้องทำ" : "สร้างสิ่งที่ต้องทำ" }}
            </h2>

            <TodoForm
              :lists="lists"
              :initial="
                editingTodo && {
                  title: editingTodo.title,
                  details: editingTodo.details,
                  due_at: editingTodo.due_at,
                  list_id: editingTodo.list_id,
                }
              "
              @submit-todo="handleSubmitTodo"
              @cancel="closeTodoModal"
            />
          </div>
        </div>
      </div>
    </Transition>
    <Transition name="modal-fade">
      <div v-if="showListModal" class="modal-backdrop">
        <div class="modal-card card">
          <div class="card-body">
            <h2 class="h5 text-center mb-3">
              {{ editingList ? "แก้ไขชื่อกลุ่ม" : "สร้างกลุ่ม" }}
            </h2>

            <form @submit.prevent="submitList">
              <input
                v-model="newListName"
                type="text"
                class="form-control mb-3"
                placeholder="ชื่อกลุ่ม..."
              />

              <div class="d-flex justify-content-between align-items-center">
                <div v-if="editingList">
                  <button
                    type="button"
                    class="btn btn-outline-danger btn-sm"
                    @click="deleteList(editingList.id)"
                  >
                    ลบกลุ่มนี้
                  </button>
                </div>

                <div class="ms-auto d-flex gap-2">
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="closeListModal"
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" class="btn btn-dark">ยืนยัน</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import TodoForm from "./components/TodoForm.vue";

interface Todo {
  id: number;
  title: string;
  is_done: number;
  list_id: number | null;
  details: string | null;
  due_at: string | null;
}

interface List {
  id: number;
  name: string;
}

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

const todos = ref<Todo[]>([]);
const lists = ref<List[]>([]);
const editingTodo = ref<Todo | null>(null);
const editingList = ref<List | null>(null);

const currentFilter = ref<number | "all">("all");
const openedDetailId = ref<number | null>(null);

const showTodoModal = ref(false);
const showListModal = ref(false);
const newListName = ref("");

onMounted(async () => {
  const [todoRes, listRes] = await Promise.all([
    api.get<Todo[]>("/todos"),
    api.get<List[]>("/lists"),
  ]);
  todos.value = todoRes.data;
  lists.value = listRes.data;
});

function getListName(listId: number | null): string {
  if (!listId) return "ไม่มีกลุ่ม";
  const list = lists.value.find((l) => l.id === listId);
  return list ? list.name : "ไม่มีกลุ่ม";
}

const filteredTodos = computed(() => {
  if (currentFilter.value === "all") return todos.value;
  return todos.value.filter((t) => t.list_id === currentFilter.value);
});

function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleString("th-TH");
}

function toggleDetail(id: number) {
  openedDetailId.value = openedDetailId.value === id ? null : id;
}

function openCreateTodoModal() {
  editingTodo.value = null;
  showTodoModal.value = true;
}

function openEditTodo(todo: Todo) {
  editingTodo.value = { ...todo };
  showTodoModal.value = true;
}

function closeTodoModal() {
  showTodoModal.value = false;
  editingTodo.value = null;
}

function closeListModal() {
  showListModal.value = false;
  editingList.value = null;
  newListName.value = "";
}

function openCreateListModal() {
  editingList.value = null;
  newListName.value = "";
  showListModal.value = true;
}

function openEditList(listId: number) {
  const list = lists.value.find((l) => l.id === listId);
  if (!list) return;
  editingList.value = { ...list };
  newListName.value = list.name;
  showListModal.value = true;
}

async function handleSubmitTodo(payload: {
  title: string;
  details: string | null;
  due_at: string | null;
  list_id: number | null;
}) {
  if (editingTodo.value) {
    const id = editingTodo.value.id;
    const res = await api.put<Todo>(`/todos/${id}`, payload);

    const idx = todos.value.findIndex((t) => t.id === id);
    if (idx !== -1) {
      todos.value[idx] = res.data;
    }
  } else {
    const res = await api.post<Todo>("/todos", payload);
    todos.value.unshift(res.data);
  }
  closeTodoModal();
}

async function toggleTodo(id: number) {
  const target = todos.value.find((t) => t.id === id);
  if (!target) return;
  const newDone = target.is_done ? 0 : 1;
  const res = await api.put<Todo>(`/todos/${id}`, { is_done: newDone });
  Object.assign(target, res.data);
}

async function deleteTodo(id: number) {
  await api.delete(`/todos/${id}`);
  todos.value = todos.value.filter((t) => t.id !== id);
}

async function submitList() {
  const name = newListName.value.trim();
  if (!name) return;

  if (editingList.value) {
    const id = editingList.value.id;
    const res = await api.put<List>(`/lists/${id}`, { name });
    const idx = lists.value.findIndex((l) => l.id === id);
    if (idx !== -1) {
      lists.value[idx] = res.data;
    }
  } else {
    const res = await api.post<List>("/lists", { name });
    lists.value.push(res.data);
  }
  closeListModal();
}

async function deleteList(id: number) {
  await api.delete(`/lists/${id}`);

  lists.value = lists.value.filter((l) => l.id !== id);

  todos.value = todos.value.map((t) =>
    t.list_id === id ? { ...t, list_id: null } : t
  );

  if (currentFilter.value === id) {
    currentFilter.value = "all";
  }
  closeListModal();
}
</script>
