import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../styles/colors';

const LockStatusBanner = ({ 
  isLocked, 
  onToggleLock, 
  canToggleLock, 
  userRole,
  orderStatus 
}) => {
  const showUnlockInfo = isLocked && userRole === 'tailor';
  
  return (
    <View style={[
      styles.container, 
      isLocked ? styles.lockedContainer : styles.unlockedContainer
    ]}>
      <View style={styles.content}>
        <View style={styles.iconTextContainer}>
          <Feather 
            name={isLocked ? "lock" : "unlock"} 
            size={24} 
            color={isLocked ? colors.success : colors.warning} 
          />
          <View style={styles.textContainer}>
            <Text style={[
              styles.title, 
              isLocked ? styles.lockedTitle : styles.unlockedTitle
            ]}>
              {isLocked ? 'Design Locked' : 'Design Unlocked'}
            </Text>
            <Text style={[
              styles.description, 
              isLocked ? styles.lockedText : styles.unlockedText
            ]}>
              {isLocked ? (
                <>
                  The measurements and design are finalized. No further changes can be made unless unlocked.
                  {userRole === 'customer' && ' You can unlock to request changes.'}
                </>
              ) : (
                <>
                  Both parties can edit measurements and notes. 
                  {userRole === 'customer' && ' Lock when you\'re satisfied with the design.'}
                  {userRole === 'tailor' && ' Customer will lock when satisfied.'}
                </>
              )}
            </Text>
          </View>
        </View>
        
        {canToggleLock && (
          <TouchableOpacity
            style={[
              styles.button,
              isLocked ? styles.unlockButton : styles.lockButton
            ]}
            onPress={onToggleLock}
          >
            <Feather 
              name={isLocked ? "unlock" : "lock"} 
              size={16} 
              color={colors.white} 
            />
            <Text style={styles.buttonText}>
              {isLocked ? 'Unlock' : 'Lock'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showUnlockInfo && (
        <View style={styles.tailorInfo}>
          <Feather name="info" size={16} color={colors.info} />
          <Text style={styles.tailorInfoText}>
            Ask the customer to unlock if changes are needed
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderWidth: 2
  },
  lockedContainer: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC'
  },
  unlockedContainer: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D'
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  iconTextContainer: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12
  },
  textContainer: {
    marginLeft: 12,
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  lockedTitle: {
    color: '#166534'
  },
  unlockedTitle: {
    color: '#92400E'
  },
  description: {
    fontSize: 13,
    lineHeight: 18
  },
  lockedText: {
    color: '#15803D'
  },
  unlockedText: {
    color: '#A16207'
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  lockButton: {
    backgroundColor: colors.success
  },
  unlockButton: {
    backgroundColor: colors.warning
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14
  },
  tailorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    gap: 8
  },
  tailorInfoText: {
    fontSize: 12,
    color: colors.info,
    flex: 1
  }
});

export default LockStatusBanner;