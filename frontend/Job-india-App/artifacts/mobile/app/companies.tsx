import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface Company {
  id: string;
  name: string;
  industry: string;
  headquarters: string;
  description: string;
  logo: string;
  careerUrl: string;
}

const FAMOUS_COMPANIES: Company[] = [
  // Global
  {
    id: "1",
    name: "Google",
    industry: "Technology",
    headquarters: "USA",
    description: "Search, Cloud, AI, and Advertising.",
    logo: "google.com",
    careerUrl: "https://careers.google.com/",
  },
  {
    id: "2",
    name: "Apple",
    industry: "Electronics",
    headquarters: "USA",
    description: "Smartphones, Computers, and Services.",
    logo: "apple.com",
    careerUrl: "https://jobs.apple.com/",
  },
  {
    id: "3",
    name: "Microsoft",
    industry: "Software",
    headquarters: "USA",
    description: "Operating Systems, Cloud, and Gaming.",
    logo: "microsoft.com",
    careerUrl: "https://careers.microsoft.com/",
  },
  {
    id: "4",
    name: "Amazon",
    industry: "E-commerce",
    headquarters: "USA",
    description: "Online Retail, AWS, and Logistics.",
    logo: "amazon.com",
    careerUrl: "https://www.amazon.jobs/",
  },
  {
    id: "8",
    name: "Meta",
    industry: "Social Media",
    headquarters: "USA",
    description: "Social Networking and VR.",
    logo: "meta.com",
    careerUrl: "https://www.metacareers.com/",
  },
  {
    id: "7",
    name: "Tesla",
    industry: "Automotive",
    headquarters: "USA",
    description: "Electric Vehicles and Clean Energy.",
    logo: "tesla.com",
    careerUrl: "https://www.tesla.com/careers",
  },
  {
    id: "9",
    name: "Samsung",
    industry: "Conglomerate",
    headquarters: "South Korea",
    description: "Electronics and Semiconductors.",
    logo: "samsung.com",
    careerUrl: "https://careers.samsung.com/",
  },
  {
    id: "11",
    name: "Nvidia",
    industry: "Semiconductors",
    headquarters: "USA",
    description: "GPUs, AI, and Computing.",
    logo: "nvidia.com",
    careerUrl: "https://www.nvidia.com/en-us/about-nvidia/careers/",
  },
  {
    id: "12",
    name: "Netflix",
    industry: "Entertainment",
    headquarters: "USA",
    description: "Streaming and Production.",
    logo: "netflix.com",
    careerUrl: "https://jobs.netflix.com/",
  },
  {
    id: "13",
    name: "IBM",
    industry: "IT Services",
    headquarters: "USA",
    description: "Cloud computing and AI.",
    logo: "ibm.com",
    careerUrl: "https://www.ibm.com/careers/",
  },

  // India
  {
    id: "5",
    name: "TCS",
    industry: "IT Services",
    headquarters: "India",
    description: "Consulting and IT solutions.",
    logo: "tcs.com",
    careerUrl: "https://www.tcs.com/careers",
  },
  {
    id: "6",
    name: "Reliance",
    industry: "Conglomerate",
    headquarters: "India",
    description: "Telecom, Retail, and Energy.",
    logo: "ril.com",
    careerUrl: "https://www.ril.com/careers",
  },
  {
    id: "10",
    name: "Infosys",
    industry: "IT Services",
    headquarters: "India",
    description: "Digital Services and Consulting.",
    logo: "infosys.com",
    careerUrl: "https://www.infosys.com/careers.html",
  },
  {
    id: "14",
    name: "HDFC Bank",
    industry: "Banking",
    headquarters: "India",
    description: "Financial Services and Banking.",
    logo: "hdfcbank.com",
    careerUrl: "https://www.hdfcbank.com/personal/about-us/careers",
  },
  {
    id: "15",
    name: "Wipro",
    industry: "IT Services",
    headquarters: "India",
    description: "Tech consulting and BPO.",
    logo: "wipro.com",
    careerUrl: "https://careers.wipro.com/",
  },
  {
    id: "16",
    name: "L&T",
    industry: "Engineering",
    headquarters: "India",
    description: "Construction and Manufacturing.",
    logo: "larsentoubro.com",
    careerUrl: "https://www.larsentoubro.com/corporate/careers/",
  },
  {
    id: "17",
    name: "ICICI Bank",
    industry: "Banking",
    headquarters: "India",
    description: "Financial Services.",
    logo: "icicibank.com",
    careerUrl: "https://careers.icicibank.com/",
  },
  {
    id: "18",
    name: "HCLTech",
    industry: "IT Services",
    headquarters: "India",
    description: "Enterprise tech and consulting.",
    logo: "hcltech.com",
    careerUrl: "https://www.hcltech.com/careers",
  },
  {
    id: "19",
    name: "Tata Motors",
    industry: "Automotive",
    headquarters: "India",
    description: "Commercial and passenger vehicles.",
    logo: "tatamotors.com",
    careerUrl: "https://www.tatamotors.com/careers/",
  },
  {
    id: "20",
    name: "Mahindra",
    industry: "Conglomerate",
    headquarters: "India",
    description: "Automotive, Farm, and IT.",
    logo: "mahindra.com",
    careerUrl: "https://jobs.mahindra.com/",
  },
];

export default function CompaniesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const filtered = FAMOUS_COMPANIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase()),
  );

  const renderItem = ({ item }: { item: Company }) => (
    <TouchableOpacity
      style={[
        styles.companyCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      activeOpacity={0.7}
      onPress={() => Linking.openURL(item.careerUrl)}
    >
      <View style={styles.iconBox}>
        <Image
          source={{ uri: `https://icon.horse/icon/${item.logo}` }}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {item.name}
        </Text>
        <Text style={[styles.industry, { color: colors.primary }]}>
          {item.industry} • {item.headquarters}
        </Text>
        <Text
          style={[styles.desc, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
        <View style={[styles.viewJobsBtn, { backgroundColor: colors.accent }]}>
          <Text style={[styles.viewJobsText, { color: colors.secondary }]}>
            View Openings
          </Text>
          <Feather name="external-link" size={12} color={colors.secondary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Status Bar Background */}
      <View
        style={{
          height: insets.top,
          backgroundColor: colors.primary,
          width: "100%",
          zIndex: 10,
          position: "absolute",
          top: 0,
        }}
      />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, backgroundColor: colors.primary },
        ]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hiring Company</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search famous companies..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 20 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="frown" size={48} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, marginTop: 12 }}>
              No companies found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  backBtn: { padding: 4 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },
  list: { padding: 16, gap: 16 },
  companyCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    padding: 8,
    overflow: "hidden",
  },
  logoImage: { width: "100%", height: "100%" },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: "700", marginBottom: 2 },
  industry: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  desc: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  viewJobsBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewJobsText: { fontSize: 12, fontWeight: "700" },
  empty: { marginTop: 100, alignItems: "center" },
});
