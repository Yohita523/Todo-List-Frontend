import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

export interface List {
  id: number;
  name: string;
  created_at: string;
}

export interface Todo {
  id: number;
  title: string;
  is_done: boolean;
  list_id: number | null;
  details: string | null;
  due_at: string | null;
  created_at: string;
}

function mapTodo(raw: any): Todo {
  return {
    id: raw.id,
    title: raw.title,
    is_done: !!raw.is_done,
    list_id: raw.list_id ?? null,
    details: raw.details ?? null,
    due_at: raw.due_at ?? null,
    created_at: raw.created_at,
  };
}

export async function getLists(): Promise<List[]> {
  const res = await api.get("/lists");
  return res.data;
}

export async function getTodos(): Promise<Todo[]> {
  const res = await api.get("/todos");
  return res.data.map(mapTodo);
}

export interface NewTodoInput {
  title: string;
  list_id?: number | null;
  details?: string | null;
  due_at?: string | null;
}

export async function createTodo(data: NewTodoInput): Promise<Todo> {
  const res = await api.post("/todos", data);
  return mapTodo(res.data);
}

export async function updateTodo(
  id: number,
  data: Partial<
    Pick<Todo, "title" | "is_done" | "details" | "due_at" | "list_id">
  >
): Promise<Todo> {
  const res = await api.put(`/todos/${id}`, data);
  return mapTodo(res.data);
}

export async function deleteTodo(id: number): Promise<void> {
  await api.delete(`/todos/${id}`);
}
