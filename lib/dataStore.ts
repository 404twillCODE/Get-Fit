import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  getDefaultData,
  getLocalData,
  setLocalData,
  type AppData,
} from "@/lib/storage";

const USER_DATA_TABLE = "user_data";

const getSessionUserId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
};

const fetchRemoteData = async (userId: string): Promise<AppData | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(USER_DATA_TABLE)
    .select("data")
    .eq("id", userId)
    .single();
  if (error || !data?.data) return null;
  return data.data as AppData;
};

const upsertRemoteData = async (userId: string, data: AppData) => {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.from(USER_DATA_TABLE).upsert({
    id: userId,
    data,
    updated_at: new Date().toISOString(),
  });
};

export const loadAppData = async (): Promise<AppData> => {
  const userId = await getSessionUserId();
  if (!userId) {
    return getLocalData();
  }

  const remoteData = await fetchRemoteData(userId);
  if (remoteData) {
    setLocalData(remoteData);
    return remoteData;
  }

  const localData = getLocalData();
  await upsertRemoteData(userId, localData);
  return localData;
};

export const saveAppData = async (data: AppData) => {
  setLocalData(data);
  const userId = await getSessionUserId();
  if (!userId) return;
  await upsertRemoteData(userId, data);
};

export const updateAppData = async (
  updater: (current: AppData) => AppData
) => {
  const current = await loadAppData();
  const updated = updater(current);
  await saveAppData(updated);
  return updated;
};

export const ensureUserData = async () => {
  const userId = await getSessionUserId();
  if (!userId) return;
  const remoteData = await fetchRemoteData(userId);
  if (remoteData) {
    setLocalData(remoteData);
    return;
  }
  await upsertRemoteData(userId, getLocalData());
};

export const pullFromSupabase = async (): Promise<AppData | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const remoteData = await fetchRemoteData(userId);
  if (!remoteData) return null;
  setLocalData(remoteData);
  return remoteData;
};

export const pushToSupabase = async () => {
  const userId = await getSessionUserId();
  if (!userId) return false;
  const localData = getLocalData();
  await upsertRemoteData(userId, localData);
  return true;
};

export const resetToDefaults = async () => {
  const defaults = getDefaultData();
  await saveAppData(defaults);
  return defaults;
};
