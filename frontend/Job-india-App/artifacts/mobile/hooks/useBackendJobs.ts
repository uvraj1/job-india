import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useRef } from "react";
import { robustApiClient } from "../utils/robustApiClient";
import { FirebaseJob, setGlobalJobsCache } from "./useFirebaseJobs";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 min background refresh
const JOBS_CACHE_KEY = "last_jobs_cache";

function mapJob(j: any): FirebaseJob {
  return {
    job_id: j.job_id || j.id || String(j.title || ""),
    id: j.id || j.job_id,
    title: j.title,
    organization: j.organization || j.company,
    state: j.state,
    location: j.location || j.state,
    apply_link: j.apply_link || j.applyUrl,
    posted_at: j.posted_at || j.postedAt,
    is_active: j.is_active !== false,
    category: j.category,
    description: j.description,
    eligibility: j.eligibility,
    skills: j.skills || null,
    experience: j.experience,
    requirements: j.requirements || null,
    vacancies: j.vacancies,
    salaryMin: j.salaryMin || j.salary_min,
    salaryMax: j.salaryMax || j.salary_max,
    lastDate: j.lastDate || j.last_date,
    tags: Array.isArray(j.tags) ? j.tags : [],
    applyUrl: j.apply_link || j.applyUrl,
    notification_link: j.notification_link || null,
  };
}

export const useBackendJobs = () => {
  const [jobs, setJobs] = useState<FirebaseJob[]>([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  const loadCachedJobs = async (): Promise<boolean> => {
    try {
      const cached = await AsyncStorage.getItem(JOBS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.jobs) && parsed.jobs.length > 0 && isMounted.current) {
          const mapped = parsed.jobs.map(mapJob);
          setGlobalJobsCache(mapped);
          setJobs(mapped);
          setLoading(false);
          return true;
        }
      }
    } catch {}
    return false;
  };

  const fetchJobs = async (isBackground = false) => {
    try {
      const data = await robustApiClient.getJobs();
      if (!isMounted.current) return;

      if (data?.success && Array.isArray(data.jobs)) {
        const mapped = data.jobs.map(mapJob);
        setGlobalJobsCache(mapped);
        setJobs(mapped);
      }
    } catch (e) {
      console.error("useBackendJobs: fetch error", e);
    } finally {
      if (!isBackground && isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;

    // Show cached jobs instantly, then refresh in background
    loadCachedJobs().then((hasCached) => {
      fetchJobs(hasCached);
    });

    const interval = setInterval(() => fetchJobs(true), POLL_INTERVAL_MS);
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []);

  return { jobs, loading };
};
