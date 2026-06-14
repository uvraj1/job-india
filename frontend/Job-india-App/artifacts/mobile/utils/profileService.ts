import { ref, set, get, update } from "firebase/database";
import { db } from "./firebase";

export async function saveProfileToFirebase(userId: string, data: any) {
  try {
    const profileRef = ref(db, `profiles/${userId}`);
    await set(profileRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("Error saving profile to Firebase:", error);
    throw error;
  }
}

export async function getProfileFromFirebase(userId: string) {
  try {
    const profileRef = ref(db, `profiles/${userId}`);
    const snapshot = await get(profileRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Error getting profile from Firebase:", error);
    throw error;
  }
}

export function calculateProfileScore(profile: any): number {
  let score = 0;
  if (profile.name) score += 10;
  if (profile.phone) score += 5;
  if (profile.dateOfBirth) score += 10;
  if (profile.gender) score += 5;
  if (profile.address) score += 5;
  if (profile.city) score += 5;
  if (profile.state) score += 5;
  if (profile.category) score += 5;
  if (profile.skills && profile.skills.length > 0) score += 15;
  if (profile.education && profile.education.length > 0) score += 15;
  if (profile.experience && profile.experience.length > 0) score += 10;

  // New: Score for Social/Portfolio links
  if (profile.portfolioUrl) score += 5;
  if (profile.linkedinUrl) score += 5;
  if (profile.githubUrl) score += 5;
  if (profile.resumeUrl) score += 5;

  return Math.min(100, score);
}
