import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

// ─── Types ────────────────────────────────────────────────────────────────────
export type FilterCountry =
  | "all"
  | "India"
  | "USA"
  | "UK"
  | "UAE"
  | "Canada"
  | "Australia";

export type FilterSector = "all" | "government" | "private";
export type FilterSubSector =
  | "all"
  | "central_govt"
  | "state_govt"
  | "banking"
  | "railways";
export type FilterJobType =
  | "all"
  | "full-time"
  | "part-time"
  | "remote"
  | "internship";

export interface FilterState {
  country: FilterCountry;
  sector: FilterSector;
  subSector: FilterSubSector;
  state: string;
  jobType: FilterJobType;
  studentFriendly: boolean;
}

export const DEFAULT_FILTER: FilterState = {
  country: "all",
  sector: "all",
  subSector: "all",
  state: "",
  jobType: "all",
  studentFriendly: false,
};

export function filterCount(f: FilterState): number {
  let c = 0;
  if (f.country !== "all") c++;
  if (f.sector !== "all") c++;
  if (f.subSector !== "all") c++;
  if (f.state) c++;
  if (f.jobType !== "all") c++;
  if (f.studentFriendly) c++;
  return c;
}

type FilterableJob = {
  category?: string;
  state?: string;
  location?: string;
  country?: string;
  jobType?: string;
  tags?: string[];
  title?: string;
};

const SUB_SECTOR_TO_CATEGORY: Record<string, string> = {
  central_govt: "category_central_govt",
  state_govt: "category_state_govt",
  banking: "category_central_govt",
  railways: "category_central_govt",
};

const COUNTRY_MATCHERS: Record<Exclude<FilterCountry, "all">, RegExp[]> = {
  India: [/\bindia\b/i],
  USA: [/\busa\b/i, /united states/i, /america/i, /new york/i, /california/i],
  UK: [/\buk\b/i, /united kingdom/i, /england/i, /london/i],
  UAE: [/\buae\b/i, /dubai/i, /abu dhabi/i, /united arab emirates/i],
  Canada: [/\bcanada\b/i, /toronto/i, /vancouver/i],
  Australia: [/\baustralia\b/i, /sydney/i, /melbourne/i],
};

const JOB_TYPE_MATCHERS: Record<Exclude<FilterJobType, "all">, RegExp[]> = {
  "full-time": [/full[-\s]?time/i, /permanent/i, /regular role/i],
  "part-time": [/part[-\s]?time/i, /flexible hours/i],
  remote: [/remote/i, /wfh/i, /work from home/i, /hybrid/i],
  internship: [/internship/i, /intern\b/i, /trainee/i, /apprentice/i],
};

function inferCountry(job: FilterableJob): FilterCountry {
  const haystack =
    `${job.country ?? ""} ${job.location ?? ""} ${job.state ?? ""}`.trim();
  if (!haystack) return "India";

  for (const [country, matchers] of Object.entries(COUNTRY_MATCHERS) as [
    FilterCountry,
    RegExp[],
  ][]) {
    if (matchers.some((matcher) => matcher.test(haystack))) {
      return country;
    }
  }

  return "India";
}

function inferJobType(
  job: FilterableJob,
): Exclude<FilterJobType, "all"> | null {
  const haystack = [job.jobType, job.title, job.location, ...(job.tags ?? [])]
    .filter(Boolean)
    .join(" ");

  if (!haystack.trim()) return null;

  for (const [jobType, matchers] of Object.entries(JOB_TYPE_MATCHERS) as [
    Exclude<FilterJobType, "all">,
    RegExp[],
  ][]) {
    if (matchers.some((matcher) => matcher.test(haystack))) {
      return jobType;
    }
  }

  return null;
}

