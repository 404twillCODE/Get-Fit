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

const upsertRemoteData = async (
  userId: string,
  data: AppData,
  retries = 3
): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn("Supabase client not available");
    return false;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { error, status } = await supabase
        .from(USER_DATA_TABLE)
        .upsert(
          {
            id: userId,
            data,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

      if (error) {
        console.error(`Supabase upsert error (attempt ${attempt}/${retries}):`, error);
        if (attempt === retries) {
          // Store failed data for retry later
          if (typeof window !== "undefined") {
            const failedSyncs = JSON.parse(
              localStorage.getItem("failed_syncs") || "[]"
            );
            failedSyncs.push({
              userId,
              data,
              timestamp: new Date().toISOString(),
              error: error.message,
            });
            localStorage.setItem("failed_syncs", JSON.stringify(failedSyncs));
          }
          return false;
        }
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      // Verify the data was saved - status 200 (update) or 201 (insert) or 204 (no content)
      if (status === 200 || status === 201 || status === 204) {
        console.log("Data successfully saved to Supabase");
        // Clear any failed syncs for this user/data combination
        if (typeof window !== "undefined") {
          const failedSyncs = JSON.parse(
            localStorage.getItem("failed_syncs") || "[]"
          );
          const filtered = failedSyncs.filter(
            (sync: { userId: string; timestamp: string }) =>
              !(sync.userId === userId && 
                new Date(sync.timestamp).getTime() > Date.now() - 60000) // Remove recent failures
          );
          localStorage.setItem("failed_syncs", JSON.stringify(filtered));
        }
        return true;
      }

      console.warn(`Unexpected status code: ${status}`);
      if (attempt === retries) {
        // Store failed data for retry later
        if (typeof window !== "undefined") {
          const failedSyncs = JSON.parse(
            localStorage.getItem("failed_syncs") || "[]"
          );
          failedSyncs.push({
            userId,
            data,
            timestamp: new Date().toISOString(),
            error: `Unexpected status: ${status}`,
          });
          localStorage.setItem("failed_syncs", JSON.stringify(failedSyncs));
        }
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    } catch (err) {
      console.error(`Exception during Supabase upsert (attempt ${attempt}/${retries}):`, err);
      if (attempt === retries) {
        // Store failed data for retry later
        if (typeof window !== "undefined") {
          const failedSyncs = JSON.parse(
            localStorage.getItem("failed_syncs") || "[]"
          );
          failedSyncs.push({
            userId,
            data,
            timestamp: new Date().toISOString(),
            error: err instanceof Error ? err.message : "Unknown error",
          });
          localStorage.setItem("failed_syncs", JSON.stringify(failedSyncs));
        }
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  return false;
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

export const saveAppData = async (data: AppData): Promise<boolean> => {
  setLocalData(data);
  const userId = await getSessionUserId();
  if (!userId) {
    console.log("No user ID, saving locally only");
    return true; // Successfully saved locally
  }
  const success = await upsertRemoteData(userId, data);
  if (!success) {
    console.warn("Failed to save to Supabase, data saved locally");
  }
  return success;
};

export const updateAppData = async (
  updater: (current: AppData) => AppData
): Promise<AppData> => {
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

export const pushToSupabase = async (): Promise<boolean> => {
  const userId = await getSessionUserId();
  if (!userId) return false;
  const localData = getLocalData();
  return await upsertRemoteData(userId, localData);
};

// Retry failed syncs
export const retryFailedSyncs = async (): Promise<number> => {
  if (typeof window === "undefined") return 0;
  
  const failedSyncs = JSON.parse(
    localStorage.getItem("failed_syncs") || "[]"
  );
  if (failedSyncs.length === 0) return 0;

  const userId = await getSessionUserId();
  if (!userId) return 0;

  let successCount = 0;
  const remaining = [];

  for (const sync of failedSyncs) {
    if (sync.userId !== userId) {
      remaining.push(sync);
      continue;
    }

    const success = await upsertRemoteData(userId, sync.data, 2);
    if (success) {
      successCount++;
    } else {
      // Only keep if it's recent (within 24 hours)
      const syncTime = new Date(sync.timestamp).getTime();
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (syncTime > dayAgo) {
        remaining.push(sync);
      }
    }
  }

  localStorage.setItem("failed_syncs", JSON.stringify(remaining));
  return successCount;
};

// Periodic sync check
export const startPeriodicSync = () => {
  if (typeof window === "undefined") return;
  
  // Retry failed syncs every 30 seconds
  setInterval(async () => {
    const count = await retryFailedSyncs();
    if (count > 0) {
      console.log(`Retried ${count} failed sync(s)`);
    }
  }, 30000);

  // Also retry on page visibility change (user comes back to tab)
  document.addEventListener("visibilitychange", async () => {
    if (!document.hidden) {
      await retryFailedSyncs();
    }
  });

  // Retry on online event
  window.addEventListener("online", async () => {
    console.log("Connection restored, retrying failed syncs");
    await retryFailedSyncs();
  });
};

export const resetToDefaults = async () => {
  const defaults = getDefaultData();
  await saveAppData(defaults);
  return defaults;
};
