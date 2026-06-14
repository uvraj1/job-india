import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db, auth } from '../utils/firebase';

export function useFirebaseSync() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setSavedIds(new Set());
      setAppliedIds(new Set());
      setIsLoading(false);
      return;
    }

    const savedRef = ref(db, `saved_jobs/${user.uid}`);
    const unsubSaved = onValue(savedRef, (snapshot) => {
      if (snapshot.exists()) {
        setSavedIds(new Set(Object.keys(snapshot.val())));
      } else {
        setSavedIds(new Set());
      }
    });

    const appliedRef = ref(db, `applications/${user.uid}`);
    const unsubApplied = onValue(appliedRef, (snapshot) => {
      if (snapshot.exists()) {
        const apps = snapshot.val();
        const ids = new Set(Object.values(apps).map((a: any) => String(a.job_id)));
        setAppliedIds(ids);
      } else {
        setAppliedIds(new Set());
      }
      setIsLoading(false);
    });

    return () => {
      unsubSaved();
      unsubApplied();
    };
  }, []);

  return { savedIds, appliedIds, isLoading };
}
