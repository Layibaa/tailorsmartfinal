import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../styles/colors';

const ChangeHistory = ({ changes }) => {
  if (!changes || changes.length === 0) return null;

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="clock" size={18} color={colors.gray} />
        <Text style={styles.headerText}>Recent Changes</Text>
      </View>
      
      <ScrollView style={styles.changesList}>
        {changes.map((change, idx) => (
          <View key={idx} style={styles.changeItem}>
            <View style={styles.iconContainer}>
              <Feather 
                name={
                  change.action.includes('locked') ? 'lock' :
                  change.action.includes('unlocked') ? 'unlock' :
                  change.action.includes('updated') ? 'edit-3' :
                  'user'
                } 
                size={14} 
                color={colors.primary} 
              />
            </View>
            <View style={styles.changeContent}>
              <Text style={styles.changeText}>
                <Text style={styles.userName}>{change.userName}</Text>
                {' '}
                <Text style={styles.actionText}>{change.action}</Text>
              </Text>
              <Text style={styles.timeText}>
                {formatTime(change.timestamp)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black
  },
  changesList: {
    maxHeight: 200
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  changeContent: {
    flex: 1
  },
  changeText: {
    fontSize: 14,
    lineHeight: 20
  },
  userName: {
    fontWeight: '600',
    color: colors.black
  },
  actionText: {
    color: colors.darkGray
  },
  timeText: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2
  }
});

export default ChangeHistory;
