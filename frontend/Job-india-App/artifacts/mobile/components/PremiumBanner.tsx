import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';

export default function PremiumBanner() {
  const colors = useColors();

  const PREMIUM_FEATURES = [
    { icon: "zap", text: "Instant Interview Calls", color: "#fbbf24" },
    { icon: "eye", text: "10x Profile Visibility", color: "#fff" },
    { icon: "file-text", text: "AI Resume Optimization", color: "#fff" },
    { icon: "mail", text: "Direct Message to HRs", color: "#fff" },
    { icon: "trending-up", text: "Salary Benchmark Insights", color: "#fff" },
    { icon: "shield", text: "Verified 'Pro' Badge", color: "#fff" },
    { icon: "clock", text: "Early Access to New Jobs", color: "#fff" },
  ];

  return (
    <LinearGradient
      colors={['#0F172A', '#1E3A8A', '#334155']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.badge}>
          <Feather name="award" size={12} color="#fbbf24" />
          <Text style={styles.badgeText}>PRO MEMBER</Text>
        </View>
        <Text style={styles.title}>Unlock Career Boost</Text>
        <Text style={styles.subtitle}>Supercharge your job hunt with exclusive tools</Text>

        <View style={styles.featuresGrid}>
          {PREMIUM_FEATURES.map((f, i) => (
            <View key={i} style={styles.feature}>
              <Feather name={f.icon as any} size={14} color={f.color} />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.btn}
          activeOpacity={0.85}
          onPress={() => router.push("/(tabs)/premium" as any)}
        >
          <LinearGradient
            colors={['#fbbf24', '#f59e0b']}
            style={styles.btnGradient}
          >
            <Text style={styles.btnText}>Upgrade to Premium</Text>
            <Feather name="arrow-right" size={16} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <View style={styles.bgIcon}>
        <Feather name="trending-up" size={120} color="rgba(255,255,255,0.05)" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    zIndex: 1,
  },
  badge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  badgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  featuresGrid: {
    gap: 12,
    marginBottom: 30,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  btn: {
    borderRadius: 14,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  btnGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
  },
  bgIcon: {
    position: 'absolute',
    right: -20,
    top: -20,
  }
});
