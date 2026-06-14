import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { ref, get, query, limitToLast, orderByKey } from "firebase/database";
import { db } from "./firebase";

// Resolve base URL depending on platform and network
const hostForDevice = () => {
  // 1. Highest priority: explicit env var set via workflow
  //    EXPO_PUBLIC_API_BASE_URL=https://8000-$REPLIT_DEV_DOMAIN
  //    This handles Replit canvas iframes and any non-standard URL contexts
  const envUrl = (process.env as any).EXPO_PUBLIC_API_BASE_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, "");

  // 2. Web: detect Replit dev domain from window.location and swap port to 8000
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location.origin) {
      const origin = window.location.origin;
      // Replit format: https://5000-<hash>.replit.dev => https://8000-<hash>.replit.dev
      if (origin.match(/https?:\/\/\d+-/)) {
        return origin.replace(/\/\/(\d+)-/, "//8000-").replace(/\/$/, "");
      }
      // localhost: http://localhost:5000 => http://localhost:8000
      if (origin.includes(":5000")) {
        return origin.replace(/:5000/, ":8000").replace(/\/$/, "");
      }
    }
    return "http://localhost:8000";
  }

  // 3. Android emulator
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }

  // 4. iOS / physical device
  return "http://localhost:8000";
};

// Configuration for powerful connectivity
const API_CONFIG = {
  primaryEndpoint: hostForDevice(),
  fallbackEndpoints: [
    "http://10.0.2.2:5000",
    "http://localhost:5000",
  ],
  healthCheckInterval: 60000, // Check every minute in background
  retryConfig: {
    maxRetries: 2, // Fewer retries = faster failure/fallback
    initialDelay: 500,
    maxDelay: 2000,
  },
};

class RobustApiClient {
  private currentEndpoint: string = API_CONFIG.primaryEndpoint;
  private isLocalConnected: boolean = true;
  private isChecking: boolean = false;
  private memoryCache: any = null;

  constructor() {
    this.init();
  }

  private async init() {
    // Initial check in background, don't block
    this.performHealthCheck();
    setInterval(() => this.performHealthCheck(), API_CONFIG.healthCheckInterval);
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async performHealthCheck(): Promise<boolean> {
    if (this.isChecking) return this.isLocalConnected;
    this.isChecking = true;

    const allEndpoints = [API_CONFIG.primaryEndpoint, ...API_CONFIG.fallbackEndpoints];
    const lastGood = await AsyncStorage.getItem("last_good_endpoint");
    if (lastGood && !allEndpoints.includes(lastGood)) allEndpoints.unshift(lastGood);

    for (const endpoint of allEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000); // Super fast 1s check
        const response = await fetch(`${endpoint}/health`, {
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' }
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          this.currentEndpoint = endpoint;
          this.isLocalConnected = true;
          await AsyncStorage.setItem("last_good_endpoint", endpoint);
          this.isChecking = false;
          return true;
        }
      } catch (e) {
        continue;
      }
    }

    this.isLocalConnected = false;
    this.isChecking = false;
    return false;
  }

  /**
   * Super-Strong & FAST Request Wrapper
   */
  async powerfulRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    let lastError: any;
    let delay = API_CONFIG.retryConfig.initialDelay;

    for (let i = 0; i < API_CONFIG.retryConfig.maxRetries; i++) {
      try {
        const url = `${this.currentEndpoint}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s total timeout

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...options.headers,
            'Content-Type': 'application/json',
          }
        });
        clearTimeout(timeoutId);

        if (response.ok) return await response.json();

        if (response.status >= 400 && response.status < 500) {
            return await response.json();
        }
      } catch (err) {
        lastError = err;
        // If it's a connection error, trigger a background health check for next time
        if (i === 0) this.performHealthCheck();
      }

      await this.sleep(delay);
      delay = delay * 2;
    }

    throw lastError || new Error("Connection failed");
  }

  async getJobs(userState?: string): Promise<any> {
    // 1. Instant Memory Cache Return (The fastest)
    if (this.memoryCache && !userState) {
      // Trigger background update but return cache now
      this.backgroundFetchJobs(userState);
      return this.memoryCache;
    }

    try {
      const stateQuery = userState ? `?user_state=${encodeURIComponent(userState)}` : "";
      const data = await this.powerfulRequest(`/api/mobile/jobs${stateQuery}`);

      if (data?.success && Array.isArray(data.jobs)) {
        this.memoryCache = data;
        await AsyncStorage.setItem("last_jobs_cache", JSON.stringify({
          ts: Date.now(),
          jobs: data.jobs,
        }));
      }
      return data;
    } catch (e) {
      // 2. Fallback to storage cache immediately
      try {
        const cached = await AsyncStorage.getItem("last_jobs_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.jobs)) {
            const result = { success: true, jobs: parsed.jobs, source: 'cache_fallback' };
            this.memoryCache = result;
            return result;
          }
        }
      } catch {}

      // 3. Last resort fallback to Firebase
      try {
        const jobsRef = ref(db, 'jobs');
        const snapshot = await get(query(jobsRef, orderByKey(), limitToLast(100)));
        if (snapshot.exists()) {
          const jobsData = snapshot.val();
          return { success: true, jobs: Object.values(jobsData), source: 'cloud_emergency' };
        }
      } catch {}

      return { success: false, error: "System Offline" };
    }
  }

  private async backgroundFetchJobs(userState?: string) {
    try {
      const stateQuery = userState ? `?user_state=${encodeURIComponent(userState)}` : "";
      const data = await this.powerfulRequest(`/api/mobile/jobs${stateQuery}`);
      if (data?.success && Array.isArray(data.jobs)) {
        this.memoryCache = data;
      }
    } catch (e) {}
  }

  async submitApplication(applicationData: any) {
    return this.powerfulRequest("/api/applications", {
      method: "POST",
      body: JSON.stringify(applicationData),
    });
  }

  async sendUmmaCommand(message: string, isAdmin: boolean, userId?: string) {
    return this.powerfulRequest("/api/chat/umma", {
      method: "POST",
      body: JSON.stringify({ message, isAdmin, userId }),
    });
  }

  /** Alias for powerfulRequest — used by company registration and other screens */
  async request(endpoint: string, options: RequestInit = {}) {
    return this.powerfulRequest(endpoint, options);
  }

  async registerCompany(companyData: Record<string, string>) {
    return this.powerfulRequest("/api/company/register", {
      method: "POST",
      body: JSON.stringify(companyData),
    });
  }

  getBaseUrl(): string {
    return this.currentEndpoint;
  }

  getCompanyPortalUrl(): string {
    return `${this.currentEndpoint}/company`;
  }

  getMemoryCache(): any {
    return this.memoryCache;
  }
}

export const robustApiClient = new RobustApiClient();
