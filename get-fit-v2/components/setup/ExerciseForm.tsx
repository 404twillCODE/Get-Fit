/**
 * Reusable exercise input form with autocomplete
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { springConfig } from '../../theme/animations';
import type { ExerciseCategory } from '../../lib/types';
import { searchExercises } from '../../lib/exerciseDatabase';
import { GradientButton } from '../common/GradientButton';

const AnimatedView = Animated.createAnimatedComponent(View);

interface ExerciseFormData {
  name: string;
  categories: ExerciseCategory[];
  sets: number;
  reps: number;
  weight: number;
  breakTime: number;
  notes: string;
}

interface ExerciseFormProps {
  initialData?: Partial<ExerciseFormData>;
  onSubmit: (data: ExerciseFormData) => void;
  onCancel: () => void;
  allowedCategories?: ExerciseCategory[];
}

const categoryOptions: { value: ExerciseCategory; label: string }[] = [
  { value: 'legs', label: 'Legs' },
  { value: 'arms', label: 'Arms' },
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'full_body', label: 'Full Body' },
];

export const ExerciseForm: React.FC<ExerciseFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  allowedCategories,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [selectedCategories, setSelectedCategories] = useState<ExerciseCategory[]>(
    initialData?.categories || []
  );
  const [sets, setSets] = useState(initialData?.sets?.toString() || '3');
  const [reps, setReps] = useState(initialData?.reps?.toString() || '10');
  const [weight, setWeight] = useState(initialData?.weight?.toString() || '0');
  const [breakTime, setBreakTime] = useState(initialData?.breakTime?.toString() || '60');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const slideAnim = useSharedValue(20);
  const opacityAnim = useSharedValue(0);

  useEffect(() => {
    slideAnim.value = withSpring(0, springConfig.gentle);
    opacityAnim.value = withSpring(1, springConfig.gentle);
  }, []);

  useEffect(() => {
    if (name.length > 0) {
      const results = searchExercises(name, selectedCategories.length > 0 ? selectedCategories : undefined);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [name, selectedCategories]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
    opacity: opacityAnim.value,
  }));

  const toggleCategory = (category: ExerciseCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }
    if (selectedCategories.length === 0) {
      return;
    }

    onSubmit({
      name: name.trim(),
      categories: selectedCategories,
      sets: parseInt(sets) || 3,
      reps: parseInt(reps) || 10,
      weight: parseFloat(weight) || 0,
      breakTime: parseInt(breakTime) || 60,
      notes: notes.trim(),
    });
  };

  const availableCategories = allowedCategories
    ? categoryOptions.filter((cat) => allowedCategories.includes(cat.value))
    : categoryOptions;

  return (
    <AnimatedView style={[styles.container, animatedStyle]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Exercise Name *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Start typing to see suggestions..."
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <FlatList
                    data={suggestions}
                    keyExtractor={(item, index) => `${item}-${index}`}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => {
                          setName(item);
                          setShowSuggestions(false);
                        }}
                      >
                        <Text style={styles.suggestionText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    nestedScrollEnabled
                  />
                </View>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Categories *</Text>
            <View style={styles.categoriesContainer}>
              {availableCategories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.value);
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryButton,
                      isSelected && styles.categoryButtonSelected,
                    ]}
                    onPress={() => toggleCategory(cat.value)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && styles.categoryTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Sets</Text>
              <TextInput
                style={styles.input}
                value={sets}
                onChangeText={setSets}
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Reps</Text>
              <TextInput
                style={styles.input}
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Weight (lbs)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Rest (sec)</Text>
              <TextInput
                style={styles.input}
                value={breakTime}
                onChangeText={setBreakTime}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <GradientButton
          title="Save"
          onPress={handleSubmit}
          variant="primary"
          size="medium"
          disabled={!name.trim() || selectedCategories.length === 0}
          style={styles.submitButton}
        />
      </View>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.small,
    color: colors.neonPrimary,
    marginBottom: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.medium,
    padding: spacing.md,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    minHeight: layout.touchTargetMin,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.neonPrimary,
    borderRadius: layout.borderRadius.medium,
    marginTop: spacing.xs,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 10,
  },
  suggestionItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.body,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: layout.borderRadius.small,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryButtonSelected: {
    borderColor: colors.neonPrimary,
    backgroundColor: colors.neonPrimary + '20',
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.small,
  },
  categoryTextSelected: {
    color: colors.neonPrimary,
    fontWeight: typography.weights.semibold,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: layout.borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
  },
  submitButton: {
    flex: 1,
  },
});

