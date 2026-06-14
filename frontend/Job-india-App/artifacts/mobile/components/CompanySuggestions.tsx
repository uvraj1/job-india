import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInRight } from "react-native-reanimated";

const COMPANIES = [
  { id: "in-1", name: "Reliance", logo: "ril.com", vacancies: "2.4k+", careerUrl: "https://www.ril.com/careers", color: "#005EB8" },
  { id: "in-2", name: "TCS", logo: "tcs.com", vacancies: "4.8k+", careerUrl: "https://www.tcs.com/careers", color: "#1B365D" },
  { id: "in-3", name: "HDFC Bank", logo: "hdfcbank.com", vacancies: "950+", careerUrl: "https://www.hdfcbank.com/personal/about-us/careers", color: "#ED232A" },
  { id: "in-4", name: "Infosys", logo: "infosys.com", vacancies: "1.1k+", careerUrl: "https://www.infosys.com/careers.html", color: "#007CC3" },
  { id: "us-3", name: "Google", logo: "google.com", vacancies: "610+", careerUrl: "https://careers.google.com/", color: "#4285F4" },
  { id: "us-2", name: "Microsoft", logo: "microsoft.com", vacancies: "520+", careerUrl: "https://careers.microsoft.com/", color: "#00A4EF" },
  { id: "us-4", name: "Amazon", logo: "amazon.com", vacancies: "1.5k+", careerUrl: "https://www.amazon.jobs/", color: "#FF9900" },
  { id: "us-5", name: "Meta", logo: "meta.com", vacancies: "400+", careerUrl: "https://www.metacareers.com/", color: "#0668E1" },
];

export default function CompanySuggestions() {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Hiring Giants</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Top companies recruiting now</Text>
        </View>
        <View style={styles.headerBtns}>
          <TouchableOpacity
            style={[styles.hireTalentBtn, { backgroundColor: "#059669" }]}
            onPress={() => router.push("/company-portal" as any)}
          >
            <Feather name="briefcase" size={12} color="#fff" />
            <Text style={styles.hireTalentText}>Hire</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewAllBtn, { backgroundColor: colors.primary + '10' }]}
            onPress={() => router.push("/companies" as any)}
          >
            <Text style={[styles.viewAll, { color: colors.primary }]}>All</Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {COMPANIES.map((company, index) => (
          <Animated.View
            key={company.id}
            entering={FadeInRight.delay(index * 100).duration(800).springify()}
          >
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(company.careerUrl)}
            >
              <View style={[styles.logoWrapper, { borderColor: company.color + '20' }]}>
                <View style={styles.logoCircle}>
                  <Image
                    source={{ uri: `https://icon.horse/icon/${company.logo}` }}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

              <View style={styles.infoArea}>
                <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                  {company.name}
                </Text>
                <View style={styles.vacancyBadge}>
                  <View style={[styles.pulseDot, { backgroundColor: company.color }]} />
                  <Text style={[styles.vacancies, { color: colors.mutedForeground }]}>
                    {company.vacancies}
                  </Text>
                </View>
              </View>

              <View style={[styles.bottomBar, { backgroundColor: company.color }]} />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 2,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: "800",
  },
  headerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hireTalentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  hireTalentText: {
    fontSize: 12,
    fontWeight: "800",
    color: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 10,
  },
  card: {
    width: 130,
    height: 160,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  logoWrapper: {
    padding: 4,
    borderRadius: 22,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  logoCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    elevation: 2,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  infoArea: {
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: "800",
  },
  vacancyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vacancies: {
    fontSize: 10,
    fontWeight: "700",
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 4,
    opacity: 0.8,
  }
});
