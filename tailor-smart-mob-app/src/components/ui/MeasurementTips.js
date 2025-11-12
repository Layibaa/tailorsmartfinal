// components/ui/MeasurementTips.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../styles/colors';

const MeasurementTips = ({ garmentType, onClose }) => {
  const getTips = () => {
    const commonTips = [
      {
        title: 'Stand Straight',
        description: 'Keep your posture natural and relaxed',
        icon: 'user'
      },
      {
        title: 'Use a Cloth Tape',
        description: 'Fabric measuring tape gives the most accurate results',
        icon: 'activity'
      },
      {
        title: 'Measure Twice',
        description: 'Take each measurement at least twice to confirm accuracy',
        icon: 'repeat'
      }
    ];

    const specificTips = {
      kameez: [
        {
          title: 'Chest',
          description: 'Measure around the fullest part of your chest, under your arms',
          icon: 'square'
        },
        {
          title: 'Shoulder',
          description: 'Measure from one shoulder point to the other across your back',
          icon: 'trending-up'
        },
        {
          title: 'Sleeve',
          description: 'Measure from shoulder to wrist with arm slightly bent',
          icon: 'arrow-right'
        }
      ],
      shalwar: [
        {
          title: 'Waist',
          description: 'Measure around your natural waistline (belly button level)',
          icon: 'minimize-2'
        },
        {
          title: 'Hip',
          description: 'Measure around the fullest part of your hips',
          icon: 'circle'
        },
        {
          title: 'Inseam',
          description: 'Measure from crotch to ankle along the inside of your leg',
          icon: 'arrow-down'
        }
      ]
    };

    return [...commonTips, ...(specificTips[garmentType] || [])];
  };

  const tips = getTips();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Measurement Tips</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {tips.map((tip, index) => (
          <View key={index} style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Feather name={tip.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipDescription}>{tip.description}</Text>
            </View>
          </View>
        ))}

        <View style={styles.noteCard}>
          <Feather name="alert-circle" size={20} color={colors.primary} />
          <Text style={styles.noteText}>
            For the most accurate fit, consider visiting your tailor for professional measurements.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black
  },
  closeButton: {
    padding: 8
  },
  content: {
    flex: 1,
    padding: 16
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  tipContent: {
    flex: 1
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4
  },
  tipDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    alignItems: 'flex-start'
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: colors.darkGray,
    marginLeft: 12,
    lineHeight: 20
  }
});

export default MeasurementTips;