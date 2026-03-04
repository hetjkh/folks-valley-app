import { useTheme } from '@/contexts/ThemeContext';
import { ProfileCompletion } from '@/utils/profile-completion';
import { getThemeColors } from '@/utils/theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfileCompletionIndicatorProps {
  completion: ProfileCompletion;
  onPress?: () => void;
}

export default function ProfileCompletionIndicator({ completion, onPress }: ProfileCompletionIndicatorProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const getProgressColor = () => {
    if (completion.percentage >= 80) return '#10b981'; // green
    if (completion.percentage >= 50) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const progressColor = getProgressColor();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>
            Profile Completion
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {completion.percentage}% Complete
          </Text>
        </View>
        <View style={[styles.percentageCircle, { backgroundColor: progressColor + '20' }]}>
          <Text style={[styles.percentageText, { color: progressColor }]}>
            {completion.percentage}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarBackground, { backgroundColor: colors.input }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${completion.percentage}%`,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Suggestions */}
      {completion.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsTitle, { color: colors.textSecondary }]}>
            Suggestions:
          </Text>
          {completion.suggestions.slice(0, 2).map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Ionicons
                name="chevron-forward-outline"
                size={12}
                color={colors.textSecondary}
                style={styles.suggestionIcon}
              />
              <Text style={[styles.suggestionText, { color: colors.textSecondary }]} numberOfLines={1}>
                {suggestion}
              </Text>
            </View>
          ))}
        </View>
      )}

      {completion.percentage === 100 && (
        <View style={styles.completeContainer}>
          <Ionicons name="checkmark-circle" size={14} color="#10b981" />
          <Text style={styles.completeText}>
            Profile complete!
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontFamily: 'Gilroy-SemiBold',
    fontSize: 14,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: 'Gilroy',
    fontSize: 11,
  },
  percentageCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontFamily: 'Gilroy-Bold',
    fontSize: 14,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsTitle: {
    fontFamily: 'Gilroy-SemiBold',
    fontSize: 10,
    marginBottom: 6,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  suggestionIcon: {
    marginRight: 6,
    marginTop: 1,
  },
  suggestionText: {
    fontFamily: 'Gilroy',
    fontSize: 10,
    flex: 1,
  },
  completeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  completeText: {
    fontFamily: 'Gilroy-SemiBold',
    fontSize: 10,
    color: '#10b981',
    marginLeft: 6,
  },
});
