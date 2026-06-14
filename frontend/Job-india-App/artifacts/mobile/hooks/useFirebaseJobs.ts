import { useState, useEffect, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../utils/firebase";

export interface FirebaseJob {
  job_id: string;
  id?: string;
  title?: string;
  organization?: string;
  state?: string;
  location?: string;
  apply_link?: string;
  posted_at?: number;
  is_active?: boolean;
  category?: string;
  description?: string;
  eligibility?: string;
  skills?: string | null;
  experience?: string;
  requirements?: string | null;
  vacancies?: number;
  salaryMin?: number;
  salaryMax?: number;
  lastDate?: string;
  tags?: string[];
  applyUrl?: string;
  notification_link?: string;
}

let globalJobsCache: FirebaseJob[] = [];

export const getCachedJob = (id: string) =>
  globalJobsCache.find((j) => j.job_id === id || j.id === id);

export const setGlobalJobsCache = (jobs: FirebaseJob[]) => {
  // Merge or replace. Here we replace for simplicity or merge to keep both
  const uniqueJobs = new Map();
  [...globalJobsCache, ...jobs].forEach(j => {
    const id = j.job_id || j.id;
    if (id) uniqueJobs.set(id, j);
  });
  globalJobsCache = Array.from(uniqueJobs.values());
};

export const useFirebaseJobs = () => {
  const [jobs, setJobs] = useState<FirebaseJob[]>([]);
  const [loading, setLoading] = useState(true);
  const allJobsRef = useRef<Record<string, FirebaseJob>>({});

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const jobsRef = ref(db, "jobs");

    const unsubscribe = onValue(
      jobsRef,
      (snapshot) => {
        const categoriesData = snapshot.val();
        const resultsMap = new Map<string, FirebaseJob>();

        if (categoriesData) {
          Object.keys(categoriesData).forEach((cat) => {
            const jobsInCat = categoriesData[cat];
            if (jobsInCat && typeof jobsInCat === "object") {
              Object.keys(jobsInCat).forEach((id) => {
                const jobData = jobsInCat[id];
                const jobId = jobData.job_id || id;

                // Deduplicate based on job_id
                if (!resultsMap.has(jobId)) {
                  resultsMap.set(jobId, {
                    ...jobData,
                    job_id: jobId,
                    id: jobData.id || id,
                    category: cat,
                    applyUrl: jobData.apply_link || jobData.applyUrl,
                    notification_link: jobData.notification_link || null,
                  });
                }
              });
            }
          });
        }

        const results = Array.from(resultsMap.values());
        // Default Sort: Latest posted first
        results.sort((a, b) => (b.posted_at || 0) - (a.posted_at || 0));

        globalJobsCache = results;
        setJobs(results);
        setLoading(false);
      },
      (error) => {
        console.error("Firebase Jobs Sync Error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { jobs, loading };
};
