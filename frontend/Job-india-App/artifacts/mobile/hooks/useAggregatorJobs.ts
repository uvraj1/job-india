import { useState, useEffect } from "react";
import { FirebaseJob } from "./useFirebaseJobs";
import { robustApiClient } from "../utils/robustApiClient";

export interface AggregatorJob {
  id: string;
  title: string;
  organization: string;
  location: string;
  salary: string;
  job_type: string;
  job_class?: string;
  description: string;
  last_date: string;
  link: string;
  fetched_at: string;
  status: string;
  skills?: string;
  experience?: string;
  requirements?: string;
  minimum_qualification?: string;
}

export const useAggregatorJobs = (userState?: string) => {
  const [jobs, setJobs] = useState<AggregatorJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching jobs from robustApiClient");
        const data = await robustApiClient.getJobs(userState);
        
        if (data.success) {
          setJobs(data.jobs);
          console.log("Jobs loaded successfully:", data.jobs.length);
        } else {
          setError(data.error || "Failed to fetch jobs");
        }
      } catch (err) {
        console.error("Error fetching aggregator jobs:", err);
        setError("Failed to connect to job aggregator");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchJobs, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [userState]);

  return { jobs, loading, error };
};

export const convertAggregatorToFirebaseJob = (job: AggregatorJob): FirebaseJob => {
  if (!job) {
    return { id: 'error', job_id: 'error', title: 'Invalid Job Data', organization: 'Error', location: 'Unknown', category: 'category_private', is_active: false, tags: [] };
  }

  // Logic: Use the job_class from aggregator for precise categorization
  const isGov = String(job.job_class || '').toLowerCase() === 'government';
  const isIntern = String(job.job_class || '').toLowerCase() === 'internship';

  // Map job_class to readable category
  let category = 'category_private';
  if (isGov) category = 'category_central_govt';
  if (isIntern) category = 'internship';

  // Safe Date parsing
  let postedAt = Date.now();
  if (job.fetched_at) {
    const parsed = new Date(job.fetched_at).getTime();
    if (!isNaN(parsed)) postedAt = parsed;
  }

  // Generate a stable fallback ID from the link if id is missing
  const stableId = job.id || (job.link ? String(job.link).replace(/[^a-zA-Z0-9]/g, "") : String(Math.random()));

  return {
    job_id: String(stableId),
    id: String(stableId),
    title: job.title || 'Untitled Position',
    organization: job.organization || 'Hiring Organization',
    state: (job.location || 'India').split(',')[0]?.trim(),
    location: job.location || 'India',
    apply_link: job.link || '#',
    posted_at: postedAt,
    is_active: job.status === 'active' || !job.status,
    category: category,
    description: job.description || 'No description provided.',
    lastDate: job.last_date || '',
    salaryMin: undefined,
    salaryMax: undefined,
    tags: [
      isGov ? 'Government' : isIntern ? 'Internship' : 'Private Sector',
      job.job_type
    ].filter(Boolean),
    eligibility: job.minimum_qualification,
    skills: job.skills,
    experience: job.experience,
    requirements: job.requirements,
  };
};