export function jobMatchesFilter(job: FilterableJob, f: FilterState): boolean {
  if (f.country !== "all") {
    const jobCountry = inferCountry(job);
    if (jobCountry !== f.country) return false;
  }

  const category = job.category ?? "";
  const isGovt =
    category.includes("govt") ||
    category.includes("central") ||
    category.includes("state");
  const isPrivate = category.includes("private");

  if (f.sector === "government" && !isGovt) return false;
  if (f.sector === "private" && !isPrivate) return false;

  if (f.subSector !== "all") {
    const expected = SUB_SECTOR_TO_CATEGORY[f.subSector];
    if (expected && category !== expected) return false;
  }

  if (f.state.trim()) {
    const stateQuery = f.state.trim().toLowerCase();
    const jobState = String(job.state ?? job.location ?? "").toLowerCase();
    if (!jobState.includes(stateQuery)) return false;
  }

  if (f.jobType !== "all") {
    const inferredJobType = inferJobType(job);

    if (f.jobType === "full-time") {
      if (inferredJobType && inferredJobType !== "full-time") return false;
    } else if (inferredJobType !== f.jobType) {
      return false;
    }
  }

  if (f.studentFriendly) {
    const tags = (job.tags ?? []).map((t) => t.toLowerCase());
    const title = (job.title ?? "").toLowerCase();
    const studentMatch =
      tags.some(
        (t) =>
          t.includes("student") ||
          t.includes("fresher") ||
          t.includes("intern"),
      ) ||
      title.includes("fresher") ||
      title.includes("intern");
    if (!studentMatch) return false;
  }

  return true;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const COUNTRIES: { key: FilterCountry; label: string; flag: string }[] = [
  { key: "all", label: "All Countries", flag: "🌍" },
  { key: "India", label: "India", flag: "🇮🇳" },
  { key: "USA", label: "United States", flag: "🇺🇸" },
  { key: "UK", label: "United Kingdom", flag: "🇬🇧" },
  { key: "UAE", label: "UAE / Dubai", flag: "🇦🇪" },
  { key: "Canada", label: "Canada", flag: "🇨🇦" },
  { key: "Australia", label: "Australia", flag: "🇦🇺" },
];

const SECTORS: {
  key: FilterSector;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}[] = [
  { key: "all", label: "All Sectors", icon: "layers", color: "#6B7A8D" },
  {
    key: "government",
    label: "Government Jobs",
    icon: "shield",
    color: "#1A3A5C",
  },
  {
    key: "private",
    label: "Private Sector",
    icon: "briefcase",
    color: "#E07B39",
  },
];

const SUB_SECTORS: {
  key: FilterSubSector;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}[] = [
  { key: "all", label: "All Govt", icon: "layers", color: "#6B7A8D" },
  {
    key: "central_govt",
    label: "Central Govt (UPSC/SSC/DRDO)",
    icon: "flag",
    color: "#1A3A5C",
  },
  {
    key: "state_govt",
    label: "State Govt (PSC)",
    icon: "map-pin",
    color: "#2D6A4F",
  },
  {
    key: "banking",
    label: "Banking (IBPS/SBI)",
    icon: "credit-card",
    color: "#6B4226",
  },
  { key: "railways", label: "Railways (RRB)", icon: "truck", color: "#7B2D8B" },
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Chandigarh",
  "Puducherry",
];

function normalizeSearch(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

const STATE_ALIASES: Record<string, string> = {
  up: "Uttar Pradesh",
  mp: "Madhya Pradesh",
  mh: "Maharashtra",
  tn: "Tamil Nadu",
  ap: "Andhra Pradesh",
  ts: "Telangana",
  wb: "West Bengal",
  jk: "Jammu & Kashmir",
  hp: "Himachal Pradesh",
  uk: "Uttarakhand",
  cg: "Chhattisgarh",
  pb: "Punjab",
  hr: "Haryana",
  gj: "Gujarat",
  kl: "Kerala",
  ka: "Karnataka",
  br: "Bihar",
  rj: "Rajasthan",
  or: "Odisha",
  as: "Assam",
  dl: "Delhi",
};

function filterStates(query: string): string[] {
  const q = normalizeSearch(query);
  if (!q) return INDIAN_STATES;

  const aliasMatch = STATE_ALIASES[q];
  const matches = INDIAN_STATES.filter((state) => {
    const normalized = normalizeSearch(state);
    return (
      normalized.includes(q) ||
      normalized.split(" ").some((word) => word.startsWith(q)) ||
      state.replace(/&/g, "and").toLowerCase().includes(q)
    );
  });

  if (aliasMatch && !matches.includes(aliasMatch)) {
    return [aliasMatch, ...matches];
  }
  return matches;
}

const JOB_TYPES: {
  key: FilterJobType;
  label: string;
  emoji: string;
  desc: string;
}[] = [
  { key: "all", label: "All Types", emoji: "💼", desc: "Show every job type" },
  {
    key: "full-time",
    label: "Full-time",
    emoji: "🏢",
    desc: "Regular 9-to-5 roles",
  },
  { key: "part-time", label: "Part-time", emoji: "⏰", desc: "Flexible hours" },
  {
    key: "remote",
    label: "Remote / WFH",
    emoji: "🏠",
    desc: "Work from anywhere",
  },
  {
    key: "internship",
    label: "Internship",
    emoji: "🎓",
    desc: "Trainee / Intern roles",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function StateSearchPicker({
  visible,
  selected,
  onClose,
  onConfirm,
  colors,
}: {
  visible: boolean;
  selected: string;
  onClose: () => void;
  onConfirm: (state: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(selected);

  useEffect(() => {
    if (visible) {
      setPending(selected);
      setQuery("");
    }
  }, [visible, selected]);

  const filtered = useMemo(() => filterStates(query), [query]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={ss.pickerOverlay}>
        <View style={[ss.pickerSheet, { backgroundColor: colors.background }]}>
          <View style={[ss.pickerHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[ss.pickerTitle, { color: colors.foreground }]}>
                Select State
              </Text>
              <Text style={[ss.pickerSub, { color: colors.mutedForeground }]}>
                Search and select your location
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[ss.closeBtn, { backgroundColor: colors.muted }]}
            >
              <Feather name="x" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={[ss.pickerSearchBox, { backgroundColor: colors.muted }]}>
            <Feather name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[ss.pickerSearchInput, { color: colors.foreground }]}
              placeholder="Search state..."
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="words"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Feather
                  name="x-circle"
                  size={18}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            style={ss.stateList}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => {
              const isSel = pending === item;
              return (
                <TouchableOpacity
                  style={[
                    ss.stateRow,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor: isSel
                        ? colors.primary + "08"
                        : "transparent",
                    },
                  ]}
                  onPress={() => setPending(item)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      ss.stateIcon,
                      {
                        backgroundColor: isSel ? colors.primary : colors.muted,
                      },
                    ]}
                  >
                    <Feather
                      name="map-pin"
                      size={14}
                      color={isSel ? "#fff" : colors.mutedForeground}
                    />
                  </View>
                  <Text
                    style={[
                      ss.stateRowText,
                      {
                        color: isSel ? colors.primary : colors.foreground,
                        fontWeight: isSel ? "700" : "500",
                      },
                    ]}
                  >
                    {item}
                  </Text>
                  {isSel && (
                    <Feather
                      name="check-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={ss.stateEmpty}>
                <Feather
                  name="search"
                  size={32}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[ss.stateEmptyText, { color: colors.mutedForeground }]}
                >
                  No states found for "{query}"
                </Text>
              </View>
            }
          />

          <View style={[ss.pickerFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[ss.clearBtn, { borderColor: colors.border }]}
              onPress={() => {
                setPending("");
                onConfirm("");
                onClose();
              }}
            >
              <Text
                style={[ss.clearBtnText, { color: colors.mutedForeground }]}
              >
                Clear
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                ss.confirmBtnLarge,
                { backgroundColor: pending ? colors.primary : colors.muted },
              ]}
              onPress={() => {
                if (!pending) return;
                onConfirm(pending);
                onClose();
              }}
              disabled={!pending}
              activeOpacity={0.85}
            >
              <Text style={ss.confirmBtnTextLarge}>Confirm State</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SectionTitle({
  title,
  subtitle,
  colors,
}: {
  title: string;
  subtitle?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={[ss.sectionTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[ss.sectionSub, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  onClose: () => void;
  value: FilterState;
  onChange: (f: FilterState) => void;
  onApply: (f: FilterState) => void;
}

export default function SmartFilter({
  visible,
  onClose,
  value,
  onChange,
  onApply,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [local, setLocal] = useState<FilterState>(value);
  const [showStatePicker, setShowStatePicker] = useState(false);

  // Sync local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocal(value);
    }
  }, [visible, value]);

  const update = (patch: Partial<FilterState>) =>
    setLocal((prev) => ({ ...prev, ...patch }));

  const handleCountryChange = (country: FilterCountry) => {
    if (country === "India" || country === "all") {
      setLocal((prev) => ({ ...prev, country, studentFriendly: false }));
    } else {
      setLocal((prev) => ({
        ...prev,
        country,
        sector: "all",
        subSector: "all",
        state: "",
        studentFriendly: true,
      }));
    }
  };

  const handleSectorChange = (sector: FilterSector) => {
    if (sector !== "government") {
      setLocal((prev) => ({ ...prev, sector, subSector: "all", state: "" }));
    } else {
      setLocal((prev) => ({ ...prev, sector }));
    }
  };

  const handleSubSectorChange = (subSector: FilterSubSector) => {
    setLocal((prev) => ({ ...prev, subSector }));
  };

  const openStatePicker = () => setShowStatePicker(true);

  const handleApply = () => {
    onChange(local);
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    setLocal(DEFAULT_FILTER);
  };

  const isIndia = local.country === "all" || local.country === "India";
  const isGovt = local.sector === "all" || local.sector === "government";
  const showStateFilter = isIndia;

  const activeFiltersCount = filterCount(local);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[ss.modalRoot, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            ss.modalHeader,
            {
              backgroundColor: colors.primary,
              paddingTop: Platform.OS === "web" ? 16 : insets.top + 8,
            },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="x" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={ss.modalTitle}>Filter</Text>
            {activeFiltersCount > 0 && (
              <Text style={ss.modalSub}>
                {activeFiltersCount} filter{activeFiltersCount > 1 ? "s" : ""}{" "}
                active
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleReset}>
            <Text style={ss.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[
            ss.scroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: Country Selection */}
          <View
            style={[
              ss.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <SectionTitle
              title="Step 1 — Country"
              subtitle="Select where you want to work"
              colors={colors}
            />
            {COUNTRIES.map((c) => {
              const selected = local.country === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  style={[
                    ss.optionRow,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected
                        ? colors.primary + "12"
                        : "transparent",
                    },
                  ]}
                  onPress={() => handleCountryChange(c.key)}
                  activeOpacity={0.7}
                >
                  <Text style={ss.flag}>{c.flag}</Text>
                  <Text
                    style={[
                      ss.optionLabel,
                      { color: selected ? colors.primary : colors.foreground },
                    ]}
                  >
                    {c.label}
                  </Text>
                  {selected && (
                    <Feather
                      name="check-circle"
                      size={18}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Non-India notice */}
          {local.country !== "all" && local.country !== "India" && (
            <View
              style={[
                ss.infoBox,
                { backgroundColor: "#FFF3EA", borderColor: colors.secondary },
              ]}
            >
              <Feather name="zap" size={16} color={colors.secondary} />
              <Text style={[ss.infoText, { color: colors.secondary }]}>
                We'll prioritize student-friendly, entry-level, and
                fresher-friendly jobs for {local.country} when available.
              </Text>
            </View>
          )}

          {/* STEP 2: Sector (India only) */}
          {isIndia && (
            <View
              style={[
                ss.section,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <SectionTitle
                title="Step 2 — Sector"
                subtitle="Government or Private sector?"
                colors={colors}
              />
              <View style={ss.sectorRow}>
                {SECTORS.map((s) => {
                  const selected = local.sector === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[
                        ss.sectorCard,
                        {
                          borderColor: selected ? s.color : colors.border,
                          backgroundColor: selected ? s.color : colors.muted,
                        },
                      ]}
                      onPress={() => handleSectorChange(s.key)}
                      activeOpacity={0.7}
                    >
                      <Feather
                        name={s.icon}
                        size={20}
                        color={selected ? "#fff" : colors.mutedForeground}
                      />
                      <Text
                        style={[
                          ss.sectorLabel,
                          { color: selected ? "#fff" : colors.foreground },
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 3: Sub-Sector (India + Govt) */}
          {isIndia && isGovt && local.sector === "government" && (
            <View
              style={[
                ss.section,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <SectionTitle
                title="Step 3 — Government Type"
                subtitle="Central or State government?"
                colors={colors}
              />
              {SUB_SECTORS.map((s) => {
                const selected = local.subSector === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    style={[
                      ss.optionRow,
                      {
                        borderColor: selected ? s.color : colors.border,
                        backgroundColor: selected
                          ? s.color + "15"
                          : "transparent",
                      },
                    ]}
                    onPress={() => handleSubSectorChange(s.key)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        ss.subIcon,
                        { backgroundColor: selected ? s.color : colors.muted },
                      ]}
                    >
                      <Feather
                        name={s.icon}
                        size={14}
                        color={selected ? "#fff" : colors.mutedForeground}
                      />
                    </View>
                    <Text
                      style={[
                        ss.optionLabel,
                        {
                          color: selected ? s.color : colors.foreground,
                          flex: 1,
                        },
                      ]}
                    >
                      {s.label}
                    </Text>
                    {selected && (
                      <Feather name="check-circle" size={18} color={s.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* State filter (India) — searchable + confirm */}
          {showStateFilter && (
            <View
              style={[
                ss.section,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <SectionTitle
                title={
                  isGovt && local.sector === "government"
                    ? "Step 4 — Your State"
                    : "Filter by State"
                }
                subtitle="Select your preferred location"
                colors={colors}
              />
              <TouchableOpacity
                style={[
                  ss.statePickerBtn,
                  {
                    borderColor: local.state ? colors.primary : colors.border,
                    backgroundColor: local.state
                      ? colors.primary + "05"
                      : colors.muted,
                  },
                ]}
                onPress={openStatePicker}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    ss.miniIcon,
                    {
                      backgroundColor: local.state
                        ? colors.primary
                        : colors.mutedForeground + "20",
                    },
                  ]}
                >
                  <Feather
                    name="map-pin"
                    size={14}
                    color={local.state ? "#fff" : colors.mutedForeground}
                  />
                </View>
                <Text
                  style={[
                    ss.statePickerText,
                    {
                      color: local.state
                        ? colors.foreground
                        : colors.mutedForeground,
                      fontWeight: local.state ? "700" : "500",
                    },
                  ]}
                >
                  {local.state || "Search & select your state..."}
                </Text>
                <Feather
                  name="chevron-right"
                  size={18}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>

              <StateSearchPicker
                visible={showStatePicker}
                selected={local.state}
                onClose={() => setShowStatePicker(false)}
                onConfirm={(state) => update({ state })}
                colors={colors}
              />
            </View>
          )}

          {/* Job Type */}
          <View
            style={[
              ss.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <SectionTitle
              title="Job Type"
              subtitle="Filter by work arrangement"
              colors={colors}
            />
            <View style={ss.jobTypeGrid}>
              {JOB_TYPES.map((jt) => {
                const selected = local.jobType === jt.key;
                return (
                  <TouchableOpacity
                    key={jt.key}
                    style={[
                      ss.jobTypeCard,
                      {
                        borderColor: selected
                          ? colors.secondary
                          : colors.border,
                        backgroundColor: selected ? "#FFF3EA" : colors.muted,
                      },
                    ]}
                    onPress={() => update({ jobType: jt.key })}
                    activeOpacity={0.7}
                  >
                    <Text style={ss.jobTypeEmoji}>{jt.emoji}</Text>
                    <Text
                      style={[
                        ss.jobTypeLabel,
                        {
                          color: selected
                            ? colors.secondary
                            : colors.foreground,
                        },
                      ]}
                    >
                      {jt.label}
                    </Text>
                    <Text
                      style={[
                        ss.jobTypeDesc,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {jt.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Student Friendly toggle */}
          <TouchableOpacity
            style={[
              ss.toggleCard,
              {
                backgroundColor: local.studentFriendly
                  ? "#E8F5E9"
                  : colors.card,
                borderColor: local.studentFriendly
                  ? colors.success
                  : colors.border,
              },
            ]}
            onPress={() => update({ studentFriendly: !local.studentFriendly })}
            activeOpacity={0.8}
          >
            <View
              style={[
                ss.toggleIcon,
                {
                  backgroundColor: local.studentFriendly
                    ? colors.success
                    : colors.muted,
                },
              ]}
            >
              <Feather
                name="star"
                size={20}
                color={local.studentFriendly ? "#fff" : colors.mutedForeground}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  ss.toggleLabel,
                  {
                    color: local.studentFriendly
                      ? colors.success
                      : colors.foreground,
                  },
                ]}
              >
                Student-Friendly Only
              </Text>
              <Text style={[ss.toggleSub, { color: colors.mutedForeground }]}>
                Freshers welcome • No experience required • 0-1 yr roles
              </Text>
            </View>
            <View
              style={[
                ss.checkbox,
                {
                  borderColor: local.studentFriendly
                    ? colors.success
                    : colors.border,
                  backgroundColor: local.studentFriendly
                    ? colors.success
                    : "transparent",
                },
              ]}
            >
              {local.studentFriendly && (
                <Feather name="check" size={14} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Apply Button */}
        <View
          style={[
            ss.footer,
            { borderTopColor: colors.border, paddingBottom: insets.bottom + 8 },
          ]}
        >
          <TouchableOpacity
            style={[ss.applyBtn, { backgroundColor: colors.primary }]}
            onPress={handleApply}
            activeOpacity={0.85}
          >
            <Feather name="filter" size={18} color="#fff" />
            <Text style={ss.applyText}>
              Apply Filters
              {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const ss = StyleSheet.create({
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "800" as const, color: "#fff" },
  modalSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  resetText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "rgba(255,255,255,0.8)",
  },
  scroll: { padding: 16, gap: 12 },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "700" as const },
  sectionSub: { fontSize: 12, marginTop: 2 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  flag: { fontSize: 22 },
  optionLabel: { fontSize: 15, fontWeight: "500" as const, flex: 1 },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
  },
  infoText: {
    fontSize: 13,
    fontWeight: "500" as const,
    flex: 1,
    lineHeight: 18,
  },
  sectorRow: { flexDirection: "row", gap: 8 },
  sectorCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  sectorLabel: {
    fontSize: 12,
    fontWeight: "700" as const,
    textAlign: "center",
  },
  subIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  statePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  statePickerText: { flex: 1, fontSize: 14, fontWeight: "500" as const },
  miniIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    height: "80%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  pickerTitle: { fontSize: 20, fontWeight: "800" },
  pickerSub: { fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  clearBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  clearBtnText: { fontSize: 15, fontWeight: "700" as const },
  confirmBtnLarge: {
    flex: 2,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
  },
  confirmBtnTextLarge: {
    fontSize: 15,
    fontWeight: "800" as const,
    color: "#fff",
  },
  pickerSearchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  pickerSearchInput: { flex: 1, fontSize: 16 },
  stateList: { flex: 1 },
  stateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 14,
  },
  stateIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  stateRowText: { fontSize: 16, flex: 1 },
  stateEmpty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  stateEmptyText: { fontSize: 16, fontWeight: "600" },
  jobTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  jobTypeCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 4,
  },
  jobTypeEmoji: { fontSize: 22 },
  jobTypeLabel: { fontSize: 13, fontWeight: "700" as const },
  jobTypeDesc: { fontSize: 11 },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  toggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleLabel: { fontSize: 15, fontWeight: "700" as const, marginBottom: 3 },
  toggleSub: { fontSize: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: { padding: 16, borderTopWidth: 1, backgroundColor: "transparent" },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 15,
  },
  applyText: { fontSize: 16, fontWeight: "800" as const, color: "#fff" },
});
