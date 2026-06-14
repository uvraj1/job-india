export function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildProfileUpdate(overrides: any, profile?: any): any {
  return {
    ...profile,
    ...overrides,
    name: overrides.name ?? profile?.name,
    phone: overrides.phone ?? profile?.phone ?? undefined,
    dateOfBirth: overrides.dateOfBirth ?? profile?.dateOfBirth ?? undefined,
    gender: overrides.gender ?? profile?.gender ?? undefined,
    address: overrides.address ?? profile?.address ?? undefined,
    city: overrides.city ?? profile?.city ?? undefined,
    state: overrides.state ?? profile?.state ?? undefined,
    category: overrides.category ?? profile?.category ?? undefined,
    about: overrides.about ?? profile?.about ?? undefined,
    skills: overrides.skills ?? profile?.skills ?? [],
    education: overrides.education ?? profile?.education ?? [],
    experience: overrides.experience ?? profile?.experience ?? [],
    certifications: overrides.certifications ?? profile?.certifications ?? [],
    resumeUrl: overrides.resumeUrl ?? profile?.resumeUrl ?? undefined,
    profilePhotoUrl:
      overrides.profilePhotoUrl !== undefined
        ? overrides.profilePhotoUrl
        : (profile?.profilePhotoUrl ?? undefined),
  };
}

export function emptyEducation(): any {
  return {
    id: newId("edu"),
    degree: "",
    institution: "",
    year: "",
    grade: null,
  };
}

export function emptyExperience(): any {
  return {
    id: newId("exp"),
    company: "",
    role: "",
    from: "",
    to: null,
    current: false,
    description: null,
  };
}

export function sanitizeEducation(items: any[]): any[] {
  return items
    .filter((e) => e.degree?.trim() && e.institution?.trim() && e.year?.trim())
    .map((e) => ({
      id: e.id || newId("edu"),
      degree: e.degree.trim(),
      institution: e.institution.trim(),
      year: e.year.trim(),
      grade: e.grade?.trim() || null,
    }));
}

export function sanitizeExperience(items: any[]): any[] {
  return items
    .filter((e) => e.company?.trim() && e.role?.trim() && e.from?.trim())
    .map((e) => ({
      id: e.id || newId("exp"),
      company: e.company.trim(),
      role: e.role.trim(),
      from: e.from.trim(),
      to: e.current ? null : e.to?.trim() || null,
      current: e.current,
      description: e.description?.trim() || null,
    }));
}
